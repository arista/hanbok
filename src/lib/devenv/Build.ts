import * as vite from "vite"
import * as PM from "@lib/devenv/ProjectModel"
import {createProjectModel} from "@lib/devenv/createProjectModel"
import {rollup} from "rollup"
import dts from "rollup-plugin-dts"
import ts from "typescript"
import fs from "node:fs"
import path from "node:path"
import * as esbuild from "esbuild"
import * as ProcUtils from "@lib/utils/ProcUtils"
import {spawn} from "node:child_process"
import chokidar from "chokidar"
import react from "@vitejs/plugin-react"

export class Build {
  constructor(public props: {watch: boolean; model?: PM.ProjectModel}) {}

  get watch() {
    return this.props.watch
  }

  async run() {
    const model = this.props.model ?? (await createProjectModel({}))
    if (this.watch) {
      await this.runWatch(model)
    } else {
      await this.runOnce(model)
    }
  }

  async runOnce(model: PM.ProjectModel) {
    await this.runPrisma(model)
    await this.runTsc(model)
    await this.runEsbuild(model)
    await this.runRollup(model)
    await this.runVite(model)
  }

  async runWatch(model: PM.ProjectModel) {
    await ProcUtils.runAllWatchers([
      {name: "prisma", fn: async () => await this.runPrismaWatch(model)},
      {name: "tsc", fn: async () => await this.runTscWatch(model)},
      {name: "esbuild", fn: async () => await this.runEsbuild(model)},
      {name: "rollup-types", fn: async () => await this.runRollupWatch(model)},
      {name: "vite", fn: async () => await this.runVite(model)},
    ])
  }

  // Runs prisma for each of the schemas
  async runPrisma(model: PM.ProjectModel) {
    const {projectRoot} = model
    const services = model.features.services
    if (services != null) {
      for (const service of Object.values(services)) {
        const serviceName = service.name
        if (service.prisma != null) {
          const {schemaFile, builtSchemaFile, injectSchemaHeader} =
            service.prisma

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

          // Run prisma
          await new Promise<void>((resolve, reject) => {
            const proc = spawn(
              "npx",
              ["prisma", "generate", `--schema=${builtSchemaFile}`],
              {
                cwd: projectRoot,
                stdio: "inherit",
                shell: true,
              }
            )

            proc.on("exit", (code) => {
              if (code === 0) resolve()
              else reject(new Error(`prisma generate exited with code ${code}`))
            })
          })
        }
      }
    }
  }

  // Run prisma in watch mode
  async runPrismaWatch(model: PM.ProjectModel) {
    const {projectRoot} = model
    const watchPath = path.join(projectRoot, `src/services`)
    const watcher = chokidar.watch(watchPath, {
      persistent: true,
      ignoreInitial: true,
      ignored: (path, stats) => {
        return (stats?.isFile() && !path.endsWith("/schema.prisma")) ?? false
      },
    })

    const rebuild = async () => {
      console.log("[prisma] Regenerating prisma client")
      try {
        await this.runPrisma(model)
      } catch (err) {
        console.error("[prisma] Failed:", err)
      }
    }

    watcher.on("change", rebuild)
    watcher.on("ready", rebuild)

    return async () => {
      console.log("[prisma] Cleaning up...")
      await watcher.close()
    }
  }

  // Run the typescript compiler to do type-checking, and to generate
  // .d.ts files that will later be used by rollup to generate the
  // final lib.d.ts
  async runTsc(model: PM.ProjectModel) {
    // Prepare to run tsc
    const config = this.generateParsedTsconfig(model)
    const program = ts.createProgram(config.fileNames, config.options)

    // Run tsc, capture errors
    const emitResult = program.emit()
    const allDiagnostics = ts
      .getPreEmitDiagnostics(program)
      .concat(emitResult.diagnostics)
    if (allDiagnostics.length > 0) {
      const formatted = ts.formatDiagnosticsWithColorAndContext(
        allDiagnostics,
        ts.createCompilerHost(config.options)
      )
      console.error(formatted)
    }

    // Throw if there are any errors
    const hasErrors = allDiagnostics.some(
      (d) => d.category === ts.DiagnosticCategory.Error
    )
    if (hasErrors) {
      throw new Error("TypeScript compilation failed with errors.")
    }
  }

  // Same as runTsc, but in watch mode
  async runTscWatch(model: PM.ProjectModel) {
    // Prepare to run tsc
    const config = this.generateParsedTsconfig(model)
    const host = ts.createWatchCompilerHost(
      config.fileNames,
      config.options,
      ts.sys,
      ts.createEmitAndSemanticDiagnosticsBuilderProgram,
      (diagnostic) => {
        console.error(
          ts.formatDiagnosticsWithColorAndContext(
            [diagnostic],
            ts.createCompilerHost({})
          )
        )
      },
      () => {
        console.log("[tsc] Build complete")
      }
    )
    const program = ts.createWatchProgram(host)

    return async () => {
      // No formal shutdown API, but cleanup can be forced
      console.log("[tsc] Cleaning up...")
    }
  }

