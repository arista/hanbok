import "source-map-support/register.js"
import * as OC from "@oclif/core"
import {runCdkStack, CdkCommand} from "@lib/utils/cdk/runCdkStack"

export class Command extends OC.Command {
  static override description =
    "Runs the CDK command to generate an app's backend (prisma access to database, etc.)"

  static override args = {
    command: OC.Args.string({
      description: "The CDK command to run on the stack",
      options: ["deploy", "destroy", "synth"],
      required: true,
    }),
  }
  static override flags = {
    branch: OC.Flags.string({
      char: "b",
      description: `The branch for which the pipeline should be created`,
      required: false,
      default: "main",
    }),
    backend: OC.Flags.string({
      char: "e",
      description: `The backend to which the pipeline will deploy`,
      required: true,
    }),
  }
  static override enableJsonFlag = true

  async run() {
    const {args, flags} = await this.parse(Command)
    const {command} = args
    const {branch, backend} = flags
    const stackProps: any = {
      branch,
      backend,
    }
    return await (async () => {
      await runCdkStack({
        stackClassName: "Backend",
        stackRole: "backend",
        roleInstance: backend,
        command: command as CdkCommand,
        stackProps,
      })
    })()
  }
}
