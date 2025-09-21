import "source-map-support/register.js"
import * as OC from "@oclif/core"
import {addTest} from "@lib/gen/AddTest"

export class Command extends OC.Command {
  static override description = "Adds the test setup"

  static override enableJsonFlag = true

  async run() {
    const {args, flags} = await this.parse(Command)
    return await (async () => {
      await addTest({})
    })()
  }
}
