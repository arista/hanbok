import "source-map-support/register.js"
import * as OC from "@oclif/core"
import {addLib} from "@lib/gen/AddLib"

export class Command extends OC.Command {
  static override description =
    "Adds a library that will be exported by the current hanbok app"

  static override args = {
    name: OC.Args.string({
      description: `The name of the library to add`,
      required: true,
    }),
  }
  static override enableJsonFlag = true

  async run() {
    const {args, flags} = await this.parse(Command)
    const {name} = args
    return await (async () => {
      await addLib({
        name,
      })
    })()
  }
}
