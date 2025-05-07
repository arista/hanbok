import {createProjectModel} from "../devenv/createProjectModel"
import * as FsUtils from "../utils/FsUtils"
import { Toolkit, StackSelectionStrategy } from '@aws-cdk/toolkit-lib';
import * as core from 'aws-cdk-lib/core';

export type CdkCommand = "deploy" | "destroy"

export async function runCdkStack({
  stackClassName,
  stackName,
  command,
}: {
  stackClassName: string
  stackName: string
  command: CdkCommand
}) {
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

  const stackClass = cdkLib[stackClassName].Stack
  if (stackClass == null) {
    throw new Error(
      `The built cdk file at "${cdkPath}" does not export stack "${stackClassName}"`
    )
  }

  const cdkToolkit = new Toolkit({
  })

  const cx = await cdkToolkit.fromAssemblyBuilder(async () => {
    const app = new core.App()
    const stack = new stackClass(app, stackName)
    return app.synth()
  })

  switch(command) {
    case "deploy":
      await cdkToolkit.deploy(cx, {
        stacks: {
          strategy: StackSelectionStrategy.PATTERN_MUST_MATCH,
          patterns: [stackName],
        }
      })
      break
    case "destroy":
      await cdkToolkit.destroy(cx, {
        stacks: {
          strategy: StackSelectionStrategy.PATTERN_MUST_MATCH,
          patterns: [stackName],
        }
      })
      break
    default:
      const unexpected:never = command
      throw new Error(`Command "${command}" not supported`)
      break
  }
}
