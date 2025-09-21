import "source-map-support/register.js"
import * as OC from "@oclif/core"
import {addWebapp} from "@lib/gen/AddWebapp"

export class Command extends OC.Command {
  static override description = "Adds a webapp."

  static override args = {
    name: OC.Args.string({
      description: `The name of the webapp to add`,
      required: true,
    }),
  }
  static override enableJsonFlag = true

  async run() {
    const {args, flags} = await this.parse(Command)
    const {name} = args
    return await (async () => {
      await addWebapp({
        name,
      })
    })()
  }
}
