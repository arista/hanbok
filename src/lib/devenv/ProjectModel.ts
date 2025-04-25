// Models a project

import {ProjectConfig} from "./ProjectConfig"

export type ProjectModel = {
  projectRoot: string
  config: ProjectConfig
  features: Features
}

export type Features = {
  lib: LibConfig | null
  test: TestConfig | null
  services: ServicesConfig | null
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
