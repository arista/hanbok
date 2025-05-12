import * as vite from "vite"
import httpProxy from "http-proxy"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import {ProjectModel, WebappModel} from "./ProjectModel"
import {proxyRequest, shouldProxyRequest} from "./proxyRequest"

export function viteCommonConfig({
  model,
  webapp,
  includeProxyPagePlugin,
}: {
  model: ProjectModel
  webapp: WebappModel
  includeProxyPagePlugin: boolean
}) {
  const proxyPagePlugin = (): vite.Plugin => {
    const plugin: vite.Plugin = {
      name: "inject-page-context-plugin",
      apply: "serve",
      configureServer: (server: vite.ViteDevServer) => {
        server.middlewares.use(async (req, res, next) => {
          console.log(`viteCommonConfig, req.url: ${req.url}`)
          const apiPort = model.devenv.appServer?.port
          if (shouldProxyRequest({model, webapp, req})) {
            console.log(`  proxying request`)
            await proxyRequest({
              req,
              res,
              targetUrlBase: `http://localhost:${apiPort}/${webapp.name}`,
              transformHtml: async (html) => {
                return server.transformIndexHtml(req.url!, html)
              },
              devMode: "dev",
            })
          } else {
            next()
          }
        })
      },
    }
    return plugin
  }

  const proxyPagePlugins = includeProxyPagePlugin ? [proxyPagePlugin()] : []

  // In a production build, this env var will be set the build process
  const DEPLOYENV_PUBLISHED_ASSETS_BASE =
    process.env["DEPLOYENV_PUBLISHED_ASSETS_BASE"]
  const base = DEPLOYENV_PUBLISHED_ASSETS_BASE
    ? `${DEPLOYENV_PUBLISHED_ASSETS_BASE}/by-webapp/${webapp.name}/site`
    : webapp.devServerBase

  return {
    // Where index.html is located
    root: webapp.viteProjectRoot,
    base,
    plugins: [
      // Among other things, this makes sure "React" is defined
      // everywhere
      react(),
      tailwindcss(),
      ...proxyPagePlugins,
    ],
  }
}
