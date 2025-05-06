// Base class for server-side route handlers used by
// RoutesServerHelper.  Subclasses can optionally override
// "handleRequest" to effectively add "middleware" to requesthandling.

import {
  IRouterRequestResponse,
  NotFoundError,
  InvalidDataError,
  InvalidRequestError,
} from "./IRouter"
import type {ViteManifest} from "../appserver/AppServerTypes"
import {z} from "zod"

export type RouteHandlerBaseProps = {
  requestResponse: IRouterRequestResponse
}

export class RouteHandlerBase<C extends RouteHandlerBaseProps> {
  constructor(public props: C) {}

  get requestResponse() {
    return this.props.requestResponse
  }

  get request() {
    return this.requestResponse.request
  }

  get response() {
    return this.requestResponse.response
  }

  async baseHandleRequest<H, RQ, RS>(
    handler: H,
    requestSchema: z.ZodTypeAny,
    responseSchema: z.ZodTypeAny | null | undefined,
    invokeHandler: (handler: H, request: RQ) => Promise<RS>
  ) {
    const {request, response} = this
    try {
      // Validate the request against the requestSchema
      const parseResult = requestSchema.safeParse(request)
      if (!parseResult.success) {
        const error = parseResult.error.format()
        throw new InvalidDataError(
          "Request did not match the expected format",
          error
        )
      }

      // Pass in the request
      const result = await this.handleRequest(
        handler,
        parseResult.data,
        invokeHandler
      )

      // If a responseSchema is specified, then assume we're supposed
      // to send back a JSON result
      if (responseSchema != null) {
        // FIXME - implement this
        const responseResult = responseSchema.safeParse(result)
        if (responseResult.success) {
          response.json(responseResult.data)
        } else {
          const error = responseResult.error.format()
          throw new InvalidDataError(
            "Response did not match the expected format",
            error
          )
        }
      } else if (!response.isSent) {
        throw new Error(`Handler did not send a response`)
      }
    } catch (err) {
      if (err instanceof NotFoundError) {
        response.status(404).json({
          error: "Not Found",
          details: err.message,
        })
      } else if (err instanceof InvalidRequestError) {
        response.status(400).json({
          error: err.name,
          details: err.message,
        })
      } else if (err instanceof InvalidDataError) {
        response.status(400).json({
          error: err.name,
          details: err.error,
        })
      } else {
        // FIXME - handle the error better than this
        response.status(500).json({
          error: "Server Error",
        })
        console.error(err)
      }
    }
  }

  // Subclasses can override this to add "before", "after", and
  // "around" functionality to all requests handled by that class.  If
  // a subclass does override this, it should do so like this:
  //
  // override async handleRequest<H, RQ, RS>(...) {
  //   return await super.handleRequest(handler, request, async (handler, request)=>{
  //     // insert app-specific functionality around invoking the handler
  //     return await invokeHandler(h, r)
  //  })
  // }
  //
  // This allows the superclasses to insert their own functionality
  // around the request, before the handler runs its own functionality
  async handleRequest<H, RQ, RS>(
    handler: H,
    request: RQ,
    invokeHandler: (handler: H, request: RQ) => Promise<RS>
  ) {
    return await invokeHandler(handler, request)
  }

  validateRequest<S extends z.ZodTypeAny, R = z.infer<S>>(schema: S): R {
    const request = {
      request: this.request.params,
      query: this.request.query,
      body: this.request.body,
      headers: this.request.headers,
    }
    const parseResult = schema.safeParse(request)
    if (!parseResult.success) {
      const error = parseResult.error.format()
      throw new InvalidDataError(
        "Request did not match the expected format",
        error
      )
    }
    return request as any
  }

  async generateIndexHtml({
    pageContext,
    serveDevMode,
    title,
    assetsBase,
    manifest,
    headElems,
  }: {
    pageContext: any
    serveDevMode: boolean
    title: string
    assetsBase: string
    manifest: ViteManifest
    headElems: string
  }) {
    const {response} = this
    const manifestEntry = manifest["index.html"]!
    const {file, imports, css} = manifestEntry
    const pageContextJson = JSON.stringify(pageContext)

    const lines: Array<string> = []
    lines.push(
      `<!doctype html>`,
      `<html lang="en">`,
      `  <head>`,
      `    <script>window.__PAGE_CONTEXT__ = ${pageContextJson};</script>`,
      headElems,
      // FIXME - should probably HTML-escape the title string
      `    <title>${title}</title>`
    )
    if (!serveDevMode) {
      if (imports != null) {
        imports.forEach((val) => {
          const importManifestEntry = manifest[val]!
          lines.push(
            `    <link rel="modulepreload" crossorigin href="${assetsBase}${importManifestEntry.file}">`
          )
        })
      }
      if (css != null) {
        css.forEach((val) => {
          lines.push(
            `    <link rel="stylesheet" crossorigin href="${assetsBase}${val}">`
          )
        })
      }
    }
    lines.push(`  </head>`, `  <body>`, `    <div id="root"></div>`)
    if (!serveDevMode) {
      lines.push(
        `    <script type="module" crossorigin src="${assetsBase}${file}"></script>`
      )
    } else {
      lines.push(
        `    <script type="module" src="/boilerplate/main.tsx"></script>`
      )
    }
    lines.push(`  </body>`, `</html>`)
    const htmlText = lines.join("\n")
    response.type("text/html")
    response.send(htmlText)
  }
}
