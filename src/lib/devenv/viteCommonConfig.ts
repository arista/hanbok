import * as vite from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import {ProjectModel, WebappConfig} from "./ProjectModel"
import {proxyRequest} from "./proxyRequest"

export function viteCommonConfig(model: ProjectModel, webapp: WebappConfig) {
  // FIXME - only use this for the dev server
  const injectPageContextPlugin = (): vite.Plugin => {
    const plugin: vite.Plugin = {
      name: "inject-page-context-plugin",
      apply: "serve",
      configureServer: (server: vite.ViteDevServer) => {
        server.middlewares.use(async (req, res, next) => {
          const apiPort = model.devenv.apiServer?.port
          if (
            apiPort != null &&
            webapp.devApiServer != null &&
            req.url?.startsWith("/") &&
            req.headers.accept?.includes("text/html")
          ) {
            await proxyRequest({
              req,
              res,
              targetUrlBase: `http://localhost:${apiPort}/${webapp.name}`,
              transformHtml: async (html) =>
                server.transformIndexHtml(req.url!, html),
            })
          } else {
            next()
          }
        })
      },
    }
    return plugin
  }

  return {
    // Where index.html is located
    root: webapp.viteProjectRoot,
    base: webapp.devServerBase,
    plugins: [
      // Among other things, this makes sure "React" is defined
      // everywhere
      react(),
      tailwindcss(),
      injectPageContextPlugin(),
    ],
  }
}
