// Models a project

import {ProjectConfig} from "./ProjectConfig"

export type ProjectModel = {
  name: string
  projectRoot: string
  devenv: DevEnv
  features: Features
  suite: ProjectModel | null
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
  lib: LibConfig | null
  test: TestConfig | null
  services: ServicesConfig | null
  webapps: WebappsConfig | null
  cdk: CdkConfig | null
}

export type LibConfig = {
  sourcePath: string
  typesSourcePath: string | null
  builtPath: string
}

export type TestConfig = {
  sourcePath: string
  builtPath: string
}

export type ServicesConfig = Record<string, ServiceConfig>

export type ServiceConfig = {
  name: string
  path: string
  prisma: PrismaConfig | null
}

export type PrismaConfig = {
  schemaFile: string
  builtSchemaFile: string
  injectSchemaHeader: boolean
}

export const PRISMA_SCHEMA_INJECTION_POINT = "__HANBOK_PRISMA_HEADER__"

export type WebappsConfig = Record<string, WebappConfig>

export type WebappConfig = {
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

export type CdkConfig = {
  sourcePath: string
  builtPath: string
}