  generateTsconfigPaths(): Record<string, Array<string>> {
    // FIXME - implement this
    return {}
  }

  generateEsbuildTsconfigRaw(): esbuild.TsconfigRaw {
    return {
      compilerOptions: {
        jsx: "preserve",
        paths: this.generateTsconfigPaths(),
        strict: true,
        target: "esnext",
      },
    }
  }

  generateTsconfig(model: PM.ProjectModel): TsconfigJson {
    const {projectRoot} = model
    const libTypesFile = model.features.lib?.libTypesFile
    const generateTypes = libTypesFile != null
    const generateTest = model.features.test != null

    // Additional options and files to add depending on whether we're
    // generating .d.ts files or not
    const generateOptions = generateTypes
      ? {
          outDir: "./build/tsc",
          declaration: true,
          emitDeclarationOnly: true,
          declarationDir: "./build/tsc",
        }
      : {
          noEmit: true,
        }

    const compilerOptions = {
      // Bring in the settings also required by esbuild
      ...this.generateEsbuildTsconfigRaw().compilerOptions,

      baseUrl: ".",
      tsBuildInfoFile: path.join(
        projectRoot,
        "build",
        "tmp",
        "tsconfig.app.tsbuildinfo"
      ),

      // Module resolution and code generation
      moduleResolution: "bundler",
      module: "esnext",
      esModuleInterop: true,

      // For type-generation, if requested
      ...generateOptions,

      // linting features
      exactOptionalPropertyTypes: false,
      noFallthroughCasesInSwitch: true,
      noImplicitOverride: true,
      noImplicitReturns: true,
      noPropertyAccessFromIndexSignature: true,
      noUncheckedIndexedAccess: true,
      noUncheckedSideEffectImports: true,
      resolveJsonModule: true,
      allowJs: true,
      checkJs: true,
      isolatedModules: true,
    }

    const include: Array<string> = []
    if (generateTypes) {
      // Sometimes the "lib-types.ts" file needs to be included
      // explicitly, otherwise tsc might not generate its .d.ts file
      // if it only contains types
      include.push(libTypesFile)
    }
    include.push("src/**/*")
    if (generateTest) {
      include.push("test/**/*")
    }

    return {
      compilerOptions,
      include,
    }
  }

  generateParsedTsconfig(model: PM.ProjectModel) {
    const tsconfig = this.generateTsconfig(model)
    const config = ts.parseJsonConfigFileContent(
      tsconfig,
      ts.sys,
      model.projectRoot
    )
    if (config.errors.length > 0) {
      const host = ts.createCompilerHost(config.options)
      const formatted = ts.formatDiagnosticsWithColorAndContext(
        config.errors,
        host
      )
      console.error("TSConfig parse errors:\n" + formatted)
      throw new Error("Failed to parse tsconfig")
    }
    return config
  }

  // Run esbuild to generate all of the bundles that will be used in a
  // node-based environment: cli, test, lib, lambda, etc.  The
  // web-environment bundles will be generated separately by vite
  async runEsbuild(model: PM.ProjectModel) {
    const {projectRoot} = model
    const libFile = model.features.lib?.libFile
    const testFile = model.features.test?.testFile

    // generate the metafile that tracks what was bundled and why
    // FIXME - make this configurable
    const generateMetafile = false

    const builds: Array<EsbuildTarget> = []
    // Add the "lib" build
    if (libFile != null) {
      builds.push({
        entry: libFile,
        out: path.join(projectRoot, "dist", "lib", "lib.es.js"),
        format: "esm",
      })
    }
    // Add the "test" build
    if (testFile != null) {
      builds.push({
        entry: testFile,
        out: path.join(projectRoot, "dist", "test", "test.es.js"),
        format: "esm",
      })
    }

    const tsconfig = this.generateEsbuildTsconfigRaw()

    // { entry: "src/cli/cli.ts", out: "dist/cli/cli.es.js", format: "esm" },
    // // FIXME - have it scan through the webapps directory automatically
    // {
    //   entry: "src/webapps/main/server/WebappLambda.ts",
    //   out: "dist/webapp-servers/main/webapp-lambda/WebappLambda.cjs",
    //   format: "cjs",
    //   isLambda: true,
    // },

    // In the node environment, the generated prisma client can't be
    // bundled with the application code, otherwise it results in
    // errors like 'Error: Dynamic require of "node:fs" is not
    // supported'.  To get around this, we need esbuild to exclude
    // this code, but still be able to access it at runtime.  The only
    // way I've found to do this is:
    //
    //   * have prisma generate the files directly into node_modules under the name "prisma-app-client" (specified in the schema.prisma files)
    //   * have the TS files import "prisma-app-client/{service}/index.js" (which will be found under node_modules)
    //   * have esbuild exclude "prisma-app-client" from the bundle
    //   * when bundling the lambda, create a "node_modules" dir and copy in the prisma-app-client and @prisma/client directories
    const prismaExcludes = ["@prisma/client", "prisma-app-client"]

    await Promise.all(
      builds.map(async (b) => {
        const {entry, out, format, isLambda} = b
        const context = await esbuild.context({
          entryPoints: [entry],
          bundle: true,
          outfile: out,
          platform: "node",
          target: "node18",
          packages: isLambda ? "bundle" : "external",
          external: isLambda ? ["aws-sdk"] : [...prismaExcludes],
          sourcemap: true,
          format,
          logLevel: "info",
          tsconfigRaw: tsconfig,
          metafile: generateMetafile,
        })
        // Do an initial build
        console.log(`[esbuild] Running initial build`)
        const result = await context.rebuild()
        if (generateMetafile) {
          fs.writeFileSync(
            `${out}.metafile.json`,
            JSON.stringify(result.metafile, null, 2)
          )
        }
        console.log(`[esbuild] Initial build complete`)
        if (this.watch) {
          await context.watch()

          return async () => {
            console.log("[esbuild] Cleaning up...")
            await context.dispose()
          }
        } else {
          await context.dispose()
          return null
        }
      })
    )
  }

