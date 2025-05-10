import path from "node:path"
import dts from "rollup-plugin-dts"
import { parseConfigFileTextToJson } from "typescript"
import { fileURLToPath } from "node:url"
import fs from "node:fs"

function getTsconfig() {
  const dirname = path.dirname(fileURLToPath(import.meta.url))
  const filename = path.resolve(dirname, "tsconfig.json")
  const fileContents = fs.readFileSync(filename, "utf-8")
  const fileContentsJson = parseConfigFileTextToJson(
    filename,
    fileContents
  ).config
  return fileContentsJson
}

function getPackageExternals() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const pkgJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const ret =  [
    ...Object.keys(pkgJson.dependencies || {}),
    ...Object.keys(pkgJson.peerDependencies || {})
  ]
  console.log(`ret: ${JSON.stringify(ret, null, 2)}`)
  return ret
}

export default [
  { input: "build/tsc/src/tools.d.ts", output: "dist/tools/tools.es.d.ts", format: "es" },
  { input: "build/tsc/src/server.d.ts", output: "dist/server/server.es.d.ts", format: "es" },
  { input: "build/tsc/src/cdk.d.ts", output: "dist/cdk/cdk.es.d.ts", format: "es" },
  { input: "build/tsc/src/routes.d.ts", output: "dist/routes/routes.es.d.ts", format: "es" },
].map(c => {
  const {input, output, format} = c
  return {
    input,
    output: {
      file: output,
      format: format,
    },
    // Don't pull in all the types from libraries that hanbok
    // consumers will need to include anyway
    external: ["zod", "constructs", "aws-cdk-lib", "aws-cdk"],
    plugins: [
      dts({
        respectExternal: true,
        compilerOptions: {
          baseUrl: "./build/tsc",
          paths: getTsconfig().compilerOptions.paths,
        },
      }),
    ],
  }
})
