import {Build} from "./Build"
import {DevServer} from "./DevServer"
import {createProjectModel} from "@lib/devenv/createProjectModel"

export class Dev {
  constructor(public props: {}) {}

  async run() {
    const model = await createProjectModel({})
    const build = new Build({watch: true, model})
    const devServer = new DevServer({model})
    await Promise.all([build.run(), devServer.run()])
  }
}
