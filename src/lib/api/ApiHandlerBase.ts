import {
  IRouterRequestResponse,
  NotFoundError,
  InvalidDataError,
  InvalidRequestError,
} from "./IRouter"
import {z} from "zod"

export type ApiHandlerBaseProps = {
  requestResponse: IRouterRequestResponse
}

export class ApiHandlerBase<C extends ApiHandlerBaseProps> {
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
}
