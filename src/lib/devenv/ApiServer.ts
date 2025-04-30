import {HttpServer} from "./HttpServer"
import {ProjectModel} from "./ProjectModel"
import {createProjectModel} from "@lib/devenv/createProjectModel"
import type {IDevApiServer} from "@lib/api/IDevApiServer"
import type {IRouter} from "@lib/devenv/IRouter"

export class ApiServer {
  constructor(public props: {}) {}

  async run() {
    const model = await createProjectModel({})
    const port = model.devenv.apiServer?.port
    if (port == null) {
      console.log(`No devenv.apiServer.port specified in hanbok.config.js`)
      return
    }

    // Go through each of the webapps
    const webappApiServers: Array<WebappApiServer> = []
    const webapps = model.features.webapps
    if (webapps != null) {
      for (const webappName of Object.keys(webapps)) {
        const webapp = webapps[webappName]
        if (webapp?.devApiServer != null) {
          const {builtPath} = webapp.devApiServer
          // Create the DevApiServer
          const devApiCreateFunc = (await import(builtPath)).default
          const devApiServer: IDevApiServer = devApiCreateFunc()
          webappApiServers.push({
            name: webappName,
            prefix: `/${webappName}`,
            devApiServer,
          })
        }
      }
    }

    // Prepare the method that will add the routes for each webapp
    const addRoutes = (router: IRouter) => {
      for (const webappApiServer of webappApiServers) {
        const {devApiServer, prefix} = webappApiServer
        devApiServer.addRoutes(prefix, router)
      }
    }

    this.initializeSignalHandlers()

    const httpServer = new HttpServer({port, addRoutes})
    this._httpShutdown = await httpServer.run()

    for (const webappApiServer of webappApiServers) {
      const {name, prefix} = webappApiServer
      console.log(
        `Webapp "${name}" dev api server listening at http://localhost:${port}${prefix}`
      )
    }
  }

  initializeSignalHandlers() {
    const signals = ["SIGINT", "SIGQUIT", "SIGTERM"]
    for (const signal of signals) {
      process.on(signal, () => this.onShutdownSignal(signal))
    }
  }

  _httpShutdown: (() => Promise<void>) | null = null
  async onShutdownSignal(signal: string) {
    if (this._httpShutdown) {
      await this._httpShutdown()
    }
    process.exit(0)
  }
}

type WebappApiServer = {
  name: string
  prefix: string
  devApiServer: IDevApiServer
}
