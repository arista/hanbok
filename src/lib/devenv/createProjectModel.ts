import * as PM from "./ProjectModel"
import * as FsUtils from "@lib/utils/FsUtils"
import process from "node:process"
import {packageDirectorySync} from "pkg-dir"
import {pathToFileURL} from "url"
import * as PC from "./ProjectConfig"
import * as esbuild from "esbuild"
import path from "node:path"
import fs from "node:fs"
import {createRequire} from "node:module"

export async function createProjectModel({
  curdir,
}: {
  curdir?: string
}): Promise<PM.ProjectModel> {
  const projectRoot = getProjectRoot(curdir)
  // FIXME - filename is null, or specified by the config
  const config = await readHanbokConfig(projectRoot, null)
  return parseProjectConfig({config, projectRoot})
}

export async function parseProjectConfig({
  config,
  projectRoot,
}: {
  config: PC.ProjectConfig
  projectRoot: string
}): Promise<PM.ProjectModel> {
  const source = getSourceConfig(config, projectRoot)
  const hanbokSource = getHanbokSourceConfig(config, projectRoot)
  const devenv = await getDevEnv(config)
  const lib = getLibConfig(config, projectRoot)
  const test = getTestConfig(config, projectRoot)
  const services = getServicesConfig(config, projectRoot)
  const webapps = getWebappsConfig(config, projectRoot)
  const cdk = getCdkConfig(config, projectRoot)
  const suite = await getSuiteConfig(config, projectRoot)
  return {
    name: config.name,
    type: config.type,
    source,
    hanbokSource,
    projectRoot,
    devenv,
    features: {
      lib,
      test,
      services,
      webapps,
      cdk,
    },
    suite,
  }
}

function getSourceConfig(
  config: PC.ProjectConfig,
  projectRoot: string
): PM.SourceModel | null {
  const sourceConfig = config.source
  if (sourceConfig == null) {
    return null
  }
  switch (sourceConfig.type) {
    case "Github": {
      const {owner, repo, codestarConnectionArnParamName} = sourceConfig
      return {
        type: "Github",
        codestarConnectionArnParamName,
        owner,
        repo,
      }
    }
  }
}

function getHanbokSourceConfig(
  config: PC.ProjectConfig,
  projectRoot: string
): PM.SourceModel | null {
  const sourceConfig = config.hanbokSource
  if (sourceConfig == null) {
    return null
  }
  switch (sourceConfig.type) {
    case "Github": {
      const {owner, repo, codestarConnectionArnParamName} = sourceConfig
      return {
        type: "Github",
        codestarConnectionArnParamName,
        owner,
        repo,
      }
    }
  }
}

function getDevEnv(config: PC.ProjectConfig): PM.DevEnv {
  switch (config.type) {
    case "App":
      return {
        devServer: getDevServer(config.devenv.devServer),
        appServer: getAppServer(config.devenv.appServer),
      }
    case "Suite": {
      return {
        devServer: null,
        appServer: null,
      }
    }
  }
}

function getDevServer(
  config: PC.DevServer | null | undefined
): PM.DevServer | null {
  if (config == null) {
    return null
  } else {
    return {
      port: config.port,
    }
  }
}

function getAppServer(
  config: PC.AppServer | null | undefined
): PM.AppServer | null {
  if (config == null) {
    return null
  } else {
    return {
      port: config.port,
    }
  }
}

// Return the root of the project, from the specified directory, or
// the current working directory if not specified
function getProjectRoot(curdir: string | undefined): string {
  const dir = curdir ?? process.env["HANBOK_CWD"] ?? process.cwd()
  const ret = packageDirectorySync({cwd: dir})
  if (ret == null) {
    throw new Error(
      `Current directory is not under a project (no package.json found in ancestors)`
    )
  } else {
    return ret
  }
}

// Returns the location of the hanbok.config.ts file, which might be
// specified explicitly, or implied relative to the project root
function getHanbokConfigLocation(projectRoot: string, filename: string | null) {
  return filename ?? path.join(projectRoot, "hanbok.config.ts")
}

