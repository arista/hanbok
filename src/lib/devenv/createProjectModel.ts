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
  const lib = getLibConfig(config, projectRoot)
  return {
    projectRoot,
    config,
    features: {
      lib,
    },
  }
}

// Return the root of the project, from the specified directory, or
// the current working directory if not specified
function getProjectRoot(curdir: string | undefined): string {
  const dir = curdir ?? process.cwd()
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
    packages: "bundle",
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
