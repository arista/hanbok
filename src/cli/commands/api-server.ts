import * as OC from "@oclif/core"
import {ApiServer} from "@lib/devenv/ApiServer"

export class Command extends OC.Command {
  static override description =
    "Start the local api server running application code"

  static override args = {}
  static override flags = {}
  static override enableJsonFlag = true

  async run() {
    const {args, flags} = await this.parse(Command)
    return await (async () => {
      return await new ApiServer({}).run()
    })()
  }
}
