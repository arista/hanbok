import {Build} from "./Build"
import {PreviewServer} from "./PreviewServer"
import {createProjectModel} from "@lib/devenv/createProjectModel"

export class Preview {
  constructor(public props: {}) {}

  async run() {
    const model = await createProjectModel({})
    const previewServer = new PreviewServer({model})
    await previewServer.run()
  }
}
