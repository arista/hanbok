// Models a project

import {ProjectConfig} from "./ProjectConfig"

export type ProjectModel = {
  projectRoot: string
  devenv: DevEnv
  features: Features
}

export type DevEnv = {
  devServer: DevServer | null
  apiServer: ApiServer | null
  previewServer: PreviewServer | null
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

export type Features = {
  lib: LibConfig | null
  test: TestConfig | null
  services: ServicesConfig | null
  webapps: WebappsConfig | null
}

export type LibConfig = {
  libFile: string
  libTypesFile: string | null
}

export type TestConfig = {
  testFile: string
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
  devServerRoute: string
  devServerBase: string
  devApiServer: DevApiServer | null
}

export type DevApiServer = {
  sourcePath: string
  builtPath: string
}
