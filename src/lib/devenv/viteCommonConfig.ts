import * as vite from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import {ProjectModel, WebappConfig} from "./ProjectModel"
import fs from "node:fs"
import {parse as parseUrl} from "node:url"
import getRawBody from "raw-body"
import {Readable} from "node:stream"

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
            try {
              const pathname = parseUrl(req.url || "").pathname || ""
              const targetUrl = `http://localhost:${apiPort}/${webapp.name}${req.url}`

              // Prepare fetch options
              const headers = {...req.headers} as Record<string, string>
              delete headers["host"] // avoid leaking dev host

              const method = req.method || "GET"
              const fetchOpts: RequestInit = {
                method,
                headers,
              }

              // If method has a body, read and forward it
              if (
                ["POST", "PUT", "PATCH", "DELETE"].includes(
                  method.toUpperCase()
                )
              ) {
                const rawBody = await getRawBody(req)
                fetchOpts.body = rawBody
              }

              const apiRes = await fetch(targetUrl, fetchOpts)

              // Forward headers except content-type
              const skipHeaders = new Set(["content-type", "content-length"])
              apiRes.headers.forEach((value, key) => {
                if (!skipHeaders.has(key.toLowerCase())) {
                  res.setHeader(key, value)
                }
              })

              const contentType = apiRes.headers.get("content-type") || ""
              res.statusCode = apiRes.status

              // If HTML, transform it for Vite
              if (contentType.includes("text/html")) {
                const html = await apiRes.text()
                const transformed = await server.transformIndexHtml(
                  req.url!,
                  html
                )
                res.setHeader("Content-Type", "text/html")
                res.end(transformed)
              } else {
                // Otherwise, stream directly
                res.setHeader("Content-Type", contentType)
                if (apiRes.body) {
                  const nodeStream = Readable.fromWeb(apiRes.body as any)
                  nodeStream.pipe(res)
                } else {
                  res.end()
                }
              }
            } catch (err) {
              console.error(
                "Error proxying request (is the ApiServer running?):",
                err
              )
              res.statusCode = 500
              res.end("Internal server error")
            }
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
