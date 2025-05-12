import "source-map-support/register.js"
import * as OC from "@oclif/core"
import {Build} from "@lib/devenv/Build"

export class Command extends OC.Command {
  static override description = "Build the project"

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
      return await new Build({watch}).run()
    })()
  }
}
