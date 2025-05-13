import {Construct, IConstruct} from "constructs"
import {SuiteResourcesBase} from "../SuiteResourcesBase"
import {Permissions} from "../Permissions"
import * as PM from "../../devenv/ProjectModel"
import * as NU from "../../utils/NameUtils"
import * as cdk from "aws-cdk-lib"
import * as cp from "aws-cdk-lib/aws-codepipeline"
import * as cp_actions from "aws-cdk-lib/aws-codepipeline-actions"
import * as cb from "aws-cdk-lib/aws-codebuild"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as apigateway from "aws-cdk-lib/aws-apigateway"
import * as route53 from "aws-cdk-lib/aws-route53"
import * as targets from "aws-cdk-lib/aws-route53-targets"
import * as acm from "aws-cdk-lib/aws-certificatemanager"
import * as sm from "aws-cdk-lib/aws-secretsmanager"
import * as ec2 from "aws-cdk-lib/aws-ec2"

export type WebappLambdaProps = {
  deployenv: string
  projectModel: PM.ProjectModel
  stackNameParts: Array<string>
  webapp: PM.WebappModel
}

export class WebappLambda extends Construct {
  constructor(scope: IConstruct, id: string, props: WebappLambdaProps) {
    super(scope, id)
    const {deployenv, projectModel, stackNameParts, webapp} = props

    const resources = new SuiteResourcesBase(this, "resources", {
      projectModel,
    })
    const permissions = new Permissions()

    const privateBucket = resources.privateBucket.bucket
    const lambdaName = NU.toLambdaName([
      ...stackNameParts,
      "webapp",
      webapp.name,
      deployenv,
    ])
    const lambdaSourceLocation = `webapp-builds/by-app/${projectModel.name}/by-deployenv/${deployenv}/by-webapp/${webapp.name}/server/webapp-lambda.zip`
    const webappLambda = new lambda.Function(this, "lambda", {
      functionName: lambdaName,
      runtime: lambda.Runtime.NODEJS_22_X,
      // "handler" export of webapp-lambda.es.js
      handler: "webapp-lambda.handler",
      code: lambda.Code.fromBucket(privateBucket, lambdaSourceLocation),
      //      environment: databaseUrls,
      vpc: resources.vpc.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    })
  }
}
