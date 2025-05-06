import {Build} from "./Build"
import {DevServer} from "./DevServer"
import {createProjectModel} from "@lib/devenv/createProjectModel"
import {AppServerWatch} from "@lib/devenv/AppServer"

export class Dev {
  constructor(
    public props: {
      noAppServer: boolean
    }
  ) {}

  async run() {
    const model = await createProjectModel({})
    const build = new Build({watch: true, model})
    const devServer = new DevServer({model})
    const running: Array<Promise<any>> = [build.run(), devServer.run()]
    if (!this.props.noAppServer) {
      const appServerRunner = new AppServerWatch()
      running.push(appServerRunner.run())
    }
    await Promise.all(running)
  }
}
