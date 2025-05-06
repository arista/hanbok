import {IncomingMessage, ServerResponse} from "node:http"
import {parse as parseUrl} from "node:url"
import getRawBody from "raw-body"
import {Readable} from "node:stream"
import httpProxy from "http-proxy"
import * as PM from "@lib/devenv/ProjectModel"

export type DevMode = "dev" | "preview"

export async function proxyRequest({
  req,
  res,
  targetUrlBase,
  transformHtml,
  devMode,
}: {
  req: IncomingMessage
  res: ServerResponse
  targetUrlBase: string
  transformHtml?: (html: string) => Promise<string>
  devMode: DevMode
}): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const proxy = httpProxy.createProxyServer({selfHandleResponse: true})
    proxy.once("proxyRes", async (proxyRes, _req, _res) => {
      try {
        const statusCode = proxyRes.statusCode || 500
        const contentType = proxyRes.headers["content-type"] || ""

        const bodyChunks: Buffer[] = []
        proxyRes.on("data", (chunk) => bodyChunks.push(chunk))
        proxyRes.on("end", async () => {
          const rawBody = Buffer.concat(bodyChunks)
          const isHtml = contentType.includes("text/html")

          res.statusCode = statusCode
          for (const [key, value] of Object.entries(proxyRes.headers)) {
            if (value !== undefined) {
              res.setHeader(key, value as string)
            }
          }

          if (isHtml && transformHtml) {
            const original = rawBody.toString("utf-8")
            const transformed = await transformHtml(original)
            res.setHeader("content-length", Buffer.byteLength(transformed))
            res.end(transformed)
          } else {
            res.end(rawBody)
          }

          resolve()
        })
      } catch (err) {
        reject(err)
      }
    })

    proxy.once("error", (err) => {
      console.error("Error proxying request (is the AppServer running?):", err)
      res.statusCode = 500
      res.end("Internal server error")
      resolve()
    })

    proxy.web(req, res, {
      target: targetUrlBase,
      changeOrigin: true,
      headers: {
        "hb-dev-mode": devMode,
      },
    })
  })
}

export function shouldProxyRequest({
  model,
  webapp,
  req,
}: {
  model: PM.ProjectModel
  webapp: PM.WebappConfig
  req: IncomingMessage
}) {
  // FIXME - is there a more reliable way to distinguish between
  // assset requests and "AppServer" requests?
  const apiPort = model.devenv.apiServer?.port
  return (
    apiPort != null &&
    webapp.devApiServer != null &&
    ((req.url?.startsWith("/") && req.headers.accept?.includes("text/html")) ||
      req.url?.startsWith("/api/"))
  )
}
