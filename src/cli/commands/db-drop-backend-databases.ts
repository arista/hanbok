import "source-map-support/register.js"
import * as OC from "@oclif/core"
import {createProjectModel} from "@lib/devenv/createProjectModel"
import {execInternalScript} from "@lib/utils/ProcUtils"
import * as NU from "@lib/utils/NameUtils"
import * as AU from "@lib/utils/AwsUtils"

export class Command extends OC.Command {
  static override description = "Creates the databases for each of the services for a backend"

  static override args = {}
  static override flags = {
    backend: OC.Flags.string({
      char: "e",
      description: `The backend`,
      required: true,
    }),
  }
  static override enableJsonFlag = true

  async run() {
    const {args, flags} = await this.parse(Command)
    const {backend} = flags
    const projectModel = await createProjectModel({})
    if (projectModel.suite == null) {
      throw new Error(
        `This command must be run in an app directory, not a suite`
      )
    }
    const suiteName = projectModel.suite!.name
    const appName = projectModel.name

    // FIXME - allow dropping just one service?
    for(const [serviceName, service] of Object.entries(projectModel.features.services ?? {})) {
      const databaseName = NU.toBackendServiceDatabaseName(suiteName, appName, backend, serviceName)
      await execInternalScript({
        script: "db-drop-backend-database",
        args: [databaseName],
      })
    }
  }
}
