export type ProjectConfig = SuiteProjectConfig | AppProjectConfig

export type SuiteProjectConfig = {
  type: "Suite"
  name: string
}

export type AppProjectConfig = {
  type: "App"
  name: string
  features?: AppFeatures
}

export type AppFeatures = {
  lib?: boolean | null | undefined
  test?: boolean | null | undefined
  services?: boolean | null | undefined
}

// This is just a convenient way for the config file to invoke type
// checking, by doing something like "export default
// defineConfig({...})"
export function defineConfig(c: ProjectConfig): ProjectConfig {
  return c
}
