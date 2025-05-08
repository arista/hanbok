export type ProjectConfig = SuiteProjectConfig | AppProjectConfig

export type SuiteProjectConfig = {
  type: "Suite"
  name: string
  features?: SuiteFeatures
}

export type AppProjectConfig = {
  type: "App"
  name: string
  devenv: DevEnv
  features?: AppFeatures
  suite?: AppSuiteConfig
}

export type DevEnv = {
  devServer?: DevServer | null | undefined
  appServer?: AppServer | null | undefined
}

export type DevServer = {
  port: number
}

export type AppServer = {
  port: number
}

export type AppFeatures = {
  lib?: boolean | null | undefined
  test?: boolean | null | undefined
  services?: boolean | null | undefined
  cdk?: boolean | null | undefined
}

export type AppSuiteConfig = {
  name: string
}

export type SuiteFeatures = {
  lib?: boolean | null | undefined
  test?: boolean | null | undefined
}

// This is just a convenient way for the config file to invoke type
// checking, by doing something like "export default
// defineConfig({...})"
export function defineConfig(c: ProjectConfig): ProjectConfig {
  return c
}
