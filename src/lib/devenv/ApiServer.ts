import connect from "connect"
import bodyParser from "body-parser"
import {FindMyWayRouter} from "../api/FindMyWayRouter"
import http from "http"
import serveStatic from "serve-static"
import finalhandler from "finalhandler"
import {createProjectModel} from "@lib/devenv/createProjectModel"
import type {DevApiServerCreateFunc} from "@lib/api/AppServerTypes"
import type {IRouter} from "@lib/api/IRouter"
import chokidar from "chokidar"
import fs from "node:fs"

export class ApiServer {
  constructor(public props: {}) {}

  async run() {
    const model = await createProjectModel({})
    const port = model.devenv.apiServer?.port
    if (port == null) {
      console.log(`No devenv.apiServer.port specified in hanbok.config.js`)
      return
    }

    this.initializeSignalHandlers()

    // Start the http server
    const app = connect()
    const server = http.createServer(app)
    if (this._isShutdown) {
      return
    }
    this._httpShutdown = async () => {
      console.log("[AppServer] Shutting down...")
      await server.close()
    }

    // Go through each of the webapps, mount them into the router
    const webapps = model.features.webapps
    if (webapps != null) {
      for (const webappName of Object.keys(webapps)) {
        const webapp = webapps[webappName]
        if (webapp?.devApiServer != null) {
          const {builtPath} = webapp.devApiServer
          const {viteManifestPath, builtWebappRoot} = webapp
          // Create the DevApiServer
          const webappApiEndpoint = `/${webappName}`
          const routerBase = `/${webappName}`
          const assetsBase = `/${webappName}/`
          const devApiCreateFunc: DevApiServerCreateFunc = (
            await import(builtPath)
          ).default
          const manifest = JSON.parse(
            fs.readFileSync(viteManifestPath, "utf-8")
          )
          const router = new FindMyWayRouter()
          await devApiCreateFunc({
            router,
            routesPrefix: `/`,
            isProduction: false,
            webappApiEndpoint,
            routerBase,
            assetsBase,
            manifest,
          })
          const staticHandler = serveStatic(builtWebappRoot, {
            // Don't let it serve index.html (we want that proxied)
            index: false,
            fallthrough: true,
          })

          // Let the static handler try first, which will pick up
          // requests that are for assets.  If the static handler
          // doesn't find an asset, then fall back to proxying to the
          // AppServer, which will primarily be handling html requests.
          const webappPrefix = `/${webappName}`
          app.use(webappPrefix, async (req, res, next) => {
            console.log(`Request at ${webappPrefix}${req.url}`)
            staticHandler(req, res, async (err) => {
              if (err) {
                finalhandler(req, res)(err)
              } else {
                if (!router.r.lookup(req, res)) {
                  next()
                }
              }
            })
          })
        }
      }

      if (this._isShutdown) {
        return
      }
      server.listen(port, () => {
        console.log(`[AppServer] Multi-app AppServer running at:`)
        for (const webapp of Object.values(webapps)) {
          console.log(`  http://localhost:${port}/${webapp.name}/`)
        }
      })
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
    await this.shutdown()
    process.exit(0)
  }

  _isShutdown = false
  async shutdown() {
    this._isShutdown = true
    if (this._httpShutdown) {
      await this._httpShutdown()
    }
  }
}

export class ApiServerWatch {
  apiServer: ApiServer | null = null

  async run() {
    const model = await createProjectModel({})
    const watchFiles = []

    // Gather the list of files to watch
    const webapps = model.features.webapps
    if (webapps != null) {
      for (const webappName of Object.keys(webapps)) {
        const webapp = webapps[webappName]
        if (webapp?.devApiServer != null) {
          const {builtPath} = webapp.devApiServer
          const {viteManifestPath} = webapp
          watchFiles.push(builtPath)
          watchFiles.push(viteManifestPath)
        }
      }
    }

    if (watchFiles.length > 0) {
      const watcher = chokidar.watch(watchFiles, {
        persistent: true,
      })
      watcher.on("ready", async () => {
        await this.restartApiServer()
      })
      watcher.on("change", async () => {
        await this.restartApiServer()
      })
      watcher.on("add", async () => {
        await this.restartApiServer()
      })
      watcher.on("unlink", async () => {
        await this.restartApiServer()
      })
    } else {
      await this.startApiServer()
    }
  }

  async stopApiServer() {
    if (this.apiServer != null) {
      await this.apiServer.shutdown()
      this.apiServer = null
    }
  }

  async startApiServer() {
    this.apiServer = new ApiServer({})
    await this.apiServer.run()
  }

  _restartPending = false
  restartApiServer() {
    if (!this._restartPending) {
      this._restartPending = true
      setTimeout(() => {
        this._restartPending = false
        this._restartApiServer()
      }, 200)
    }
  }

  async _restartApiServer() {
    if (this.apiServer != null) {
      await this.stopApiServer()
    }
    await this.startApiServer()
  }
}