// Reads the hanbok.config.ts file, running it through esbuild and
// writing the result to a temporary file, then importing that file
// and taking its default
async function readHanbokConfig(
  projectRoot: string,
  filename: string | null
): Promise<PC.ProjectConfig> {
  // The resulting temporary file must be located somewhere under the
  // project root, so that when that file is imported, node is able to
  // resolve any packages that the configuration file itself imported.
  const outdir = path.join(projectRoot, "node_modules", ".hanbok-temp")
  const outfile = path.join(outdir, "config.mjs")
  const configPath = getHanbokConfigLocation(projectRoot, filename)

  await esbuild.build({
    entryPoints: [configPath],
    outfile,
    bundle: true,
    format: "esm",
    platform: "node",
    packages: "external",
    sourcemap: false,
    external: [],
  })

  // Read in the generated file
  const config = await import(pathToFileURL(outfile).href)
  // FIXME - do we want to typecheck it with zod?
  return config.default
}

function getLibConfig(
  projectConfig: PC.ProjectConfig,
  projectRoot: string
): PM.LibModel | null {
  switch (projectConfig.type) {
    case "App":
    case "Suite":
      const configLib = projectConfig.features?.lib
      if (configLib !== true) {
        return null
      }
      const sourcePath = path.join(projectRoot, "src", "lib.ts")
      const typesSourcePath = path.join(projectRoot, "src", "lib-types.ts")
      const builtPath = path.join(projectRoot, "dist", "lib", "lib.es.js")
      if (!FsUtils.isFile(sourcePath)) {
        console.log(
          `Warning: projectConfig.features.lib is set, but there is no "src/lib.ts" file`
        )
        return null
      }
      return {
        sourcePath,
        typesSourcePath: FsUtils.isFile(typesSourcePath)
          ? typesSourcePath
          : null,
        builtPath,
      }
  }
  // case "Suite": {
  //   // FIXME - implement this
  //   return null
  // }
  //  }
}

function getTestConfig(
  projectConfig: PC.ProjectConfig,
  projectRoot: string
): PM.TestModel | null {
  switch (projectConfig.type) {
    case "App": {
      const configTest = projectConfig.features?.test
      if (configTest !== true) {
        return null
      }
      const sourcePath = path.join(projectRoot, "test", "test.ts")
      const builtPath = path.join(projectRoot, "dist", "test", "test.es.js")
      if (!FsUtils.isFile(sourcePath)) {
        console.log(
          `Warning: projectConfig.features.test is set, but there is no "test/test.ts" file`
        )
        return null
      }
      return {
        sourcePath,
        builtPath,
      }
    }
    case "Suite": {
      // FIXME - implement this
      return null
    }
  }
}

function getServicesConfig(
  projectConfig: PC.ProjectConfig,
  projectRoot: string
): PM.ServicesModel | null {
  switch (projectConfig.type) {
    case "App": {
      const servicesPath = path.join(projectRoot, "src", "services")
      if (!FsUtils.isDirectory(servicesPath)) {
        return null
      }
      const serviceNames = fs.readdirSync(servicesPath).filter((f) => {
        const ff = path.join(servicesPath, f)
        return FsUtils.isDirectory(ff)
      })
      if (serviceNames.length === 0) {
        return null
      }
      const ret: PM.ServicesModel = {}
      for (const name of serviceNames) {
        const servicePath = path.join(servicesPath, name)
        let prisma: PM.PrismaModel | null = null
        const schemaFile = path.join(servicePath, "prisma", "schema.prisma")
        if (FsUtils.isFile(schemaFile)) {
          const schemaFileContents = fs.readFileSync(schemaFile).toString()
          // See if the prisma file includes the marker that causes it
          // to require injecting the header
          const injectSchemaHeader = schemaFileContents.includes(
            PM.PRISMA_SCHEMA_INJECTION_POINT
          )
          // Where the schema file ends up built after injection
          // (whether injection is used or not)
          const builtSchemaFile = path.join(
            projectRoot,
            "build",
            "services",
            name,
            "prisma",
            "schema.prisma"
          )
          prisma = {schemaFile, builtSchemaFile, injectSchemaHeader}
        }
        ret[name] = {name, path: servicePath, prisma}
      }
      return ret
    }
    case "Suite": {
      // FIXME - implement this
      return null
    }
  }
}

