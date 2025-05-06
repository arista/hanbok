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

// export async function proxyRequest({
//   req,
//   res,
//   targetUrlBase,
//   transformHtml,
//   devMode,
// }: {
//   req: IncomingMessage
//   res: ServerResponse
//   targetUrlBase: string
//   transformHtml?: (html: string) => Promise<string>
//   devMode: DevMode
// }) {
//   return new Promise<void>((resolve, reject) => {
//     const proxy = httpProxy.createProxyServer({
//       target: targetUrlBase,
//       changeOrigin: true,
//     })
//     proxy.on("proxyReq", (proxyReq, req, res) => {
//       proxyReq.setHeader("hb-dev-mode", devMode)
//     })
//     proxy.on('proxyRes', (proxyRes, req, res) => {
//       const contentType = proxyRes.headers["content-type"]
//       const statusCode = proxyRes.statusCode

//       let body: Array<Buffer> = [];
//       proxyRes.on('data', (chunk) => {
//         body.push(chunk);
//       });
//       proxyRes.on('end', async () => {
//         const raw = Buffer.concat(body).toString();
//         if (contentType != null && contentType.includes("text/html") && transformHtml != null) {
//           const transformed = await transformHtml(raw)
//           res.setHeader("Content-Type", "text/html")
//           res.end(transformed)
//         }
//         else {
//           if (contentType != null) {
//             res.setHeader("content-type", contentType)
//             res.end(raw)
//           }
//         }

//   //   if (contentType.includes("text/html") && transformHtml != null) {
//   //     const html = await apiRes.text()
//   //     const transformed = await transformHtml(html)
//   //     res.setHeader("Content-Type", "text/html")
//   //     res.end(transformed)
//   //   } else {
//   //     // Otherwise, stream directly
//   //     res.setHeader("Content-Type", contentType)
//   //     if (apiRes.body) {
//   //       const nodeStream = Readable.fromWeb(apiRes.body as any)
//   //       nodeStream.pipe(res)
//   //     } else {
//   //       res.end()
//   //     }
//   //   }

//         // Example: log or modify the response
// //        console.log(`[proxy] ${req.url} → response:`, raw);

//         // Optionally, modify and send custom response:
//         // res.writeHead(proxyRes.statusCode!, proxyRes.headers);
//         // res.end(modifiedBody);
//       });
//     });
//     proxy.web(req, res, {}, (err) => {
//       console.error("Error proxying request (is the AppServer running?):", err)
//       res.statusCode = 500
//       res.end("Internal server error")
//       resolve()
//     })
//   })

//   // try {
//   //   const pathname = parseUrl(req.url || "").pathname || ""
//   //   const targetUrl = `${targetUrlBase}${req.url}`

//   //   // Prepare fetch options
//   //   const headers = {...req.headers} as Record<string, string>
//   //   delete headers["host"] // avoid leaking dev host
//   //   headers["hb-dev-mode"] = devMode

//   //   const method = req.method || "GET"
//   //   const fetchOpts: RequestInit = {
//   //     method,
//   //     headers,
//   //   }

//   //   // If method has a body, read and forward it
//   //   if (["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())) {
//   //     const rawBody = await getRawBody(req)
//   //     fetchOpts.body = rawBody
//   //   }

//   //   const apiRes = await fetch(targetUrl, fetchOpts)

//   //   // Forward headers except content-type
//   //   const skipHeaders = new Set(["content-type", "content-length"])
//   //   apiRes.headers.forEach((value, key) => {
//   //     if (!skipHeaders.has(key.toLowerCase())) {
//   //       res.setHeader(key, value)
//   //     }
//   //   })

//   //   const contentType = apiRes.headers.get("content-type") || ""
//   //   res.statusCode = apiRes.status

//   //   // If HTML, transform it for Vite
//   //   if (contentType.includes("text/html") && transformHtml != null) {
//   //     const html = await apiRes.text()
//   //     const transformed = await transformHtml(html)
//   //     res.setHeader("Content-Type", "text/html")
//   //     res.end(transformed)
//   //   } else {
//   //     // Otherwise, stream directly
//   //     res.setHeader("Content-Type", contentType)
//   //     if (apiRes.body) {
//   //       const nodeStream = Readable.fromWeb(apiRes.body as any)
//   //       nodeStream.pipe(res)
//   //     } else {
//   //       res.end()
//   //     }
//   //   }
//   // } catch (err) {
//   //   console.error("Error proxying request (is the ApiServer running?):", err)
//   //   res.statusCode = 500
//   //   res.end("Internal server error")
//   // }
// }

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
