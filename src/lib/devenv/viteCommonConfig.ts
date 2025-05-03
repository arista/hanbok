import * as vite from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import {WebappConfig} from "./ProjectModel"
import fs from "node:fs"

export function viteCommonConfig(webapp: WebappConfig) {

  // FIXME - only use this for the dev server
  const injectPageContextPlugin = (): vite.Plugin => {
    const plugin: vite.Plugin = {
      name: "inject-page-context-plugin",
      apply: "serve",
      configureServer: (server: vite.ViteDevServer) => {
        server.middlewares.use(async (req, res, next) => {
          if (
            req.url?.startsWith("/") &&
            req.headers.accept?.includes("text/html")
          ) {
            const indexHtmlPath = webapp.indexHtmlPath
            const indexHtml = fs.readFileSync(indexHtmlPath, "utf-8")

            // const url = new URL(req.url ?? "/", `http://${req.headers.host}`)
            // // FIXME - unused for now until we fully use these to generate initial pagecontext
            // //const query = Object.fromEntries(url.searchParams.entries())
            // //const headers = req.headers
            // const requestPath = url.pathname
            // const pathToRoot = Utils.getPathToRoot(requestPath)
            // const webappApiEndpoint = new URL(
            //   `../${pathToRoot}`,
            //   url
            // ).toString()
            // const pageContext = {
            //   webappApiEndpoint,
            // }
            // const injectStr = `<script>window.__PAGE_CONTEXT__ = ${JSON.stringify(pageContext, null, 2)};</script>`
            const injectStr = `<script>window.__PAGE_CONTEXT__ = "hello!";</script>`
            const injectedIndexHtml = indexHtml.replace(
              "<!-- INJECT_PAGE_CONTEXT -->",
              injectStr
            )
            const transformedIndexHtml = await server.transformIndexHtml(
              req.url,
              injectedIndexHtml
            )
            res.setHeader("Content-Type", "text/html")
            res.end(transformedIndexHtml)
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
