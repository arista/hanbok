import "source-map-support/register.js"
import * as OC from "@oclif/core"
import {createProjectModel} from "@lib/devenv/createProjectModel"
import * as PM from "@lib/devenv/ProjectModel"
import {execInternalScript} from "@lib/utils/ProcUtils"
import * as NU from "@lib/utils/NameUtils"

export class Command extends OC.Command {
  static override description = "Connect to the local dev mysql server"

  static override args = {}
  static override flags = {
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
    const projectModel = await createProjectModel({})
    const {service} = flags
    const suiteModel = projectModel.suite ?? projectModel
    const localDev = suiteModel.features.db?.localDev
    if (localDev == null) {
      throw new Error(
        `The hanbok.config.ts file does not define features.db.localDev`
      )
    }
    const serviceModel = PM.getService(projectModel, service)
    const database =
      serviceModel == null
        ? ""
        : NU.toDevServiceDatabaseName(
            projectModel.suite!.name,
            projectModel.name,
            serviceModel.name
          )
    const {hostname, port, username, password} = localDev
    await execInternalScript({
      script: "db-dev",
      args: [hostname, `${port}`, username, password, database],
    })
  }
}
