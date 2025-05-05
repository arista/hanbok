import type {IRouter} from "./IRouter"

export type DevApiServerCreateProps = {
  router: IRouter
  routesPrefix: string
  webappApiEndpoint: string
  routerBase: string
}

export type DevApiServerCreateFunc = (props: DevApiServerCreateProps) => void
