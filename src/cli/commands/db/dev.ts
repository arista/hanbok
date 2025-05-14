import "source-map-support/register.js"
import * as OC from "@oclif/core"
import {createProjectModel} from "@lib/devenv/createProjectModel"
import {execInternalScript} from "@lib/utils/ProcUtils"

export class Command extends OC.Command {
  static override description = "Connect to the local dev mysql server"

  static override args = {}
  static override flags = {}
  static override enableJsonFlag = true

  async run() {
    const {args, flags} = await this.parse(Command)
    const projectModel = await createProjectModel({})
    const suiteModel = projectModel.suite ?? projectModel
    const localDev = suiteModel.features.db?.localDev
    if (localDev == null) {
      throw new Error(`The hanbok.config.ts file does not define features.db.localDev`)
    }
    const {hostname, port, username, password} = localDev
    await execInternalScript({
      script: "db-dev",
      args: [hostname, `${port}`, username, password, ""],
    })
  }
}
