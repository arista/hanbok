// The main entrypoint for the local server, running the HttpServer
// plus any other required services

import {HttpServer} from "./HttpServer"
import type {IRouter} from "./IRouter"
import {ProjectModel} from "./ProjectModel"
import {createProjectModel} from "./createProjectModel"

export type Props = {
  port: number
  addRoutes: (r: IRouter) => void
}

export class LocalServerBase<C extends Props> {
  constructor(public props: C) {}

  _projectModel: Promise<ProjectModel> | null = null
  get projectModel(): Promise<ProjectModel> {
    return (this._projectModel ||= (async () => {
      return await createProjectModel({})
    })())
  }

  get port() {
    return this.props.port
  }

  get addRoutes() {
    return this.props.addRoutes
  }

  _httpServer: Promise<HttpServer> | null = null
  get httpServer(): Promise<HttpServer> {
    const {port, addRoutes} = this
    return (this._httpServer ||= (async () => {
      return new HttpServer({
        //        model: await this.projectModel,
        port,
        addRoutes,
      })
    })())
  }

  async run() {
    this.initializeSignalHandlers()
    this.startHttpServer()
  }

  initializeSignalHandlers() {
    const signals = ["SIGINT", "SIGQUIT", "SIGTERM"]
    for (const signal of signals) {
      process.on(signal, () => this.onShutdownSignal(signal))
    }
  }

  _httpShutdown: (() => Promise<void>) | null = null
  async startHttpServer() {
    const httpServer = await this.httpServer
    this._httpShutdown = await httpServer.run()
  }

  async onShutdownSignal(signal: string) {
    if (this._httpShutdown) {
      await this._httpShutdown()
    }
    process.exit(0)
  }
}
