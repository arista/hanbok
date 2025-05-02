// The list of types to be exposed in the library's .d.ts file

export {defineConfig} from "@lib/devenv/ProjectConfig"
export {defineApi} from "@lib/api/ApiDef"
export type {
  ApiDef,
  ApiDefEntry,
  ApiDefRoute,
  ApiDefNested,
  ApiDefNestedTyped,
  ApiInterface,
  RequestType,
  ResponseType,
  InferredRequest,
} from "@lib/api/ApiDef"
export {ApiDefRouter} from "@lib/api/ApiDefRouter"
export type {IDevApiServer} from "@lib/api/IDevApiServer"
export type {
  IRouter,
  IRouterRequestHandler,
  IRouterRequest,
  IRouterResponse,
  IRouterRequestResponse,
} from "@lib/api/IRouter"
export type {
  NotFoundError,
  InvalidDataError,
  InvalidRequestError,
} from "@lib/api/IRouter"
export {addApiDefRoutes} from "@lib/api/addApiDefRoutes"
export {handleApiDefRoute} from "@lib/api/handleApiDefRoute"
export {ApiHandlerBase} from "@lib/api/ApiHandlerBase"
export type {ApiHandlerBaseProps} from "@lib/api/ApiHandlerBase"
