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

  async handleRequest<H, RQ>(
    handler: H,
    requestSchema: z.ZodTypeAny,
    invokeHandler: (handler: H, request: RQ) => Promise<void>
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
      invokeHandler(handler, parseResult.data)
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

  validateRequest<S extends z.ZodTypeAny, R = z.infer<S>>(schema: S): R {
    const request = {
      request: this.request.params,
      query: this.request.query,
      body: this.request.body,
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
