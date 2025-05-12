import {Construct, IConstruct} from "constructs"
import {SuiteResourcesBase} from "../SuiteResourcesBase"
import {Permissions} from "../Permissions"
import * as cdk from "aws-cdk-lib"
import * as PM from "../../devenv/ProjectModel"
import * as NU from "../../utils/NameUtils"
import * as cp from "aws-cdk-lib/aws-codepipeline"
import * as cp_actions from "aws-cdk-lib/aws-codepipeline-actions"
import * as cb from "aws-cdk-lib/aws-codebuild"

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

    const appName = projectModel.name
    const suiteName = projectModel.suite?.name
    const resources = new SuiteResourcesBase(this, "resources", {
      projectModel,
    })
    const permissions = new Permissions()
    const pipelineName = NU.toCodePipelineName(stackNameParts)
    const codebuildProjectName = NU.toCodebuildProjectName(stackNameParts)

    const publicBucket = resources.publicBucket.bucket
    const privateBucket = resources.privateBucket.bucket

    // Create the codepipeline
    const codebuildProject = new cb.PipelineProject(
      this,
      "build-codepipeline",
      {
        projectName: codebuildProjectName,
        environment: {
          buildImage: cb.LinuxBuildImage.STANDARD_7_0,
          computeType: cb.ComputeType.LARGE,
        },
        timeout: cdk.Duration.minutes(120),
        buildSpec: cb.BuildSpec.fromObject({
          version: "0.2",
          phases: {
            install: {
              "runtime-versions": {
                nodejs: 20,
              },
            },
            build: {
              commands: [
                "$CODEBUILD_SRC_DIR_Hanbok/bin/aws/deployenv-codepipeline-build",
              ],
            },
          },
        }),
      }
    )
    permissions.addToRole(codebuildProject.role!, [
      // FIXME - see if this is necessary, and if so, make it configurable
      ...permissions.toReadSSMParameters("/taterapps/common/*"),
      //      ...cdkUtils.permissions.toWriteS3BucketObjects(privateBucket),
      //      ...cdkUtils.permissions.toWriteS3BucketObjects(publicBucket),
      //
      //      // To deploy the lambda code
      //      ...cdkUtils.permissions.toReadS3Bucket(privateBucket),
      //      ...lambdaFunctionNames
      //        .map((n) => cdkUtils.permissions.toUpdateLambdaCode(n))
      //        .flat(),
    ])

    const sourceActions: Array<cp.IAction> = []
    const extraInputs: Array<cp.Artifact> = []
    const actionsEnvVars: {[name: string]: cb.BuildEnvironmentVariable} = {}

    // Add the hanbok source
    {
      const source = projectModel.hanbokSource
      if (source != null) {
        const hanbokOutput = new cp.Artifact("Hanbok")
        const {codestarConnectionArnParamName, owner, repo} = source
        sourceActions.push(
          new cp_actions.CodeStarConnectionsSourceAction({
            actionName: "Source_Hanbok",
            connectionArn: resources.ssmStringParams.get(
              codestarConnectionArnParamName
            ),
            owner,
            repo,
            branch: "main",
            output: hanbokOutput,
            variablesNamespace: "SourceVars_Hanbok",
          })
        )
        extraInputs.push(hanbokOutput)
        Object.assign(actionsEnvVars, {
          GITHUB_OWNER_Hanbok: {value: owner},
          GITHUB_REPO_Hanbok: {value: repo},
          GITHUB_COMMIT_ID_Hanbok: {value: "#{SourceVars_Hanbok.CommitId}"},
          GITHUB_BRANCH_Hanbok: {value: "#{SourceVars_Hanbok.BranchName}"},
        })
      }
    }
    {
      const source = projectModel.suite?.source
      if (source != null) {
        const suiteOutput = new cp.Artifact("Suite")
        const {codestarConnectionArnParamName, owner, repo} = source
        sourceActions.push(
          new cp_actions.CodeStarConnectionsSourceAction({
            actionName: "Source_Suite",
            connectionArn: resources.ssmStringParams.get(
              codestarConnectionArnParamName
            ),
            owner,
            repo,
            branch: "main",
            output: suiteOutput,
            variablesNamespace: "SourceVars_Suite",
          })
        )
        extraInputs.push(suiteOutput)
        Object.assign(actionsEnvVars, {
          GITHUB_OWNER_Suite: {value: owner},
          GITHUB_REPO_Suite: {value: repo},
          GITHUB_COMMIT_ID_Suite: {value: "#{SourceVars_Suite.CommitId}"},
          GITHUB_BRANCH_Suite: {value: "#{SourceVars_Suite.BranchName}"},
        })
      }
    }
    const appOutput = new cp.Artifact("App")
    {
      const source = projectModel.source
      if (source != null) {
        const {codestarConnectionArnParamName, owner, repo} = source
        sourceActions.push(
          new cp_actions.CodeStarConnectionsSourceAction({
            actionName: "Source_App",
            connectionArn: resources.ssmStringParams.get(
              codestarConnectionArnParamName
            ),
            owner,
            repo,
            branch,
            output: appOutput,
            variablesNamespace: "SourceVars_App",
          })
        )
        Object.assign(actionsEnvVars, {
          GITHUB_OWNER_App: {value: owner},
          GITHUB_REPO_App: {value: repo},
          GITHUB_COMMIT_ID_App: {value: "#{SourceVars_App.CommitId}"},
          GITHUB_BRANCH_App: {value: "#{SourceVars_App.BranchName}"},
        })
      }
    }

    const pipeline = new cp.Pipeline(this, "build-pipeline", {
      pipelineName: pipelineName,
      artifactBucket: resources.cpArtifactsBucket.bucket,
      pipelineType: cp.PipelineType.V2,
      stages: [
        {
          stageName: "Source",
          actions: sourceActions,
        },
        {
          stageName: "Build",
          actions: [
            new cp_actions.CodeBuildAction({
              actionName: "Build",
              input: appOutput,
              extraInputs,
              project: codebuildProject,
              variablesNamespace: "BuildVars",
              environmentVariables: {
                SUITE_NAME: {value: suiteName},
                APP_NAME: {value: appName},
                // Note that codebuild automatically makes
                // CODEBUILD_BUILD_ID available
                PIPELINE_EXECUTION_ID: {
                  value: "#{codepipeline.PipelineExecutionId}",
                },
                DEPLOYENV: {value: deployenv},
                PUBLIC_BUCKET_NAME: {value: publicBucket.bucketName},
                PRIVATE_BUCKET_NAME: {value: privateBucket.bucketName},
                DEPLOYENV_PUBLISHED_ASSETS_S3_BASE: {
                  value: cdk.Fn.join("", [
                    "s3://",
                    publicBucket.bucketName,
                    `/webapp-assets/by-app/${appName}/by-deployenv/${deployenv}`,
                  ]),
                },
                DEPLOYENV_PUBLISHED_ASSETS_BASE: {
                  value: cdk.Fn.join("", [
                    // Unfortunately we have to constrct the https url
                    // manually, since bucketWebsiteUrl returns an
                    // http url
                    //publicBucket.bucketWebsiteUrl,
                    "https://",
                    publicBucket.bucketName,
                    ".s3.",
                    cdk.Stack.of(this).region,
                    ".amazonaws.com",
                    `/webapp-assets/by-app/${appName}/by-deployenv/${deployenv}`,
                  ]),
                },
                ...actionsEnvVars,
              },
            }),
          ],
        },
      ],
    })
  }
}
