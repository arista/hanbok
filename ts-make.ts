function esbuildTarget(name: string, source: string, destPrefix: string) {
  return {
    name,
    action: "esbuild:esbuild",
    args: {
      source,
      destPrefix,
      compilerOptions: {
        paths: {
          "@lib/*": ["./src/lib/*"],
          "@cli/*": ["./src/cli/*"],
          "@test/*": ["./test/*"]
        },
      },
    }
  }
}

const config = {
  plugins: [
    {name: "ts-make/plugins-esbuild", alias: "esbuild"},
  ],
  targets: [
    {name: "default", deps: "esbuilds"},
    {name: "esbuilds", deps: ["cli", "tools", "server", "routes", "tests"]},
    esbuildTarget("cli", "src/cli.ts", "dist/cli/cli"),
    esbuildTarget("tools", "src/tools.ts", "dist/tools/tools"),
    esbuildTarget("server", "src/server.ts", "dist/server/server"),
    esbuildTarget("routes", "src/routes.ts", "dist/routes/routes"),
    esbuildTarget("tests", "test/tests.ts", "build/test/tests"),
  ],
}

export default config
