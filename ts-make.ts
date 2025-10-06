const config = {
  targets: {
    default: {
      depends: ["cli"],
    },
    cli: {
      build: {
        type: "esbuild",
        source: "src/cli.ts",
        destPrefix: "dist/cli/cli",
      }
    },
  }
}

export default config
