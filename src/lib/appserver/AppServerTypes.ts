import type {IRouter} from "../routes/IRouter"

export type AppServerEnvBase = WebappEnvBase & {
  router: IRouter
  routesPrefix: string
  isProduction: boolean
  buildInfo: BuildInfo | null
}

export type WebappEnvBase = {
  routesEndpoint: string
  routerBase: string
  manifest: ViteManifest
  assetsBase: string
}

export interface ViteManifestEntry {
  file: string
  src?: string
  isEntry?: boolean
  isDynamicEntry?: boolean
  css?: string[]
  assets?: string[]
  imports?: string[]
  dynamicImports?: string[]
}

export type ViteManifest = Record<string, ViteManifestEntry>

export type DevAppServerCreateFunc = (props: AppServerEnvBase) => Promise<void>

export type LambdaBuildArtifacts = {
  buildInfo: BuildInfo
  manifest: ViteManifest
}

export type BuildInfo = {
  buildUuid: string
  suite: string
  app: string
  webapp: string
  deployenv: string
  codebuildBuildId: string
  buildDate: string
  pipelineExecutionId: string
  publishedAssetsBase: string
  githubOwner: string
  githubRepo: string
  gitCommitId: string
  gitRefName: string
  hanbokSource: BuildInfoSource | null
  suiteSource: BuildInfoSource | null
  appSource: BuildInfoSource
}

export type BuildInfoSource = {
  githubOwner: string
  githubRepo: string
  commitId: string
  branch: string
}
