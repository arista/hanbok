import * as OC from "@oclif/core"
import {runCdkStack, CdkCommand} from "@lib/utils/cdk/runCdkStack"

export class Command extends OC.Command {
  static override description =
    "Runs the CDK command to generate the AWS infrastructure resources for the app in the current directory"

  static override args = {
    command: OC.Args.string({
      description: "The CDK command to run on the stack",
      options: ["deploy", "destroy", "synth"],
      required: true,
    }),
  }
  static override flags = {}
  static override enableJsonFlag = true

  async run() {
    const {args, flags} = await this.parse(Command)
    const {command} = args
    const stackProps: any = {}
    return await (async () => {
      await runCdkStack({
        stackClassName: "AppInfrastructure",
        stackRole: "app-infrastructure",
        command: command as CdkCommand,
        stackProps,
      })
    })()
  }
}
