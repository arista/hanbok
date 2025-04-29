import connect from "connect"
import {FindMyWayRouter} from "./FindMyWayRouter"
import http from "http"
import type {IRouter} from "./IRouter"

export interface Props {
  port: number
  addRoutes: (r: IRouter) => void
}

export class HttpServer {
  constructor(public props: Props) {}

  get port() {
    return this.props.port
  }

  get addRoutes() {
    return this.props.addRoutes
  }

  async run() {
    const app = connect()

    const router = new FindMyWayRouter()
    this.addRoutes(router)
    app.use((req, res, next) => {
      if (!router.r.lookup(req, res)) {
        next()
      }
    })

    // Prepare the server
    const server = http.createServer(app)
    
    server.listen(this.port, () => {
      console.log(`[local-server] Api server running at:`)
      console.log(` → http://localhost:${this.port}/`)
    })

    return async () => {
      console.log("[local-server] Shutting down...")
      await server.close()
    }
  }
}
