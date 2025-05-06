import {createProjectModel} from "../devenv/createProjectModel"
import * as FsUtils from "../utils/FsUtils"
import {CloudAssemblyBuilder} from "aws-cdk-lib/cx-api"
import {Deployments} from "@aws-cdk/cloudformation-deployments"

export class Infrastructure {
  constructor(public props: {}) {}

  async run() {
    const projectModel = await createProjectModel({})
    console.log(JSON.stringify(projectModel, null, 2))
    const cdk = projectModel.features.cdk
    if (cdk == null) {
      throw new Error(
        `Project does not have the cdk feature enabled in hanbok.config.ts`
      )
    }
    const cdkPath = cdk.builtPath
    if (!FsUtils.isFile(cdkPath)) {
      throw new Error(
        `Project has not built a cdk output at the expected location "${cdkPath}"`
      )
    }
    const cdkLib = await import(cdkPath)
    const stackClass = cdkLib["Infrastructure"]
    if (stackClass == null) {
      throw new Error(
        `The built cdk file at "${cdkPath}" does not export an "Infrastructure" stack`
      )
    }
  }
}
