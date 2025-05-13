import {Construct, IConstruct} from "constructs"
import * as R from "./Resources"
import * as ssm from "aws-cdk-lib/aws-ssm"
import * as s3 from "aws-cdk-lib/aws-s3"
import * as cdk from "aws-cdk-lib"
import * as route53 from "aws-cdk-lib/aws-route53"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import * as NU from "../utils/NameUtils"

export type SuiteResourcesBaseProps = R.ResourcesProps & {}

export class SuiteResourcesBase<
  C extends SuiteResourcesBaseProps,
> extends R.Resources<C> {
  constructor(scope: IConstruct, id: string, props: C) {
    super(scope, id, props)
  }

  // Returns a value exported by the suite infrastructure CDK stack.
  // The given name will be appended to the infrastructure base name
  getInfrastructureExport(name: string): string {
    return cdk.Fn.importValue(`${this.cdkExportsPrefix}:${name}`)
  }

  // The bucket holding the codepipeline artifacts
  cpArtifactsBucket = new R.S3BucketResource(this, "buckets:cp-artifacts:name")

  // The bucket holding private app S3 data
  privateBucket = new R.S3BucketResource(this, "buckets:private:name")

  // The bucket holding public app S3 data, including webapp assets
  publicBucket = new R.S3BucketResource(this, "buckets:public:name")

  // The VPC
  vpc = new R.VpcResource(this, "vpc")

  // The certificates
  certificates = new R.CertificateResources(this, "certificates")

  // // Returns the token corresponding to the codeconnection arn used to
  // // interact with github
  // get codestarConnectionArn() {
  //   return this.ssmStringParams.get(
  //     "/taterapps/common/build/codestar-connection-arn"
  //   )
  // }

  // // Returns the token corresponding to the dockerhub login used to
  // // pull base images when building docker images.  Using a login
  // // helps with the dockerhub rate limits.
  // get dockerhubAccountId() {
  //   return this.ssmStringParams.get(
  //     "/taterapps/common/build/dockerhub-account/id"
  //   )
  // }

  // // Returns the token corresponding to the dockerhub password for the
  // // dockerhubAccountId
  // get dockerhubAccountPassword() {
  //   return this.ssmSecureStringParams.get(
  //     "/taterapps/common/build/dockerhub-account/password"
  //   )
  // }

  // get abramsonsInfoDomain() {
  //   return "abramsons.info"
  // }

  // get abramsonsInfoHostedZone() {
  //   return this.hostedZones.get(this.abramsonsInfoDomain)
  // }

  // get dbEndpointAddress() {
  //   return this.getInfrastructureExport("db:endpoint:address")
  // }

  // get dbEndpointPort() {
  //   return cdk.Token.asNumber(this.getInfrastructureExport("db:endpoint:port"))
  // }

  // get dbAdminCredentialsSecretName() {
  //   return this.getInfrastructureExport("db:credentials:admin:secret-name")
  // }

  // get dbSecurityGroupId() {
  //   return this.getInfrastructureExport("db:security-group-id")
  // }

  // _dbSecurityGroup: ec2.ISecurityGroup | null = null
  // get dbSecurityGroup(): ec2.ISecurityGroup {
  //   return (this._dbSecurityGroup ||= (() => {
  //     return ec2.SecurityGroup.fromSecurityGroupId(
  //       this.scope,
  //       "dbSecurityGroup",
  //       this.dbSecurityGroupId
  //     )
  //   })())
  // }
}
