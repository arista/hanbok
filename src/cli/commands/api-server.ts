import * as OC from "@oclif/core"
import {ApiServer, ApiServerWatch} from "@lib/devenv/ApiServer"

export class Command extends OC.Command {
  static override description =
    "Start the local api server running application code"

  static override args = {}
  static override flags = {
    watch: OC.Flags.boolean({
      char: "w",
      description: `Enable watch mode, for automatic rebuilding on file changes`,
      required: false,
      default: false,
    }),
  }
  static override enableJsonFlag = true

  async run() {
    const {args, flags} = await this.parse(Command)
    const {watch} = flags
    return await (async () => {
      if (watch) {
        return await new ApiServerWatch().run()
      } else {
        return await new ApiServer({}).run()
      }
    })()
  }
}
