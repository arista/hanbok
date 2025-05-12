import "source-map-support/register.js"
import * as OC from "@oclif/core"
import {AppServer, AppServerWatch} from "@lib/devenv/AppServer"

export class Command extends OC.Command {
  static override description =
    "Start the local app server running application code"

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
        return await new AppServerWatch().run()
      } else {
        return await new AppServer({}).run()
      }
    })()
  }
}
