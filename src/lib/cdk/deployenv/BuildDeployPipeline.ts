import {Construct, IConstruct} from "constructs"
import * as PM from "../../devenv/ProjectModel"

export type BuildDeployPipelineProps = {
  projectModel: PM.ProjectModel
}

export class BuildDeployPipeline extends Construct {
  constructor(scope: IConstruct, id: string, props: BuildDeployPipelineProps) {
    super(scope, id)
  }
}
