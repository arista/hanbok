// The list of types to be exposed in the library's .d.ts file

export {defineRoutes, routes, GROUP_ROUTE} from "@lib/routes/RouteDefs"
export type {RouteDefs, RouteDef, RoutesInterface} from "@lib/routes/RouteDefs"
export type {
  IRouter,
  IRouterRequestHandler,
  IRouterRequest,
  IRouterResponse,
  IRouterRequestResponse,
} from "@lib/routes/IRouter"
export {
  NotFoundError,
  InvalidDataError,
  InvalidRequestError,
} from "@lib/routes/IRouter"
export {RouteHandlerBase} from "@lib/routes/RouteHandlerBase"
export type {RouteHandlerBaseProps} from "@lib/routes/RouteHandlerBase"
export {createRoutesClient, sendClientRequest} from "@lib/routes/RoutesClient"
export type {
  ClientRequest,
  ClientRequestHandler,
} from "@lib/routes/RoutesClient"
