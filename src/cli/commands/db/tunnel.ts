import "source-map-support/register.js"
import * as OC from "@oclif/core"
import {createProjectModel} from "@lib/devenv/createProjectModel"
import {execInternalScript} from "@lib/utils/ProcUtils"
import {SuiteResourcesBase} from "@lib/cdk/SuiteResourcesBase"
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
    const bastionId = await AU.readCloudFormationExport(
      `${suitePrefix}:bastionHost:instanceId`
    )
    const rdsEndpoint = await AU.readCloudFormationExport(
      `${suitePrefix}:db:endpoint:address`
    )
    const rdsPort = await AU.readCloudFormationExport(
      `${suitePrefix}:db:endpoint:port`
    )

    await execInternalScript({
      script: "db-tunnel",
      args: [bastionId, rdsEndpoint, rdsPort, `${localPort}`],
    })
  }
}
