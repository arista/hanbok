import * as AppRouteHandlerBase from "../AppRouteHandlerBase"
import type {ViteManifest} from "hanbok/server"
import {z} from "zod"
import {routeDefs} from "../../routes/Routes"
import {PageContext} from "../../ui/app/PageContext"

export type Props = AppRouteHandlerBase.Props & {
  routesEndpoint: string
  routerBase: string
  isProduction: boolean
  manifest: ViteManifest
  assetsBase: string
}

export class Handler extends AppRouteHandlerBase.Handler<Props> {
  constructor(props: Props) {
    super(props)
  }

  get routesEndpoint() {
    return this.props.routesEndpoint
  }

  get routerBase() {
    return this.props.routerBase
  }

  async generateIndexPage({title}: {title: string}) {
    const {response} = this
    const {routerBase, routesEndpoint, manifest, isProduction, assetsBase} =
      this.props

    const {headers} = this.request
    const serveDevMode = !isProduction && headers["hb-dev-mode"] === "dev"

    const pageContext: PageContext = {
      routesEndpoint,
      routerBase,
    }

    this.generateIndexHtml({
      pageContext,
      serveDevMode,
      title,
      assetsBase,
      manifest,
      headElems: [
        `    <meta charset="UTF-8" />`,
        `    <link rel="icon" type="image/svg+xml" href="${assetsBase}sampleIcon.svg" />`,
        `    <meta name="viewport" content="width=device-width, initial-scale=1.0" />`,
      ].join("\n"),
    })
  }

  async rootRoute() {
    await this.generateIndexPage({
      title: "hb-test-app",
    })
  }

  async defaultRoute(request: z.infer<typeof routeDefs.pages.default.request>) {
    await this.generateIndexPage({
      title: "hb-test-app",
    })
  }
}
