import connect from "connect"
import bodyParser from "body-parser"
import {FindMyWayRouter} from "../api/FindMyWayRouter"
import http from "http"
import {createProjectModel} from "@lib/devenv/createProjectModel"
import type {DevApiServerCreateFunc} from "@lib/api/IDevApiServer"
import type {IRouter} from "@lib/api/IRouter"

export class ApiServer {
  constructor(public props: {}) {}

  async run() {
    const model = await createProjectModel({})
    const port = model.devenv.apiServer?.port
    if (port == null) {
      console.log(`No devenv.apiServer.port specified in hanbok.config.js`)
      return
    }

    // Start the http server, listen for shutdown signals
    this.initializeSignalHandlers()
    const router = await this.startHttpServer(port)

    // Go through each of the webapps
    const webapps = model.features.webapps
    if (webapps != null) {
      for (const webappName of Object.keys(webapps)) {
        const webapp = webapps[webappName]
        if (webapp?.devApiServer != null) {
          const {builtPath} = webapp.devApiServer
          // Create the DevApiServer
          const webappApiEndpoint = `/${webappName}`
          const routerBase = `/${webappName}`
          const devApiCreateFunc: DevApiServerCreateFunc = (
            await import(builtPath)
          ).default
          await devApiCreateFunc({
            router,
            routesPrefix: `/${webappName}`,
            webappApiEndpoint,
            routerBase,
          })
          console.log(
            `Webapp "${webappName}" dev api server listening at http://localhost:${port}${webappApiEndpoint}`
          )
        }
      }
    }
  }

  initializeSignalHandlers() {
    const signals = ["SIGINT", "SIGQUIT", "SIGTERM"]
    for (const signal of signals) {
      process.on(signal, () => this.onShutdownSignal(signal))
    }
  }

  async startHttpServer(port: number): Promise<IRouter> {
    const app = connect()
    app.use(bodyParser.json())

    const router = new FindMyWayRouter()
    app.use((req, res, next) => {
      console.log(`Request at ${req.url}`)
      if (!router.r.lookup(req, res)) {
        next()
      }
    })

    // Prepare the server
    const server = http.createServer(app)

    await new Promise<void>((resolve, reject) => {
      server.listen(port, () => resolve())
      server.on("error", reject)
    })

    this._httpShutdown = async () => {
      console.log("[local-server] Shutting down...")
      await server.close()
    }

    return router
  }

  _httpShutdown: (() => Promise<void>) | null = null
  async onShutdownSignal(signal: string) {
    if (this._httpShutdown) {
      await this._httpShutdown()
    }
    process.exit(0)
  }
}
