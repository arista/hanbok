import "source-map-support/register.js"
import * as OC from "@oclif/core"
import * as NU from "@lib/utils/NameUtils"
import {createProjectModel} from "@lib/devenv/createProjectModel"

export class Command extends OC.Command {
  static override description =
    "Generate the name of the webapp's lambda for the given deployenv"

  static override args = {}
  static override flags = {
    deployenv: OC.Flags.string({
      char: "d",
      description: `The deployment environment`,
      required: true,
    }),
    webapp: OC.Flags.string({
      char: "w",
      description: `The name of the webapp`,
      required: true,
    }),
  }
  static override enableJsonFlag = true

  async run() {
    const {args, flags} = await this.parse(Command)
    const {deployenv, webapp} = flags
    const projectModel = await createProjectModel({})
    const name = NU.toLambdaName(
      projectModel.suite!.name,
      projectModel.name,
      deployenv,
      webapp
    )
    console.log(name)
  }
}
