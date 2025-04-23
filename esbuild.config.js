// Manages building bundles intended to be used in a node-based
// environment (lib, cli, test, etc.)

import * as esbuild from "esbuild"
import fs from "node:fs"

// generate the metafile that tracks what was bundled and why
const generateMetafile = false

const builds = [
  {entry: "src/cli.ts", out: "dist/cli/cli.es.js", format: "esm"},
  {entry: "src/lib.ts", out: "dist/lib/lib.es.js", format: "esm"},
  {entry: "test/tests.ts", out: "build/test/tests.es.js", format: "esm"},
]

await Promise.all(
  builds.map(async (b) => {
    const {entry, out, format, isLambda} = b
    const context = await esbuild.context({
      entryPoints: [entry],
      bundle: true,
      outfile: out,
      platform: "node",
      target: "node18",
      packages: "external",
      external: [],
      sourcemap: true,
      format: format,
      logLevel: "info",

      metafile: generateMetafile,
    })
    // Do an initial build
    const result = await context.rebuild()
    if (generateMetafile) {
      fs.writeFileSync(
        `${out}.metafile.json`,
        JSON.stringify(result.metafile, null, 2)
      )
    }
    if (process.argv.includes("--watch")) {
      // Watch for code changes
      await context.watch()
    } else {
      context.dispose()
    }
  })
)
