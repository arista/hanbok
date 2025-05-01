import type {IRouterRequest, IRouterResponse} from "./IRouter"
import {z, ZodFormattedError} from "zod"

export async function handleApiDefRoute({
  req,
  createApiHandler,
}: {
  req: ApiDefRequest<any, any>
  createApiHandler: CreateApiHandler
}) {
  const {routerRequest, routerResponse, request, requestSchema, handler} = req
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

    // Create an instance of the handler
    const rootHandler = createApiHandler({request: routerRequest})

    // Send the request to the handler
    const result = await handler(rootHandler, request)

    routerResponse.status(200)
    routerResponse.json(result)
  } catch (err) {
    if (err instanceof NotFoundError) {
      routerResponse.status(404).json({
        error: "Not Found",
        details: err.message,
      })
    } else if (err instanceof InvalidRequestError) {
      routerResponse.status(400).json({
        error: err.name,
        details: err.message,
      })
    } else if (err instanceof InvalidDataError) {
      routerResponse.status(400).json({
        error: err.name,
        details: err.error,
      })
    } else {
      // FIXME - handle the error better than this
      routerResponse.status(500).json({
        error: "Server Error",
      })
      console.error(err)
    }
  }
}

type ApiHandler = any

type CreateApiHandler = (props: {request: IRouterRequest}) => ApiHandler

export type ApiDefRequest<RQ, RS> = {
  routerRequest: IRouterRequest
  routerResponse: IRouterResponse
  request: RQ
  requestSchema: z.ZodTypeAny
  handler: (rootHandler: ApiHandler, request: RQ) => Promise<RS>
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NotFoundError"
  }
}

export class InvalidRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InvalidRequestError"
  }
}

export class InvalidDataError extends Error {
  constructor(
    message: string,
    public error: ZodFormattedError<unknown, string>
  ) {
    super(message)
    this.name = "InvalidDataError"
  }
}
