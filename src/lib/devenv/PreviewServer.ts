import connect from "connect"
import http from "http"
import httpProxy from "http-proxy"
import serveStatic from "serve-static"
import finalhandler from "finalhandler"
import {parse} from "url"
import * as PM from "@lib/devenv/ProjectModel"
import {proxyRequest, shouldProxyRequest} from "./proxyRequest"

export class PreviewServer {
  constructor(public props: {model: PM.ProjectModel}) {}

  get model() {
    return this.props.model
  }

  async run() {
    if (this.model.devenv.previewServer == null) {
      console.log(
        `[preview] Not starting a server - devenv.previewServer not specified in config`
      )
      return null
    } else if (this.model.features.webapps == null) {
      console.log(
        `[preview] Not starting a server - features.webapps is not enabled`
      )
      return null
    } else {
      const app = connect()
      const port = this.model.devenv.previewServer.port
      const apiPort = this.model.devenv.apiServer?.port
      const projectRoot = this.model.projectRoot

      // Prepare the server
      const server = http.createServer(app)

      // Mount each webapp into the server
      const webapps = Object.values(this.model.features.webapps)
      for (const webapp of webapps) {
        const {name, builtWebappRoot, devServerRoute} = webapp
        const route = devServerRoute

        const staticHandler = serveStatic(builtWebappRoot, {
          // Don't let it serve index.html (we want that proxied)
          index: false,
          fallthrough: true,
        })

        // Let the static handler try first, which will pick up
        // requests that are for assets.  If the static handler
        // doesn't find an asset, then fall back to proxying to the
        // AppServer, which will primarily be handling html requests.
        app.use(devServerRoute, async (req, res, next) => {
          console.log(`PreviewServer: ${req.url}`)
          staticHandler(req, res, async (err) => {
            if (err) {
              console.log(`  error`)
              finalhandler(req, res)(err)
            } else {
              console.log(`  not handled statically - sending to proxy server`)
              await proxyRequest({
                req,
                res,
                targetUrlBase: `http://localhost:${apiPort}/${webapp.name}`,
                devMode: "preview",
              })
            }
          })
        })

        console.log(`[preview] Mounting "${name}" at ${devServerRoute}/`)
      }

      server.listen(port, () => {
        console.log(`[preview] Multi-app preview server running at:`)
        for (const webapp of webapps) {
          console.log(` → http://localhost:${port}${webapp.devServerRoute}/`)
        }
      })

      return async () => {
        console.log("[preview] Shutting down...")
        server.close()
      }
    }
  }
}
