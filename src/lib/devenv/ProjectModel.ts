// Models a project

export type ProjectModel = {
  name: string
  source: SourceModel | null
  hanbokSource: SourceModel | null
  projectRoot: string
  devenv: DevEnv
  features: Features
  suite: ProjectModel | null
}

export type SourceModel = GithubSourceModel

export type GithubSourceModel = {
  type: "Github"
  codestarConnectionArnParamName: string
  owner: string
  repo: string
}

export type DevEnv = {
  devServer: DevServer | null
  appServer: AppServer | null
}

export type DevServer = {
  port: number
}

export type AppServer = {
  port: number
}

export type Features = {
  lib: LibModel | null
  test: TestModel | null
  services: ServicesModel | null
  webapps: WebappsModel | null
  cdk: CdkModel | null
}

export type LibModel = {
  sourcePath: string
  typesSourcePath: string | null
  builtPath: string
}

export type TestModel = {
  sourcePath: string
  builtPath: string
}

export type ServicesModel = Record<string, ServiceModel>

export type ServiceModel = {
  name: string
  path: string
  prisma: PrismaModel | null
}

export type PrismaModel = {
  schemaFile: string
  builtSchemaFile: string
  injectSchemaHeader: boolean
}

export const PRISMA_SCHEMA_INJECTION_POINT = "__HANBOK_PRISMA_HEADER__"

export type WebappsModel = Record<string, WebappModel>

export type WebappModel = {
  name: string
  path: string
  viteProjectRoot: string
  indexHtmlPath: string
  builtWebappRoot: string
  viteManifestPath: string
  devServerRoute: string
  devServerBase: string
  devAppServer: DevAppServer | null
}

export type DevAppServer = {
  sourcePath: string
  builtPath: string
}

export type CdkModel = {
  sourcePath: string
  builtPath: string
}
