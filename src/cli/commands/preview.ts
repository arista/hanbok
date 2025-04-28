import * as OC from "@oclif/core"
import {Preview} from "@lib/devenv/Preview"

export class Command extends OC.Command {
  static override description = "Run the project in preview mode"

  static override args = {}
  static override flags = {}
  static override enableJsonFlag = true

  async run() {
    const {args, flags} = await this.parse(Command)
    return await (async () => {
      return await new Preview({}).run()
    })()
  }
}
