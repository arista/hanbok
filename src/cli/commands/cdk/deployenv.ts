import * as OC from "@oclif/core"
import {runCdkStack, CdkCommand} from "@lib/utils/cdk/runCdkStack"

export class Command extends OC.Command {
  static override description =
    "Runs the CDK command to generate an app's deployenv (build pipeine, server, endpoints)"

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
    deployenv: OC.Flags.string({
      char: "d",
      description: `The deployment environment to which the build should deploy`,
      required: true,
    }),
    "no-lambda": OC.Flags.boolean({
      description: `Omit the creation of the lambdas.  This is typically used when bootstrapping, since the lambdas will fail to create if their code is not available, but their code won't be available since the codepipeline hasn't yet run.`,
      required: false,
      default: false,
    }),
  }
  static override enableJsonFlag = true

  async run() {
    const {args, flags} = await this.parse(Command)
    const {command} = args
    const {branch, deployenv} = flags
    const noLambda = flags["no-lambda"]
    const stackProps: any = {
      branch,
      deployenv,
      noLambda,
    }
    return await (async () => {
      await runCdkStack({
        stackClassName: "Deployenv",
        stackRole: "deployenv",
        roleInstance: deployenv,
        command: command as CdkCommand,
        stackProps,
      })
    })()
  }
}
