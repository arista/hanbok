import type {AppServerEnvBase, DevAppServerCreateFunc} from "hanbok/server"
import {AppServer} from "./AppServer"

export class DevAppServer<C extends AppServerEnvBase> extends AppServer<C> {
  constructor(props: C) {
    super(props)
  }
}

const createAppServer: DevAppServerCreateFunc = async (props) => {
  await new DevAppServer(props).initialize()
}
export default createAppServer
