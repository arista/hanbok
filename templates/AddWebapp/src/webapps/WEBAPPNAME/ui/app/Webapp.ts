import {Model} from "./Model"
import {Controller} from "./Controller"
import {PageContext, getPageContext} from "./PageContext"
import {ViewEnv, createViewEnv} from "./ViewEnv"
import {AppClient} from "./AppClient"
import {IRoutes} from "../../routes/Routes"

export class Webapp {
  constructor(public props: {}) {
    // Start any controller processes running
    this.controller.start()
  }

  _model: Model | null = null
  get model(): Model {
    return (this._model ||= (() => {
      return new Model({})
    })())
  }

  _controller: Controller | null = null
  get controller(): Controller {
    return (this._controller ||= (() => {
      const {model, routes} = this
      return new Controller({
        model,
        routes,
      })
    })())
  }

  _pageContext: PageContext | null = null
  get pageContext(): PageContext {
    return (this._pageContext ||= (() => {
      return getPageContext()
    })())
  }

  _viewEnv: ViewEnv | null = null
  get viewEnv(): ViewEnv {
    return (this._viewEnv ||= (() => {
      const {model, controller, pageContext} = this
      return createViewEnv({
        model,
        controller,
        pageContext,
      })
    })())
  }

  _appClient?: AppClient
  get appClient(): AppClient {
    return (this._appClient ??= (() => {
      return new AppClient({
        routesEndpoint: this.pageContext.routesEndpoint,
      })
    })())
  }

  _routes?: IRoutes
  get routes(): IRoutes {
    return (this._routes ??= (() => {
      return this.appClient.routes
    })())
  }
}
