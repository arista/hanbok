const config = {
  plugins: [
    {name: "ts-make/plugins-esbuild", alias: "esbuild"},
  ],
  targets: [
    {name: "default", deps: ["cli", "a"]},
    {name: "cli", deps: "a"},
    {
      name: "a", action: "esbuild:esbuild", args: {
        source: "src/cli.ts",
        destPrefix: "dist/cli/cli",
      }
    },
  ],
}

export default config
