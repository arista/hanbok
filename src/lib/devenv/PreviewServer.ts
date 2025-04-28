import connect from "connect"
import http from "http"
import path from "path"
import serveStatic from "serve-static"
import {parse} from "url"
import * as PM from "@lib/devenv/ProjectModel"
import fs from "node:fs"

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
          // We want to serve index.html manually
          index: false,
        })

        app.use(devServerRoute, (req, res, next) => {
          console.log(`req: ${req.url}`)
          const urlPath = parse(req.url || "").pathname || ""
          if (
            urlPath === "/" ||
            urlPath.endsWith(".html") ||
            urlPath.endsWith(".js") ||
            urlPath.endsWith(".css") ||
            urlPath.includes("/assets/")
          ) {
            if (urlPath === "/" || !path.extname(urlPath)) {
              // All non-asset requests are fulfilled with index.html
              const indexPath = path.join(builtWebappRoot, "index.html")
              const indexHtml = fs.readFileSync(indexPath, "utf-8")

              // FIXME - modify indexHtml to inject the page context

              res.setHeader("Content-Type", "text/html")
              res.end(indexHtml)
            } else {
              staticHandler(req, res, next)
            }
          } else {
            next()
          }
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