function getWebappsConfig(
  projectConfig: PC.ProjectConfig,
  projectRoot: string
): PM.WebappsModel | null {
  switch (projectConfig.type) {
    case "App": {
      const webappsConfig = projectConfig.features?.webapps
      if (webappsConfig == null) {
        return null
      }
      const webappsPath = path.join(projectRoot, "src", "webapps")
      if (!FsUtils.isDirectory(webappsPath)) {
        return null
      }
      const webappNames = fs.readdirSync(webappsPath).filter((f) => {
        const ff = path.join(webappsPath, f)
        return FsUtils.isDirectory(ff)
      })
      if (webappNames.length === 0) {
        return null
      }
      const ret: PM.WebappsModel = {}
      for (const name of webappNames) {
        const webappConfig = webappsConfig[name]
        const webappPath = path.join(webappsPath, name)
        const builtWebappRoot = path.resolve(
          projectRoot,
          "dist",
          "webapps",
          name
        )
        const viteManifestPath = path.resolve(
          builtWebappRoot,
          ".vite",
          "manifest.json"
        )
        // In the dev server, each webapp appears under `/{webapp name}`
        const devServerBase = `/${name}/`
        const devServerRoute = `/${name}`
        const viteProjectRoot = path.join(webappPath, "ui")
        const indexHtmlPath = path.join(viteProjectRoot, "index.html")

        // Check for a DevAppServer
        const devAppServerSourcePath = path.join(
          webappPath,
          "server",
          "DevAppServer.ts"
        )
        const devAppServerBuiltPath = path.resolve(
          projectRoot,
          "dist",
          "app-servers",
          name,
          "DevAppServer.es.js"
        )
        const devAppServer = FsUtils.isFile(devAppServerSourcePath)
          ? {
              sourcePath: devAppServerSourcePath,
              builtPath: devAppServerBuiltPath,
            }
          : null

        const hostingInfo = (() => {
          if (webappConfig == null) {
            return null
          }
          const {hostedZone, hostname} = webappConfig
          return {
            hostedZone,
            hostname,
          }
        })()

        ret[name] = {
          name,
          path: webappPath,
          viteProjectRoot,
          indexHtmlPath,
          builtWebappRoot,
          viteManifestPath,
          devServerBase,
          devServerRoute,
          devAppServer,
          hostingInfo,
        }
      }
      return ret
    }
    case "Suite": {
      // FIXME - implement this
      return null
    }
  }
}

function getCdkConfig(
  projectConfig: PC.ProjectConfig,
  projectRoot: string
): PM.CdkModel | null {
  switch (projectConfig.type) {
    case "App":
    case "Suite": {
      const cdkConfig = projectConfig.features?.cdk
      if (cdkConfig !== true) {
        return null
      }
      const sourcePath = path.join(projectRoot, "src", "cdk.ts")
      const builtPath = path.join(projectRoot, "dist", "cdk", "cdk.es.js")
      return {
        sourcePath,
        builtPath,
      }
    }
  }
}

async function getSuiteConfig(
  projectConfig: PC.ProjectConfig,
  projectRoot: string
): Promise<PM.ProjectModel | null> {
  switch (projectConfig.type) {
    case "App": {
      const suiteConfig = projectConfig.suite
      if (suiteConfig == null) {
        return null
      }
      const {name} = suiteConfig
      const require = createRequire(`${projectRoot}/package.json`)
      const suitePackagePath = require.resolve(`${name}/package.json`)
      const suiteDir = path.dirname(suitePackagePath)
      const suiteConfigPath = path.join(suiteDir, "hanbok.config.ts")
      const suite = await readHanbokConfig(suiteDir, suiteConfigPath)
      return await parseProjectConfig({config: suite, projectRoot: suiteDir})
    }
    case "Suite": {
      return null
    }
  }
}
