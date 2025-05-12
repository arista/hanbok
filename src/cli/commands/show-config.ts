import 'source-map-support/register.js'
import * as OC from "@oclif/core"
import {createProjectModel} from "@lib/devenv/createProjectModel"

export class Command extends OC.Command {
  static override description = "Sample command"

  static override args = {}
  static override flags = {}
  static override enableJsonFlag = true

  async run() {
    const {args, flags} = await this.parse(Command)
    const {arg1} = args
    const {flag1} = flags
    return await createProjectModel({})
  }
}
