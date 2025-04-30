import type {IRouter} from "@lib/devenv/IRouter"

export interface IDevApiServer {
  addRoutes(prefix: string, router: IRouter): void
}
