import {STSClient, GetCallerIdentityCommand} from "@aws-sdk/client-sts"
import {loadConfig} from "@aws-sdk/node-config-provider"
import * as cdk from "aws-cdk-lib"
import {createProjectModel} from "../../devenv/createProjectModel"
import * as FsUtils from "../FsUtils"
import {Toolkit, StackSelectionStrategy} from "@aws-cdk/toolkit-lib"
import * as core from "aws-cdk-lib/core"
import {toCdkStackName} from "../NameUtils"
import {z} from "zod"

export type CdkCommand = "deploy" | "destroy" | "synth"

export async function runCdkStack({
  stackClassName,
  stackRole,
  roleInstance,
  command,
  stackProps,
}: {
  stackClassName: string
  stackRole: string
  roleInstance?: string | null | undefined
  command: CdkCommand
  stackProps: any
}) {
  try {
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

    const stackModule = cdkLib[stackClassName]
    const stackPropsSchema: z.ZodTypeAny | undefined =
      stackModule["StackPropsSchema"]
    const stackClass = stackModule.Stack
    if (stackClass == null) {
      throw new Error(
        `The built cdk file at "${cdkPath}" does not export a "Stack" class for stack "${stackClassName}"`
      )
    }
    if (stackPropsSchema == null) {
      throw new Error(
        `The built cdk file at "${cdkPath}" does not export a "StackPropsSchema" for stack "${stackClassName}"`
      )
    }

    const parseResult = stackPropsSchema.safeParse(stackProps)
    if (!parseResult.success) {
      const error = parseResult.error.format()
      throw new Error(
        `StackProps did not match the expected format: ${JSON.stringify(error, null, 2)}`
      )
    }

    const cdkToolkit = new Toolkit({})

    const suiteName = projectModel.suite?.name
    const stackNameParts = [
      suiteName,
      projectModel.name,
      stackRole,
      roleInstance,
    ].filter((p) => p != null)
    const stackName = toCdkStackName(stackNameParts)

    const env = await getDefaultEnv()

    const fullStackProps = {
      ...stackProps,
      projectModel,
      stackNameParts,
      env,
    }
    const cx = await cdkToolkit.fromAssemblyBuilder(async () => {
      const app = new core.App()
      const stack = new stackClass(app, stackName, fullStackProps)
      return app.synth()
    })

    switch (command) {
      case "deploy":
        await cdkToolkit.deploy(cx, {
          stacks: {
            strategy: StackSelectionStrategy.PATTERN_MUST_MATCH,
            patterns: [stackName],
          },
        })
        break
      case "destroy":
        await cdkToolkit.destroy(cx, {
          stacks: {
            strategy: StackSelectionStrategy.PATTERN_MUST_MATCH,
            patterns: [stackName],
          },
        })
        break
      case "synth":
        await cdkToolkit.synth(cx, {
          stacks: {
            strategy: StackSelectionStrategy.PATTERN_MUST_MATCH,
            patterns: [stackName],
          },
        })
        break
      default:
        const unexpected: never = command
        throw new Error(`Command "${command}" not supported`)
        break
    }
  } catch (err) {
    console.error(`Error running CDK stack`, err)
    throw err
  }
}

// Reads in the default environment from the calling user's account
// info.  This is needed to do things like HostedZone lookups
export async function getDefaultEnv(): Promise<{
  account: string
  region: string
}> {
  const region =
    (await loadConfig({
      environmentVariableSelector: (env) => env["AWS_REGION"],
      configFileSelector: (profile) => profile["region"],
      default: () => undefined,
    })()) || "us-east-1"
  const sts = new STSClient({region})
  const identity = await sts.send(new GetCallerIdentityCommand({}))

  if (!identity.Account) {
    throw new Error("Unable to retrieve AWS account.")
  }

  return {
    account: identity.Account,
    region,
  }
}
