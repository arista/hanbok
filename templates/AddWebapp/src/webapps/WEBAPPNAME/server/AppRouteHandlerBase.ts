import {RouteHandlerBase, RouteHandlerBaseProps} from "hanbok/routes"
import {z} from "zod"

export type Props = RouteHandlerBaseProps & {}

export class Handler<C extends Props> extends RouteHandlerBase<C> {
  constructor(props: C) {
    super(props)
  }

  // This is the "middleware" mechanism pattern.  Handlers can
  // override this method to insert actions before, after, or around
  // the final handling of the request.  Use the pattern to also allow
  // the superclasses to insert their own middleware actions
  override async handleRequest<H, RQ, RS>(
    handler: H,
    request: RQ,
    invokeHandler: (handler: H, request: RQ) => Promise<RS>
  ) {
    return await super.handleRequest(
      handler,
      request,
      async (handler, request) => {
        // Insert before, after, around here
        return await invokeHandler(handler, request)
      }
    )
  }
}
