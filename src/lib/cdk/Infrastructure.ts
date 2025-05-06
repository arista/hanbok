import {createProjectModel} from "../devenv/createProjectModel"
import * as FsUtils from "../utils/FsUtils"
import { Toolkit, StackSelectionStrategy } from '@aws-cdk/toolkit-lib';
import * as core from 'aws-cdk-lib/core';

export class Infrastructure {
  constructor(public props: {}) {}

  async run() {
    const projectModel = await createProjectModel({})
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
    const cdkStackName = "Infrastructure"
    const stackClass = cdkLib[cdkStackName].Stack
    if (stackClass == null) {
      throw new Error(
        `The built cdk file at "${cdkPath}" does not export stack "${Infrastructure}"`
      )
    }

    const stackName = "hb-test-app-Infrastructure"
    const cdkToolkit = new Toolkit({
      // ioHost: {
      //   notify: async function (msg) {
      //     console.log(msg);
      //   },
      //   requestResponse: async function (msg) {
      //     console.log(msg);
      //     return msg.defaultResponse;
      //   }
      // }
    })
    const cx = await cdkToolkit.fromAssemblyBuilder(async() => {
      const app = new core.App()
      console.log(`creating new stackClass`, stackClass)
      const stack = new stackClass(app, stackName)
      console.log(`stack`, stack)
      return app.synth()
    })

    await cdkToolkit.deploy(cx, {
      stacks: {
        strategy: StackSelectionStrategy.PATTERN_MUST_MATCH,
        patterns: [stackName],
      }
    })
  }
}
