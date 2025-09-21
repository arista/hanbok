import {routeDefs, IRoutes} from "../../routes/Routes"
import {createRoutesClient, sendClientRequest} from "hanbok/routes"
import type {ClientRequest} from "hanbok/routes"

export class AppClient {
  constructor(
    public props: {
      routesEndpoint: string
    }
  ) {}

  _routes?: IRoutes
  get routes(): IRoutes {
    return (this._routes ??= (() => {
      return createRoutesClient(routeDefs, async (request) => {
        return await this.sendRequest(request)
      }) as IRoutes
    })())
  }

  async sendRequest(request: ClientRequest): Promise<Response> {
    console.log(`request`, request)
    const result = await sendClientRequest(this.props.routesEndpoint, request)
    console.log(`result`, result)
    // FIXME - check response.status
    const response = await result.json()
    console.log(`response`, response)
    return response
  }
}
