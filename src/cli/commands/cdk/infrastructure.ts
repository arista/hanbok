import * as OC from "@oclif/core"
import {runCdkStack, CdkCommand} from "@lib/cdk/runCdkStack"

export class Command extends OC.Command {
  static override description =
    "Runs the CDK command to generate the app's infrastructure"

  static override args = {
    command: OC.Args.string({
      description: "The CDK command to run on the stack",
      options: ["deploy", "destroy"],
      required: true,
    }),
  }
  static override flags = {}
  static override enableJsonFlag = true

  async run() {
    const {args, flags} = await this.parse(Command)
    const {command} = args
    return await (async () => {
      await runCdkStack({
        stackClassName: "Infrastructure",
        stackRole: "infrastructure",
        command: command as CdkCommand,
      })
    })()
  }
}
