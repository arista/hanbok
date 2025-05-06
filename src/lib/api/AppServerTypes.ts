import type {IRouter} from "./IRouter"

export type AppServerEnvBase = WebappEnvBase & {
  router: IRouter
  routesPrefix: string
  isProduction: boolean
}

export type WebappEnvBase = {
  webappApiEndpoint: string
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

export type DevAppServerCreateFunc = (props: AppServerEnvBase) => void
