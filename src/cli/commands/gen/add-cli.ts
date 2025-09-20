import "source-map-support/register.js"
import * as OC from "@oclif/core"
import {addCli} from "@lib/gen/AddCli"

export class Command extends OC.Command {
  static override description = "Adds a CLI"

  static override args = {
    name: OC.Args.string({
      description: `The name of the executable that will run the CLI`,
      required: true,
    }),
  }
  static override enableJsonFlag = true

  async run() {
    const {args, flags} = await this.parse(Command)
    const {name} = args
    return await (async () => {
      await addCli({
        name,
      })
    })()
  }
}
