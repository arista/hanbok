import type * as PM from "@lib/devenv/ProjectModel";
import { createProjectModel } from "@lib/devenv/createProjectModel";
import ts from "typescript";

export class Build {
  constructor(props: {}) {}

  async run() {
    const model = await createProjectModel({});
    await this.runTsc(model);

    return model;
  }

  // Run the typescript compiler to do type-checking, and to generate
  // .d.ts files that will later be used by rollup to generate the
  // final lib.d.ts
  async runTsc(model: PM.ProjectModel): Promise<ts.EmitResult> {
    const { projectRoot } = model;
    const libTypesFile = model.features.lib?.libTypesFile;
    const generateTypes = libTypesFile != null;

    // Prepare to run tsc

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
        };

    // Sometimes the "lib-types.ts" file needs to be included
    // explicitly, otherwise tsc might not generate its .d.ts file if
    // it only contains types
    const generateInclude = generateTypes ? [libTypesFile] : [];

    const compilerOptions: ts.CompilerOptions = {
      baseUrl: ".",

      // Module resolution and code generation
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
      jsx: ts.JsxEmit.Preserve,
      esModuleInterop: true,

      // For type-generation, or no generation
      ...generateOptions,

      // linting features
      strict: true,
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
    };

    const include = [...generateInclude, "./src/**/*", "./test/**/*"];

    const config = ts.parseJsonConfigFileContent(
      { compilerOptions, include },
      ts.sys,
      projectRoot,
    );

    const program = ts.createProgram(config.fileNames, config.options);
    const emitResult = program.emit();

    const allDiagnostics = ts
      .getPreEmitDiagnostics(program)
      .concat(emitResult.diagnostics);
    if (allDiagnostics.length > 0) {
      const formatted = ts.formatDiagnosticsWithColorAndContext(
        allDiagnostics,
        ts.createCompilerHost(config.options),
      );
      console.error(formatted);
    }

    const hasErrors = allDiagnostics.some(
      (d) => d.category === ts.DiagnosticCategory.Error,
    );
    if (hasErrors) {
      throw new Error("TypeScript compilation failed with errors.");
    }

    return emitResult;
  }
}
