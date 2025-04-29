// The main entrypoint for the local server, running the HttpServer
// plus any other required services

import {HttpServer} from "./HttpServer"
import type {IRouter} from "./IRouter"

export type Props = {
  port: number
  addRoutes: (r: IRouter) => void
}

export class LocalServerBase<C extends Props> {
  constructor(public props: C) {}

  get port() {
    return this.props.port
  }

  get addRoutes() {
    return this.props.addRoutes
  }

  _httpServer: HttpServer | null = null
  get httpServer(): HttpServer {
    const {port, addRoutes} = this
    return (this._httpServer ||= (() => {
      return new HttpServer({
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

  _httpShutdown:(()=>Promise<void>) | null = null
  async startHttpServer() {
    this._httpShutdown = await this.httpServer.run()
  }

  async onShutdownSignal(signal: string) {
    if (this._httpShutdown) {
      await this._httpShutdown()
    }
    process.exit(0)
  }
}
