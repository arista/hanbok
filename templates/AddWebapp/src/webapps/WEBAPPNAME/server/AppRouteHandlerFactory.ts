import {IRouterRequestResponse} from "hanbok/routes"
import * as SampleResource from "./handlers/SampleResourceHandler"
import * as Page from "./handlers/PageHandler"
import type {ViteManifest} from "hanbok/server"
import {MockBackend} from "./MockBackend"
import {PrismaClient as PrismaClientMain} from "prisma-app-client/main/index.js"

export class AppRouteHandlerFactory {
  constructor(
    public props: {
      requestResponse: IRouterRequestResponse
      routesEndpoint: string
      routerBase: string
      isProduction: boolean
      manifest: ViteManifest
      assetsBase: string
      backend: MockBackend
      prismaMain: PrismaClientMain
    }
  ) {}

  get sampleResource() {
    const {backend, prismaMain} = this.props
    return new SampleResource.Handler({
      requestResponse: this.props.requestResponse,
      backend,
      prismaMain,
    })
  }

  get appRoute() {
    const {
      routesEndpoint,
      routerBase,
      isProduction,
      manifest,
      assetsBase,
      backend,
    } = this.props
    return new Page.Handler({
      requestResponse: this.props.requestResponse,
      routesEndpoint,
      routerBase,
      isProduction,
      manifest,
      assetsBase,
    })
  }
}
