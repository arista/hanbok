import {Build} from "./Build"
import {DevServer} from "./DevServer"
import {createProjectModel} from "@lib/devenv/createProjectModel"
import {ApiServerWatch} from "@lib/devenv/ApiServer"

export class Dev {
  constructor(public props: {}) {}

  async run() {
    const model = await createProjectModel({})
    const build = new Build({watch: true, model})
    const devServer = new DevServer({model})
    const appServerRunner = new ApiServerWatch()
    await Promise.all([build.run(), devServer.run(), appServerRunner.run()])
  }
}
