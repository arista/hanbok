import {Construct, IConstruct} from "constructs"
import {SuiteResourcesBase} from "../SuiteResourcesBase"
import {Permissions} from "../Permissions"
import * as PM from "../../devenv/ProjectModel"
import * as NU from "../../utils/NameUtils"
import * as AU from "@lib/utils/AwsUtils"
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
  backend: string
  projectModel: PM.ProjectModel
  stackNameParts: Array<string>
  webapp: PM.WebappModel
}

export class WebappLambda extends Construct {
  functionName: string

  constructor(scope: IConstruct, id: string, props: WebappLambdaProps) {
    super(scope, id)
    const {deployenv, backend, projectModel, stackNameParts, webapp} = props
    const suiteName = projectModel.suite!.name
    const appName = projectModel.name
    const {hostingInfo} = webapp

    const resources = new SuiteResourcesBase(this, "resources", {
      projectModel,
    })
    const publicBucket = resources.publicBucket
    const permissions = new Permissions()

    const privateBucket = resources.privateBucket.bucket
    const functionName = NU.toLambdaName(
      projectModel.suite!.name,
      projectModel.name,
      deployenv,
      webapp.name
    )
    this.functionName = functionName
    const lambdaSourceLocation = `webapp-builds/by-app/${projectModel.name}/by-deployenv/${deployenv}/by-webapp/${webapp.name}/server/webapp-lambda.zip`
    const routesEndpoint = (() => {
      if (hostingInfo != null) {
        const {hostname, hostedZone} = hostingInfo
        return `https://${hostname}.${hostedZone}/`
      } else {
        return ""
      }
    })()
    const environment: Record<string, string> = {
      ROUTES_ENDPOINT: routesEndpoint,
      ASSETS_BASE: NU.toWebappAssetsBase(
        this,
        publicBucket.bucket,
        appName,
        webapp.name,
        deployenv
      ),
    }

    // Add the DATABASE_URL_{service} entries
    // FIXME - putting the database secrets in environment variables
    // is less secure than having the lambda access them at runtime
    // and construct the database url itself.  It also makes it harder
    // to change the secrets.  If we do change to constructing the
    // database url at runtime, be sure to give the lambda access to
    // the secret (dbSecret.grantRead(myLambda))

    // FIXME - abstract this out
    const services = projectModel.features?.services
    if (services != null) {
      const appDatabasesPrefix = NU.toAppDatabasesPrefix(suiteName, appName)
      const prefix = NU.toDashedName([suiteName, appName], (s) =>
        NU.toAlphanumDash(s, 65)
      )
      const secretExportName = `${prefix}:db:credentials:secret-name`
      const secretName = cdk.Fn.importValue(secretExportName)
      const dbSecret = sm.Secret.fromSecretNameV2(
        this,
        "AppDbSecret",
        secretName
      )
      for (const serviceModel of Object.values(services)) {
        const serviceName = serviceModel.name
        const databaseName = NU.toBackendServiceDatabaseName(
          suiteName,
          appName,
          backend,
          serviceName
        )
        const envVar = `DATABASE_URL_${serviceName}`

        // FIXME - abstract out how names and resources are found
        const rdsEndpoint = resources.database.endpointAddressExportedValue
        const rdsPort = resources.database.endpointPortExportedValue

        environment[envVar] = cdk.Fn.join("", [
          "mysql://",
          dbSecret.secretValueFromJson("username").toString(),
          ":",
          dbSecret.secretValueFromJson("password").toString(),
          "@",
          rdsEndpoint,
          ":",
          rdsPort,
          "/",
          databaseName,
        ])
      }
    }

    const webappLambda = new lambda.Function(this, "lambda", {
      functionName,
      runtime: lambda.Runtime.NODEJS_22_X,
      // "handler" export of webapp-lambda.es.js
      handler: "webapp-lambda.handler",
      code: lambda.Code.fromBucket(privateBucket, lambdaSourceLocation),
      environment,
      vpc: resources.vpc.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    })

    // Give the lambda access to the database
    webappLambda.connections.allowTo(
      resources.database.securityGroup,
      ec2.Port.tcp(resources.database.endpointPortExportedNumberValue)
    )

    if (hostingInfo != null) {
      const {hostname, hostedZone, certificateName} = hostingInfo

      // Create the API Gateway service
      const webappApi = new apigateway.RestApi(this, "WebappApi", {
        restApiName: NU.toWebappApiName(
          suiteName,
          appName,
          webapp.name,
          deployenv
        ),
      })

      // Map everything in the api to the lambda
      const proxyResource = webappApi.root.addResource("{proxy+}")
      proxyResource.addMethod(
        "ANY",
        new apigateway.LambdaIntegration(webappLambda),
        {
          requestParameters: {
            "method.request.path.proxy": true,
          },
        }
      )
      // A separate entry has to be added specifically to handle "/"
      webappApi.root.addMethod(
        "ANY",
        new apigateway.LambdaIntegration(webappLambda),
        {
          requestParameters: {
            "method.request.path.proxy": true,
          },
        }
      )

      // Custom domain for API
      const certificate =
        resources.certificates.get(certificateName).certificate
      const apiDomainName = new apigateway.DomainName(this, "ApiDomain", {
        domainName: `${hostname}.${hostedZone}`,
        certificate,
        // required for custom domains
        endpointType: apigateway.EndpointType.EDGE,
      })

      // Base path mapping
      new apigateway.BasePathMapping(this, "BasePathMapping", {
        domainName: apiDomainName,
        restApi: webappApi,
        stage: webappApi.deploymentStage,
      })

      // Route 53 alias record pointing to API Gateway
      const hz = resources.hostedZones.get(hostedZone)
      new route53.ARecord(this, "ApiAliasRecord", {
        zone: hz,
        recordName: hostname,
        target: route53.RecordTarget.fromAlias(
          new targets.ApiGatewayDomain(apiDomainName)
        ),
      })
    }
  }
}
