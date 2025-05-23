import "source-map-support/register.js"
import * as OC from "@oclif/core"
import {createProjectModel} from "@lib/devenv/createProjectModel"
import {execInternalScript} from "@lib/utils/ProcUtils"
import * as NU from "@lib/utils/NameUtils"
import * as AU from "@lib/utils/AwsUtils"

export class Command extends OC.Command {
  static override description = "Drops the user that is used by the current app"

  static override args = {}
  static override flags = {}
  static override enableJsonFlag = true

  async run() {
    const {args, flags} = await this.parse(Command)
    const projectModel = await createProjectModel({})
    if (projectModel.suite == null) {
      throw new Error(
        `This command must be run in an app directory, not a suite`
      )
    }
    const suiteName = projectModel.suite!.name
    const appName = projectModel.name

    // FIXME - abstract this out
    const prefix = NU.toDashedName([suiteName, appName], (s) =>
      NU.toAlphanumDash(s, 65)
    )
    const secretExportName = `${prefix}:db:credentials:secret-name`
    const secretName = await AU.readCloudFormationExport(secretExportName)
    const secretValue = JSON.parse(await AU.getSecretValue(secretName))
    const {username} = secretValue

    await execInternalScript({
      script: "db-drop-app-user",
      args: [suiteName, appName, username],
    })
  }
}
