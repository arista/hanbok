import type {IRouter} from "./IRouter"

export interface IDevApiServer {
  addRoutes(prefix: string, router: IRouter): void
}
