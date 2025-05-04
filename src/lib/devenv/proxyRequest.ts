import {IncomingMessage, ServerResponse} from "node:http"
import {parse as parseUrl} from "node:url"
import getRawBody from "raw-body"
import {Readable} from "node:stream"

export async function proxyRequest({
  req,
  res,
  targetUrlBase,
  transformHtml,
}: {
  req: IncomingMessage
  res: ServerResponse
  targetUrlBase: string
  transformHtml?: (html: string) => Promise<string>
}) {
  try {
    const pathname = parseUrl(req.url || "").pathname || ""
    const targetUrl = `${targetUrlBase}${req.url}`

    // Prepare fetch options
    const headers = {...req.headers} as Record<string, string>
    delete headers["host"] // avoid leaking dev host

    const method = req.method || "GET"
    const fetchOpts: RequestInit = {
      method,
      headers,
    }

    // If method has a body, read and forward it
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())) {
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
    if (contentType.includes("text/html") && transformHtml != null) {
      const html = await apiRes.text()
      const transformed = await transformHtml(html)
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
    console.error("Error proxying request (is the ApiServer running?):", err)
    res.statusCode = 500
    res.end("Internal server error")
  }
}
