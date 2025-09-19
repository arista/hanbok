import "source-map-support/register.js"
import * as OC from "@oclif/core"
import {createProjectModel} from "@lib/devenv/createProjectModel"
import * as PM from "@lib/devenv/ProjectModel"
import {execInternalScript} from "@lib/utils/ProcUtils"
import * as NU from "@lib/utils/NameUtils"
import * as AU from "@lib/utils/AwsUtils"

export class Command extends OC.Command {
  static override description = "Connect to the local dev mysql server"

  static override args = {}
  static override flags = {
    backend: OC.Flags.string({
      char: "e",
      description: `The backend`,
      required: true,
    }),
    service: OC.Flags.string({
      char: "s",
      description: `The service whose database should be selected`,
      required: false,
      default: "",
    }),
  }
  static override enableJsonFlag = true

  async run() {
    const {args, flags} = await this.parse(Command)
    const {backend, service} = flags
    const projectModel = await createProjectModel({})
    if (projectModel.suite == null) {
      throw new Error(
        `This command must be run in an app directory, not a suite`
      )
    }
    const suiteName = projectModel.suite.name
    const appName = projectModel.name
    const deployed = projectModel.suite.features.db?.deployed
    if (deployed == null) {
      throw new Error(
        `The hanbok.config.ts file does not define features.db.deployed`
      )
    }
    const localPort = deployed.bastionPort
    const serviceModel = PM.getService(projectModel, service)
    const database =
      serviceModel == null
        ? ""
        : NU.toBackendServiceDatabaseName(
            projectModel.suite!.name,
            projectModel.name,
            backend,
            serviceModel.name
          )

    // FIXME - abstract this out
    const appDatabasesPrefix = NU.toAppDatabasesPrefix(suiteName, appName)
    const prefix = NU.toDashedName([suiteName, appName], (s) =>
      NU.toAlphanumDash(s, 65)
    )
    const secretExportName = `${prefix}:db:credentials:secret-name`
    const secretName = await AU.readCloudFormationExport(secretExportName)
    const secretValue = JSON.parse(await AU.getSecretValue(secretName))
    const {username, password} = secretValue

    await execInternalScript({
      script: "db-backend",
      args: [`${localPort}`, username, password, database],
    })
  }
}
