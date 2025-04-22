export type ProjectConfig = SuiteProjectConfig | AppProjectConfig

export type SuiteProjectConfig = {
  type: "Suite"
  name: string
}

export type AppProjectConfig = {
  type: "App"
  name: string
  features?: Features
}

export type Features = {
  lib?: boolean | null | undefined
}

export function defineConfig(c:ProjectConfig):ProjectConfig {
  return c
}
