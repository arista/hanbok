import path from "node:path";
import dts from "rollup-plugin-dts";
import { parseConfigFileTextToJson } from "typescript";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

function getTsconfig() {
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  const filename = path.resolve(dirname, "tsconfig.json");
  const fileContents = fs.readFileSync(filename, "utf-8");
  const fileContentsJson = parseConfigFileTextToJson(
    filename,
    fileContents,
  ).config;
  return fileContentsJson;
}

export default [
  {
    input: "build/tsc/src/lib-types.d.ts",
    output: {
      file: "dist/lib/lib.d.ts",
      format: "es",
    },
    plugins: [
      dts({
        respectExternal: true,
        compilerOptions: {
          baseUrl: "./build/tsc",
          paths: getTsconfig().compilerOptions.paths,
        },
      }),
    ],
  },
];
