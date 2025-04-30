import * as PM from "./ProjectModel"
import * as FsUtils from "@lib/utils/FsUtils"
import process from "node:process"
import {packageDirectorySync} from "pkg-dir"
import {pathToFileURL} from "url"
import * as PC from "./ProjectConfig"
import * as esbuild from "esbuild"
import os from "node:os"
import path from "node:path"
import fs from "node:fs"

export async function createProjectModel({
  curdir,
}: {
  curdir?: string
}): Promise<PM.ProjectModel> {
  const projectRoot = getProjectRoot(curdir)
  // FIXME - filename is null, or specified by the config
  const config = await readHanbokConfig(projectRoot, null)
  const devenv = await getDevEnv(config)
  const lib = getLibConfig(config, projectRoot)
  const test = getTestConfig(config, projectRoot)
  const services = getServicesConfig(config, projectRoot)
  const webapps = getWebappsConfig(config, projectRoot)
  return {
    projectRoot,
    devenv,
    features: {
      lib,
      test,
      services,
      webapps,
    },
  }
}

function getDevEnv(config: PC.ProjectConfig): PM.DevEnv {
  switch (config.type) {
    case "App":
      return {
        devServer: getDevServer(config.devenv.devServer),
        apiServer: getApiServer(config.devenv.apiServer),
        previewServer: getPreviewServer(config.devenv.previewServer),
      }
    case "Suite": {
      return {
        devServer: null,
        apiServer: null,
        previewServer: null,
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

function getApiServer(
  config: PC.ApiServer | null | undefined
): PM.ApiServer | null {
  if (config == null) {
    return null
  } else {
    return {
      port: config.port,
    }
  }
}

function getPreviewServer(
  config: PC.PreviewServer | null | undefined
): PM.PreviewServer | null {
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
): PM.LibConfig | null {
  switch (projectConfig.type) {
    case "App": {
      const configLib = projectConfig.features?.lib
      if (configLib !== true) {
        return null
      }
      const libFile = path.join(projectRoot, "src", "lib.ts")
      const libTypesFile = path.join(projectRoot, "src", "lib-types.ts")
      if (!FsUtils.isFile(libFile)) {
        console.log(
          `Warning: projectConfig.features.lib is set, but there is no "src/lib.ts" file`
        )
        return null
      }
      return {
        libFile,
        libTypesFile: FsUtils.isFile(libTypesFile) ? libTypesFile : null,
      }
    }
    case "Suite": {
      // FIXME - implement this
      return null
    }
  }
}

function getTestConfig(
  projectConfig: PC.ProjectConfig,
  projectRoot: string
): PM.TestConfig | null {
  switch (projectConfig.type) {
    case "App": {
      const configTest = projectConfig.features?.test
      if (configTest !== true) {
        return null
      }
      const testFile = path.join(projectRoot, "test", "test.ts")
      if (!FsUtils.isFile(testFile)) {
        console.log(
          `Warning: projectConfig.features.test is set, but there is no "test/test.ts" file`
        )
        return null
      }
      return {
        testFile,
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
): PM.ServicesConfig | null {
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
      const ret: PM.ServicesConfig = {}
      for (const name of serviceNames) {
        const servicePath = path.join(servicesPath, name)
        let prisma: PM.PrismaConfig | null = null
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
): PM.WebappsConfig | null {
  switch (projectConfig.type) {
    case "App": {
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
      const ret: PM.WebappsConfig = {}
      for (const name of webappNames) {
        const webappPath = path.join(webappsPath, name)
        const builtWebappRoot = path.resolve(
          projectRoot,
          "dist",
          "webapps",
          name
        )
        // In the dev server, each webapp appears under `/{webapp name}`
        const devServerBase = `/${name}/`
        const devServerRoute = `/${name}`
        const viteProjectRoot = path.join(webappPath, "ui")

        // Check for a DevApiServer
        const devApiServerSourcePath = path.join(
          webappPath,
          "server",
          "DevApiServer.ts"
        )
        const devApiServerBuiltPath = path.resolve(
          projectRoot,
          "dist",
          "webapp-dev-servers",
          name,
          "DevApiServer.es.js"
        )
        const devApiServer = FsUtils.isFile(devApiServerSourcePath)
          ? {
              sourcePath: devApiServerSourcePath,
              builtPath: devApiServerBuiltPath,
            }
          : null

        ret[name] = {
          name,
          path: webappPath,
          viteProjectRoot,
          builtWebappRoot,
          devServerBase,
          devServerRoute,
          devApiServer,
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
