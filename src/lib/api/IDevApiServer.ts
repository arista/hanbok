import type {IRouter} from "./IRouter"

export interface IDevApiServer {
  addRoutes(prefix: string, router: IRouter): void
}

export type DevApiServerCreateFunc = (props: {
  webappApiEndpoint: string
  routerBase: string
})=>IDevApiServer
