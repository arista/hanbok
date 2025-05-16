import "source-map-support/register.js"
import * as OC from "@oclif/core"
import {createProjectModel} from "@lib/devenv/createProjectModel"
import {execInternalScript} from "@lib/utils/ProcUtils"
import * as NU from "@lib/utils/NameUtils"
import * as AU from "@lib/utils/AwsUtils"

export class Command extends OC.Command {
  static override description =
    "Starts the SSM tunnel running to the bastion host that will allow connections to resources from the local machine"

  static override args = {}
  static override flags = {}
  static override enableJsonFlag = true

  async run() {
    const {args, flags} = await this.parse(Command)
    const projectModel = await createProjectModel({})
    const suiteModel = projectModel.suite ?? projectModel
    const deployed = suiteModel.features.db?.deployed
    if (deployed == null) {
      throw new Error(
        `The hanbok.config.ts file does not define features.db.deployed`
      )
    }
    const localPort = deployed.bastionPort

    // FIXME - abstract out how names and resources are found
    const suitePrefix = NU.toDashedName([suiteModel.name], (s) =>
      NU.toAlphanumDash(s, 65)
    )
    const secretName = await AU.readCloudFormationExport(
      `${suitePrefix}:db:credentials:admin:secret-name`
    )
    const secretValue = JSON.parse(await AU.getSecretValue(secretName))
    const {username, password} = secretValue

    console.log(JSON.stringify({username, password}, null, 2))

    await execInternalScript({
      script: "db-admin",
      args: [`${localPort}`, username, password],
    })
  }
}
