import connect from "connect"
import bodyParser from "body-parser"
import {HttpRouterImpl} from "../routes/HttpRouterImpl"
import http from "http"
import serveStatic from "serve-static"
import finalhandler from "finalhandler"
import {createProjectModel} from "@lib/devenv/createProjectModel"
import type {DevAppServerCreateFunc} from "@lib/appserver/AppServerTypes"
import type {IRouter} from "@lib/routes/IRouter"
import chokidar from "chokidar"
import fs from "node:fs"

export class AppServer {
  constructor(public props: {}) {}

  async run() {
    const model = await createProjectModel({})
    const port = model.devenv.appServer?.port
    if (port == null) {
      console.log(`No devenv.appServer.port specified in hanbok.config.js`)
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
    app.use(bodyParser.json())

    // Go through each of the webapps, mount them into the router
    const webapps = model.features.webapps
    if (webapps != null) {
      for (const webappName of Object.keys(webapps)) {
        const webapp = webapps[webappName]
        if (webapp?.devAppServer != null) {
          const {builtPath} = webapp.devAppServer
          const {viteManifestPath, builtWebappRoot} = webapp
          // Create the DevAppServer
          const routesEndpoint = `/${webappName}`
          const routerBase = `/${webappName}`
          const assetsBase = `/${webappName}/`
          const devAppCreateFunc: DevAppServerCreateFunc = (
            await import(builtPath)
          ).default
          const manifest = JSON.parse(
            fs.readFileSync(viteManifestPath, "utf-8")
          )
          const router = new HttpRouterImpl()
          await devAppCreateFunc({
            router,
            routesPrefix: `/`,
            isProduction: false,
            routesEndpoint,
            routerBase,
            assetsBase,
            manifest,
            buildInfo: null,
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
                if (!router.httpRouter.lookup(req, res)) {
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

export class AppServerWatch {
  appServer: AppServer | null = null

  async run() {
    const model = await createProjectModel({})
    const watchFiles = []

    // Gather the list of files to watch
    const webapps = model.features.webapps
    if (webapps != null) {
      for (const webappName of Object.keys(webapps)) {
        const webapp = webapps[webappName]
        if (webapp?.devAppServer != null) {
          const {builtPath} = webapp.devAppServer
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
        await this.restartAppServer()
      })
      watcher.on("change", async () => {
        await this.restartAppServer()
      })
      watcher.on("add", async () => {
        await this.restartAppServer()
      })
      watcher.on("unlink", async () => {
        await this.restartAppServer()
      })
    } else {
      await this.startAppServer()
    }
  }

  async stopAppServer() {
    if (this.appServer != null) {
      await this.appServer.shutdown()
      this.appServer = null
    }
  }

  async startAppServer() {
    this.appServer = new AppServer({})
    await this.appServer.run()
  }

  _restartPending = false
  restartAppServer() {
    if (!this._restartPending) {
      this._restartPending = true
      setTimeout(() => {
        this._restartPending = false
        this._restartAppServer()
      }, 200)
    }
  }

  async _restartAppServer() {
    if (this.appServer != null) {
      await this.stopAppServer()
    }
    await this.startAppServer()
  }
}
