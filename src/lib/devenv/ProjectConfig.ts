export type ProjectConfig = SuiteProjectConfig | AppProjectConfig

export type SuiteProjectConfig = {
  type: "Suite"
  name: string
  source?: SourceConfig
  hanbokSource?: SourceConfig
  features?: SuiteFeatures
  certificates?: CertificatesConfig
}

export type AppProjectConfig = {
  type: "App"
  name: string
  source?: SourceConfig
  hanbokSource?: SourceConfig
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
  webapps?: WebappsConfig | null | undefined
  cdk?: boolean | null | undefined
}

export type WebappsConfig = Record<string, WebappConfig>

export type AppSuiteConfig = {
  name: string
}

export type SuiteFeatures = {
  lib?: boolean | null | undefined
  test?: boolean | null | undefined
  cdk?: boolean | null | undefined
  db?: DatabaseConfig | null | undefined
}

export type SourceConfig = GithubSourceConfig

export type GithubSourceConfig = {
  type: "Github"
  codestarConnectionArnParamName: string
  owner: string
  repo: string
}

// This is just a convenient way for the config file to invoke type
// checking, by doing something like "export default
// defineConfig({...})"
export function defineConfig(c: ProjectConfig): ProjectConfig {
  return c
}

export type WebappConfig = {
  // The AWS hosted zone name (e.g., "example.com")
  hostedZone: string
  // The domain name within the hosted zone (e.g. "myapp")
  hostname: string
  // The name of the certificate within the suite
  certificateName: string
}

export type CertificatesConfig = Record<string, CertificateConfig>

export type CertificateConfig = {
  // The name of the hosted zone (e.g. "example.com")
  hostedZone: string
  // The domain name to appear on the certificate, which can include
  // wildcards or individual hostnames (e.g., "*.example.com")
  domainName: string
}

export type DatabaseConfig = {
  localDev?: DatabaseLocalDevConfig
  deployed?: DatabaseDeployedConfig
}

export type DatabaseLocalDevConfig = {
  hostname: string
  port?: number
  username: string
  password?: string
}

export type DatabaseDeployedConfig = {
  bastionPort: number
}
