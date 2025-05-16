import * as PM from "../devenv/ProjectModel"
import path from "node:path"
import fs from "node:fs"
import {spawn} from "node:child_process"
import * as NU from "../utils/NameUtils"
import * as AU from "../utils/AwsUtils"

export async function runPrisma({
  projectModel,
  service,
  args,
  databaseUrl,
}: {
  projectModel: PM.ProjectModel
  service: PM.ServiceModel
  args?: Array<string>
  databaseUrl?: string
}) {
  const serviceName = service.name
  const projectRoot = projectModel.projectRoot
  if (service.prisma != null) {
    const {schemaFile, builtSchemaFile, injectSchemaHeader} = service.prisma

    // Copy or generate the schema file with injected header
    const builtSchemaDir = path.dirname(builtSchemaFile)
    fs.mkdirSync(builtSchemaDir, {recursive: true})
    const contents = fs.readFileSync(schemaFile).toString()
    if (injectSchemaHeader) {
      const prismaDest = path.join(
        projectRoot,
        "node_modules",
        "prisma-app-client",
        serviceName
      )
      const injectLines = [
        `generator client {`,
        `  provider = "prisma-client-js"`,
        `  // Include "rhel-openssl-3.0.x" for Amazon Linux 2023`,
        `  binaryTargets = ["native", "rhel-openssl-3.0.x"]`,
        `  output = "${prismaDest}"`,
        `}`,
        ``,
        `datasource db {`,
        `  provider = "mysql"`,
        `  url      = env("DATABASE_URL_${serviceName}")`,
        `}`,
        ``,
      ]
      const injectStr = injectLines.join("\n")
      const newContents = contents.replace(
        PM.PRISMA_SCHEMA_INJECTION_POINT,
        injectStr
      )
      fs.writeFileSync(builtSchemaFile, newContents)
    } else {
      fs.writeFileSync(builtSchemaFile, contents)
    }

    const env: Record<string, string | undefined> = {
      ...process.env,
    }
    if (databaseUrl != null) {
      env[`DATABASE_URL_${serviceName}`] = databaseUrl
    }
    const cmdArgs = ["prisma", ...(args ?? []), `--schema=${builtSchemaFile}`]

    // Run prisma
    await new Promise<void>((resolve, reject) => {
      const proc = spawn("npx", cmdArgs, {
        cwd: projectRoot,
        env,
        stdio: "inherit",
        shell: true,
      })

      proc.on("exit", (code) => {
        if (code === 0) resolve()
        else reject(new Error(`prisma generate exited with code ${code}`))
      })
    })
  }
}

export function devDatabaseUrl({
  projectModel,
  service,
}: {
  projectModel: PM.ProjectModel
  service: PM.ServiceModel
}): string {
  if (projectModel.suite == null) {
    throw new Error(`project config does not specify a suite`)
  }
  const suiteName = projectModel.suite.name
  const appName = projectModel.name
  const serviceName = service.name
  const databaseName = NU.toDevServiceDatabaseName(
    suiteName,
    appName,
    serviceName
  )

  const localDev = projectModel.suite?.features?.db?.localDev
  if (localDev == null) {
    throw new Error("project config does not specify features.db.localDev")
  }
  const {hostname, port, username, password} = localDev
  return `mysql://${username}:${password}@${hostname}:${port}/${databaseName}`
}

export async function backendDatabaseUrl({
  projectModel,
  backend,
  service,
}: {
  projectModel: PM.ProjectModel
  backend: string
  service: PM.ServiceModel
}): Promise<string> {
  if (projectModel.suite == null) {
    throw new Error(`project config does not specify a suite`)
  }
  const suiteName = projectModel.suite.name
  const appName = projectModel.name
  const serviceName = service.name
  const databaseName = NU.toBackendServiceDatabaseName(
    suiteName,
    appName,
    backend,
    serviceName
  )

  const deployed = projectModel.suite?.features?.db?.deployed
  if (deployed == null) {
    throw new Error("project config does not specify features.db.deployed")
  }

  // FIXME - abstract this out
  const appDatabasesPrefix = NU.toAppDatabasesPrefix(suiteName, appName)
  const prefix = NU.toDashedName([suiteName, appName], (s) =>
    NU.toAlphanumDash(s, 65)
  )
  const secretExportName = `${prefix}:db:credentials:secret-name`
  const secretName = await AU.readCloudFormationExport(secretExportName)
  const secretValue = JSON.parse(await AU.getSecretValue(secretName))
  const {username, password} = secretValue
  const hostname = "127.0.0.1"

  const port = deployed.bastionPort
  return `mysql://${username}:${password}@${hostname}:${port}/${databaseName}`
}
