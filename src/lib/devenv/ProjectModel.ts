// Models a project

export type ProjectModel = {
  name: string
  type: ProjectType
  source: SourceModel | null
  hanbokSource: SourceModel | null
  hanbokRoot: string
  projectRoot: string
  devenv: DevEnv
  features: Features
  suite: ProjectModel | null
  certificates: CertificatesModel | null
}

export type ProjectType = "Suite" | "App"

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
  lib: LibModels | null
  parser: ParserModels | null
  test: TestModel | null
  services: ServicesModel | null
  webapps: WebappsModel | null
  cdk: CdkModel | null
  db: DatabaseModel | null
}

export type LibModels = Array<LibModel>

export type LibModel = {
  sourcePath: string
  typesSourcePath: string | null
  builtPath: string
}

export type ParserModels = Array<ParserModel>

export type ParserModel = {
  sourcePath: string
  builtPath: string
  declsPath: string
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
  lambdaAppServer: LambdaAppServer | null
  hostingInfo: WebappHostingModel | null
}

export type DevAppServer = {
  sourcePath: string
  builtPath: string
}

export type LambdaAppServer = {
  sourcePath: string
  builtPath: string
}

export type CdkModel = {
  sourcePath: string
  builtPath: string
}

export type WebappHostingModel = {
  // The AWS hosted zone name (e.g., "example.com")
  hostedZone: string
  // The domain name within the hosted zone (e.g. "myapp")
  hostname: string
  // The name of the certificate within the suite
  certificateName: string
}

export type CertificatesModel = Record<string, CertificateModel>

export type CertificateModel = {
  // The name of the hosted zone (e.g. "example.com")
  hostedZone: string
  // The domain name to appear on the certificate, which can include
  // wildcards or individual hostnames (e.g., "*.example.com")
  domainName: string
}

export type DatabaseModel = {
  localDev: DatabaseLocalDevModel | null
  deployed: DatabaseDeployedModel | null
}

export type DatabaseLocalDevModel = {
  hostname: string
  port: number
  username: string
  password: string
}

export type DatabaseDeployedModel = {
  bastionPort: number
}

// Returns the specified service, defaulting to the single service if
// the project only specifies one service.
export function getService(
  projectModel: ProjectModel,
  serviceName: string | null
): ServiceModel | null {
  if (projectModel.suite == null) {
    return null
  }
  const services = projectModel.features?.services
  if (services == null) {
    return null
  }
  const serviceModels = Object.values(services)
  if (serviceName == null || serviceName === "") {
    if (serviceModels.length === 1) {
      return serviceModels[0]!
    } else {
      return null
    }
  }

  const serviceModel = services[serviceName]
  if (serviceModel == null) {
    return null
  }
  return serviceModel
}
