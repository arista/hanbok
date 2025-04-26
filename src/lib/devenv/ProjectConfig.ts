export type ProjectConfig = SuiteProjectConfig | AppProjectConfig

export type SuiteProjectConfig = {
  type: "Suite"
  name: string
}

export type AppProjectConfig = {
  type: "App"
  name: string
  devenv: DevEnv
  features?: AppFeatures
}

export type DevEnv = {
  devServer?: DevServer | null | undefined
  apiServer?: ApiServer | null | undefined
  previewServer?: PreviewServer | null | undefined
}

export type DevServer = {
  port: number
}

export type ApiServer = {
  port: number
}

export type PreviewServer = {
  port: number
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
