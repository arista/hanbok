import * as OC from "@oclif/core"
import {Infrastructure} from "@lib/cdk/Infrastructure"

export class Command extends OC.Command {
  static override description =
    "Runs the CDK command to generate the app's infrastructure"

  static override args = {}
  static override flags = {}
  static override enableJsonFlag = true

  async run() {
    const {args, flags} = await this.parse(Command)
    return await (async () => {
      return await new Infrastructure({}).run()
    })()
  }
}
