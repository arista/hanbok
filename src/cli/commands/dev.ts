import * as OC from "@oclif/core"
import {Dev} from "@lib/devenv/Dev"

export class Command extends OC.Command {
  static override description = "Run the project in development mode"

  static override args = {}
  static override flags = {}
  static override enableJsonFlag = true

  async run() {
    const {args, flags} = await this.parse(Command)
    return await (async () => {
      return await new Dev({}).run()
    })()
  }
}
