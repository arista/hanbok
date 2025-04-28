import * as OC from "@oclif/core"
import {Prettier} from "@lib/devenv/Prettier"

export class Command extends OC.Command {
  static override description = "Rewrites files with prettier formatting"

  static override args = {}
  static override flags = {}
  static override enableJsonFlag = true

  async run() {
    const {args, flags} = await this.parse(Command)
    return await (async () => {
      return await new Prettier({}).run()
    })()
  }
}
