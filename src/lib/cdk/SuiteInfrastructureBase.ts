import {Construct, IConstruct} from "constructs"
import {SuiteResourcesBase} from "./SuiteResourcesBase"
import {S3Bucket} from "./S3Bucket"
import {Vpc} from "./Vpc"
import * as PM from "../devenv/ProjectModel"
import * as NU from "../utils/NameUtils"
import * as acm from "aws-cdk-lib/aws-certificatemanager"
import * as cdk from "aws-cdk-lib"

export type SuiteInfrastructureBaseProps = {
  projectModel: PM.ProjectModel
  stackNameParts: Array<string>
}

export class SuiteInfrastructureBase<
  C extends SuiteInfrastructureBaseProps,
> extends Construct {
  vpc: Vpc
  cpArtifactsBucket: S3Bucket
  privateBucket: S3Bucket
  publicBucket: S3Bucket

  constructor(
    scope: IConstruct,
    id: string,
    public props: C
  ) {
    super(scope, id)
    const {projectModel, stackNameParts} = props
    const suiteName = projectModel.name
    const resources = new SuiteResourcesBase(this, "resources", {
      projectModel,
    })

    //----------------------------------------
    // Create the vpc
    this.vpc = new Vpc(this, "vpc", {
      name: NU.toS3BucketName([suiteName, "vpc"]),
      resource: resources.vpc,
    })

    //----------------------------------------
    // Create the buckets

    // For holding codepipeline artifacts
    this.cpArtifactsBucket = new S3Bucket(this, "cp-artifacts-bucket", {
      name: NU.toS3BucketName([suiteName, "cp-artifacts"]),
      isPublic: false,
      removePolicy: "empty-and-delete",
      resource: resources.cpArtifactsBucket,
    })

    // For private data storage by all of the suite's apps
    this.privateBucket = new S3Bucket(this, "private", {
      name: NU.toS3BucketName([suiteName, "private"]),
      isPublic: false,
      removePolicy: "delete-if-empty",
      resource: resources.privateBucket,
    })

    // For public files exposed by all of the suite's apps, such as
    // webapp assets
    this.publicBucket = new S3Bucket(this, "public", {
      name: NU.toS3BucketName([suiteName, "public"]),
      isPublic: true,
      isHostable: true,
      removePolicy: "delete-if-empty",
      cors: "allow-all-origins",
      resource: resources.publicBucket,
    })

    //----------------------------------------
    // Create the certificates
    const {certificates} = projectModel
    if (certificates != null) {
      for (const [certName, certDef] of Object.entries(certificates)) {
        const {hostedZone, domainName} = certDef
        const hz = resources.hostedZones.get(hostedZone)

        const certificate = new acm.Certificate(this, "ApiCert", {
          domainName,
          validation: acm.CertificateValidation.fromDns(hz),
        })

        const resource = resources.certificates.get(certName)
        new cdk.CfnOutput(this, `certificate-${certName}-arn`, {
          value: certificate.certificateArn,
          exportName: resource.arnExportName,
        })
      }
    }
  }
}
