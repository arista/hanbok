import {createServer as createViteServer, ViteDevServer} from "vite"
import connect from "connect"
import http from "http"
import path from "path"
import {parse} from "url"
import * as PM from "@lib/devenv/ProjectModel"

export class DevServer {
  constructor(public props: {model: PM.ProjectModel}) {}

  get model() {
    return this.props.model
  }

  async run() {
    if (this.model.devenv.devServer == null) {
      console.log(
        `[vite] Not starting a server - devenv.devServer not specified in config`
      )
      return null
    } else if (this.model.features.webapps == null) {
      console.log(
        `[vite] Not starting a server - features.webapps is not enabled`
      )
      return null
    } else {
      const app = connect()
      const port = this.model.devenv.devServer.port

      // Prepare the server
      const server = http.createServer(app)

      // Mount each webapp into the server
      const viteServers: Array<ViteDevServer> = []
      const webapps = Object.values(this.model.features.webapps)
      for (const webapp of webapps) {
        const {name, builtWebappRoot, devServerRoute} = webapp
        const route = devServerRoute
        const vite = await createViteServer({
          root: builtWebappRoot,
          server: {
            middlewareMode: true,

            // Set up vite to use the same server for hot module
            // reloading through websockets
            hmr: {
              server,
            },
          },
        })
        viteServers.push(vite)

        console.log(`[vite] Mounting "${name}" at ${devServerRoute}`)

        // Mount each Vite dev server under its route
        app.use(route, vite.middlewares)
      }

      // Special catch-all for /@vite/client and friends, used by the
      // dev server.  Any of the vite servers can handle these
      // requests
      app.use((req, res, next) => {
        const anyViteServer = viteServers[0]
        if (anyViteServer == null) {
          return
        } else {
          const urlPath = parse(req.url || "").pathname || ""

          if (
            urlPath.startsWith("/@vite/") ||
            urlPath.startsWith("/@id/") ||
            urlPath.startsWith("/@fs/")
          ) {
            anyViteServer.middlewares(req, res, next)
            return
          }
        }
      })

      server.listen(port, () => {
        console.log(`[vite] Multi-app dev server running at:`)
        for (const webapp of webapps) {
          console.log(` → http://localhost:${port}/${webapp.name}/`)
        }
      })

      return async () => {
        console.log("[vite] Shutting down...")
        server.close()
      }
    }
  }
}
