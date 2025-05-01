// The list of types to be exposed in the library's .d.ts file

export {defineConfig} from "@lib/devenv/ProjectConfig"
export {LocalServerBase} from "@lib/devenv/LocalServerBase"
export {
  defineApi,
  NotFoundError,
  InvalidDataError,
  InvalidRequestError,
} from "@lib/api/ApiDef"
export type {
  ApiDef,
  ApiDefEntry,
  ApiDefRoute,
  ApiDefNested,
  ApiInterface,
  RequestType,
  ResponseType,
} from "@lib/api/ApiDef"
export type {IDevApiServer} from "@lib/api/IDevApiServer"
export type {
  IRouter,
  IRouterRequestHandler,
  IRouterRequest,
  IRouterResponse,
} from "@lib/api/IRouter"
export {addApiDefRoutes} from "@lib/api/addApiDefRoutes"
