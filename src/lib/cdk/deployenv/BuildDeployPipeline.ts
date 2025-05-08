import {Construct, IConstruct} from "constructs"
import * as PM from "../../devenv/ProjectModel"
import * as NU from "../../utils/NameUtils"
import * as cp from "aws-cdk-lib/aws-codepipeline"

export type BuildDeployPipelineProps = {
  branch: string
  deployenv: string
  projectModel: PM.ProjectModel
  stackNameParts: Array<string>
}

export class BuildDeployPipeline extends Construct {
  constructor(scope: IConstruct, id: string, props: BuildDeployPipelineProps) {
    super(scope, id)
    const {projectModel, branch, deployenv, stackNameParts} = props

    const suiteName = projectModel.suite?.name
    const appName = projectModel.name
    const pipelineName = NU.toCodePipelineName(stackNameParts)
  }
}
