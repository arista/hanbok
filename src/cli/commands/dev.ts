import * as OC from "@oclif/core"
import {Dev} from "@lib/devenv/Dev"

export class Command extends OC.Command {
  static override description = "Run the project in development mode"

  static override args = {}
  static override flags = {
    "no-app-server": OC.Flags.boolean({
      description: `Do not run the app server (if, for example, it's already running with npx hanbok app-server`,
      required: false,
      default: false,
    }),
  }
  static override enableJsonFlag = true

  async run() {
    const {args, flags} = await this.parse(Command)
    const noAppServer = flags["no-app-server"]
    return await (async () => {
      return await new Dev({noAppServer}).run()
    })()
  }
}
