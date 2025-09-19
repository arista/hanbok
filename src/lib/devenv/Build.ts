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
import {viteCommonConfig} from "./viteCommonConfig"
import * as PrismaUtils from "../utils/PrismaUtils"
import peggy from "peggy"

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
    await this.runParserGenerators(model)
    await this.runTsc(model)
    await this.runEsbuild(model)
    await this.runRollup(model)
    await this.runVite(model)
  }

  async runWatch(model: PM.ProjectModel) {
    await ProcUtils.runAllWatchers([
      {name: "prisma", fn: async () => await this.runPrismaWatch(model)},
      {
        name: "parsers",
        fn: async () => await this.runParserGeneratorsWatch(model),
      },
      {name: "tsc", fn: async () => await this.runTscWatch(model)},
      {name: "esbuild", fn: async () => await this.runEsbuild(model)},
      {name: "rollup-types", fn: async () => await this.runRollupWatch(model)},

      // In dev mode, we don't bother building vite since the vite dev
      // server has its own special build process
      //      {name: "vite", fn: async () => await this.runVite(model)},
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

  // Runs the parser generators
  async runParserGenerators(model: PM.ProjectModel) {
    const parsers = model.features.parser
    if (parsers != null && parsers.length > 0) {
      for (const parser of parsers) {
        const {sourcePath, builtPath, declsPath} = parser
        const source = sourcePath
        const text = fs.readFileSync(sourcePath, "utf-8")
        const generatedParser = peggy.generate(text, {
          grammarSource: source,
          output: "source-with-inline-map",
          format: "es",
        })
        const builtPathDir = path.dirname(builtPath)
        fs.mkdirSync(builtPathDir, {recursive: true})
        fs.writeFileSync(builtPath, generatedParser)

        // Write a made-up .d.ts file as well, so that TS isn't
        // tempted to typecheck the generated parser file
        const dtsFile =
          "export function parse(input: string, options?: {}): any\n"
        fs.writeFileSync(declsPath, dtsFile)
      }
    }
  }

  // Run the parser generators in watch mode
  async runParserGeneratorsWatch(model: PM.ProjectModel) {
    const parsers = model.features.parser
    if (parsers != null && parsers.length > 0) {
      const watchPaths = parsers.map((p) => p.sourcePath)
      const watcher = chokidar.watch(watchPaths, {
        persistent: true,
        ignoreInitial: true,
      })

      const rebuild = async () => {
        console.log("[parsers] Regenerating parser generators")
        try {
          await this.runParserGenerators(model)
        } catch (err) {
          console.error("[parsers] Failed:", err)
        }
      }

      watcher.on("change", rebuild)
      watcher.on("ready", rebuild)

      return async () => {
        console.log("[parsers] Cleaning up...")
        await watcher.close()
      }
    } else {
      return async () => {}
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
    const typesSourcePaths: Array<string> = (model.features.lib ?? [])
      .map((l) => l.typesSourcePath)
      .filter((p) => p != null)
    const generateTypes = typesSourcePaths.length > 0
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
      include.push(...typesSourcePaths)
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
    const libs = model.features.lib
    const test = model.features.test
    const webapps = model.features.webapps
    const cdk = model.features.cdk

    // generate the metafile that tracks what was bundled and why
    // FIXME - make this configurable
    const generateMetafile = false

    const builds: Array<EsbuildTarget> = []
    // Add the "lib" build
    if (libs != null) {
      for (const lib of libs) {
        builds.push({
          entry: lib.sourcePath,
          out: lib.builtPath,
          format: "esm",
        })
      }
    }
    // Add the "test" build
    if (test != null) {
      builds.push({
        entry: test.sourcePath,
        out: test.builtPath,
        format: "esm",
      })
    }
    if (webapps != null) {
      for (const webappName of Object.keys(webapps)) {
        const webapp = webapps[webappName]
        if (webapp?.devAppServer != null) {
          const {sourcePath, builtPath} = webapp.devAppServer
          builds.push({
            entry: sourcePath,
            out: builtPath,
            format: "esm",
          })
        }
        if (webapp?.lambdaAppServer != null) {
          const {sourcePath, builtPath} = webapp.lambdaAppServer
          builds.push({
            entry: sourcePath,
            out: builtPath,
            format: "cjs",
            isLambda: true,
          })
        }
      }
    }
    // Add the "cdk" build
    if (cdk != null) {
      builds.push({
        entry: cdk.sourcePath,
        out: cdk.builtPath,
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
    const typesSourcePaths: Array<string> = (model.features.lib ?? [])
      .map((l) => l.typesSourcePath)
      .filter((p) => p != null)
    const generateTypes = typesSourcePaths.length > 0
    const generateTest = model.features.test != null

    if (generateTypes) {
      const libs = model.features.lib ?? []
      for (const lib of libs) {
        const {typesBuildPath, typesDistPath} = lib
        if (typesBuildPath != null && typesDistPath != null) {
          const bundle = await rollup({
            input: typesBuildPath,
            plugins: [
              dts({
                respectExternal: true,
                compilerOptions: {
                  baseUrl: path.join(projectRoot, "build/tsc"),
                  paths: this.generateTsconfigPaths(),
                },
              }),
            ],
          })

          await bundle.write({
            file: typesDistPath,
            format: "es",
          })

          await bundle.close()
        }
      }
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
    // The node_modules to be "chunked" into a separate vendor.js bundle
    // FIXME - maybe this should just come from package.json in hanbok, suite, and app
    const vendorChunksNodeModules = [
      "react",
      "react-dom",
      "react-router",
      "react-router-dom",
      "path-to-regexp",
      "live-value",
      "body-parser",
      "finalhandler",
      "find-my-way",
      "globby",
      "raw-body",
      "zod",
    ]
    const vendorChunksNodeModulesRE = new RegExp(
      vendorChunksNodeModules.map((c) => `\\/node_modules\\/${c}\\/`).join("|")
    )

    const {projectRoot, features} = model
    const {webapps} = features
    if (webapps != null) {
      for (const webapp of Object.values(webapps)) {
        const outDir = webapp.builtWebappRoot

        // Create the vite config
        // NOTE - if you make changes here, also check on the vite
        // configuration in DevServer
        const viteConfig = vite.defineConfig({
          ...viteCommonConfig({model, webapp, includeProxyPagePlugin: false}),
          build: {
            outDir,
            emptyOutDir: true,
            manifest: true,
            watch: this.watch ? {} : null,
            rollupOptions: {
              output: {
                manualChunks(id: string) {
                  if (vendorChunksNodeModulesRE.test(id)) {
                    return "vendor"
                  } else {
                    return null
                  }
                },
              },
            },
          },
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
