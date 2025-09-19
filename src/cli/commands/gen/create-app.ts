import "source-map-support/register.js"
import * as OC from "@oclif/core"
import {createApp} from "@lib/gen/CreateApp"

export class Command extends OC.Command {
  static override description = "Creates a new empty hanbok app"

  static override args = {
    name: OC.Args.string({
      description: `The name of the app`,
      required: true,
    }),
  }
  static override flags = {
    path: OC.Flags.string({
      char: "p",
      description: `The path into which to create the app (defaults to the ./{app name})`,
      required: false,
    }),
  }
  static override enableJsonFlag = true

  async run() {
    const {args, flags} = await this.parse(Command)
    const {path} = flags
    const {name} = args
    return await (async () => {
      await createApp({
        path,
        name,
      })
    })()
  }
}
