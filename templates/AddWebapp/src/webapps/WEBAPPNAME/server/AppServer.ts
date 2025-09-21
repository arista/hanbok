import {RoutesServerHelper, AppServerEnvBase} from "hanbok/server"
import type {IRouter, IRouterRequestResponse} from "hanbok/routes"
import {routeDefs} from "../routes/Routes"
import {AppRouteHandlerFactory} from "./AppRouteHandlerFactory"
import {MockBackend} from "./MockBackend"
import {PrismaClient as PrismaClientMain} from "prisma-app-client/main/index.js"

export type AppServerProps = AppServerEnvBase & {}

export class AppServer<C extends AppServerProps> {
  constructor(public props: C) {}

  async initialize() {
    const {routesPrefix, router} = this.props
    this.addRoutes(routesPrefix, router)
  }

  addRoutes(prefix: string, router: IRouter) {
    const r = new RoutesServerHelper({
      router,
      createHandlerFactory: (rr: IRouterRequestResponse) =>
        this.createHandlerFactory(rr),
      prefix,
    })

    const a = routeDefs
    r.nested(a.api, (r, a) => {
      r.nested(a.sampleResource, (r, a) => {
        r.add(
          a.list,
          (f) => f.sampleResource,
          (h, r) => h.list()
        )
        r.add(
          a.create,
          (f) => f.sampleResource,
          (h, r) => h.create(r)
        )
        r.add(
          a.get,
          (f) => f.sampleResource,
          (h, r) => h.get(r)
        )
        r.add(
          a.delete,
          (f) => f.sampleResource,
          (h, r) => h.delete(r)
        )
        r.add(
          a.update,
          (f) => f.sampleResource,
          (h, r) => h.update(r)
        )
      })
    })
    r.nested(a.pages, (r, a) => {
      r.add(
        a.root,
        (f) => f.appRoute,
        (h, r) => h.rootRoute()
      )
      r.add(
        a.default,
        (f) => f.appRoute,
        (h, r) => h.defaultRoute(r)
      )
    })
  }

  createHandlerFactory(requestResponse: IRouterRequestResponse) {
    const {routesEndpoint, routerBase, isProduction, manifest, assetsBase} =
      this.props
    const {backend, prismaMain} = this
    return new AppRouteHandlerFactory({
      requestResponse,
      routesEndpoint,
      routerBase,
      isProduction,
      manifest,
      assetsBase,
      backend,
      prismaMain,
    })
  }

  _backend?: MockBackend
  get backend(): MockBackend {
    return (this._backend ??= (() => {
      return new MockBackend({})
    })())
  }

  _prismaMain?: PrismaClientMain
  get prismaMain(): PrismaClientMain {
    return (this._prismaMain ??= (() => {
      return new PrismaClientMain({})
    })())
  }
}