  // Run rollup to generate the lib.d.ts types declaration file
  // generated from lib-types.d.ts, typically distributed alongside
  // lib.es.js
  async runRollup(model: PM.ProjectModel) {
    const {projectRoot} = model
    const libTypesFile = model.features.lib?.libTypesFile
    const generateTypes = libTypesFile != null
    const generateTest = model.features.test != null

    if (generateTypes) {
      // If we're using the test/ directory, then tsc will put the
      // results in "build/tsc/{src,test}".  Otherwise it just puts
      // them under "build/tsc/".  It's a quirk of tsc, which
      // basically looks for a common root of its input files and uses
      // that to decide where to put the output files
      const input = generateTest
        ? "build/tsc/src/lib-types.d.ts"
        : "build/tsc/lib-types.d.ts"

      const bundle = await rollup({
        input,
        plugins: [
          dts({
            respectExternal: true,
            compilerOptions: {
              baseUrl: "./build/tsc",
              paths: this.generateTsconfigPaths(),
            },
          }),
        ],
      })

      await bundle.write({
        file: "dist/lib/lib.d.ts",
        format: "es",
      })

      await bundle.close()
    }
  }

  // Run rollup in watch mode
  async runRollupWatch(model: PM.ProjectModel) {
    const {projectRoot} = model
    const watchPath = path.join(projectRoot, `build/tsc`)
    const watcher = chokidar.watch(watchPath, {
      persistent: true,
      ignoreInitial: true,
      ignored: (path, stats) => {
        return (stats?.isFile() && !path.endsWith(".d.ts")) ?? false
      },
    })

    const rebuild = async () => {
      console.log("[rollup-types] Rebundling lib.d.ts")
      try {
        await this.runRollup(model)
      } catch (err) {
        console.error("[rollup-types] Failed:", err)
      }
    }

    watcher.on("change", rebuild)
    watcher.on("ready", rebuild)

    return async () => {
      console.log("[rollup-types] Cleaning up...")
      await watcher.close()
    }
  }

  // Run vite to bundle the webapps
  async runVite(model: PM.ProjectModel) {
    const {projectRoot, features} = model
    const {webapps} = features
    if (webapps != null) {
      for (const webapp of Object.values(webapps)) {
        const outDir = webapp.builtWebappRoot

        // In the local dev server, each app is mounted at "/{webapp
        // name}".  FIXME - also set up for production mode
        const base = webapp.devServerBase

        // Create the vite config
        const viteConfig = vite.defineConfig({
          // Where index.html is located
          root: webapp.path,
          base,
          build: {
            outDir,
            emptyOutDir: true,
            manifest: true,
            watch: this.watch ? {} : null,
          },
          plugins: [
            // Among other things, this makes sure "React" is defined
            // everywhere
            react()
          ],
          logLevel: "info",
        })
        await vite.build(viteConfig)
      }
    }
  }
}

type EsbuildTarget = {
  entry: string
  out: string
  format: esbuild.Format
  isLambda?: boolean
}

type TsconfigJson = {
  // The "raw" form of tsconfig doesn't have an actual type
  // declaration
  compilerOptions: any
  include?: string[]
  exclude?: string[]
}
