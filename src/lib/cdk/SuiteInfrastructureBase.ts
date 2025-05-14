import {Construct, IConstruct} from "constructs"
import {SuiteResourcesBase} from "./SuiteResourcesBase"
import {S3Bucket} from "./S3Bucket"
import {Vpc} from "./Vpc"
import {Database} from "./Database"
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
  db: Database | null = null

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

        const certificate = new acm.Certificate(
          this,
          `certificate-${certName}`,
          {
            certificateName: NU.toCertificateName([
              ...stackNameParts,
              certName,
            ]),
            domainName,
            validation: acm.CertificateValidation.fromDns(hz),
          }
        )

        const resource = resources.certificates.get(certName)
        new cdk.CfnOutput(this, `certificate-${certName}-arn`, {
          value: certificate.certificateArn,
          exportName: resource.arnExportName,
        })
      }
    }

    //----------------------------------------
    // Create the databaase
    const {db} = projectModel.features
    if (db != null) {
      this.db = new Database(this, "database", {
        suiteName,
        vpc: this.vpc.vpc,
        resource: resources.database,
      })
    }

    // //----------------------------------------

    // // Create a "bastion host" - that is, a host inside the VPC that
    // // allows access to resources within the VPC.  This allows, for
    // // example, running scripts against the RDS database.  Use AWS
    // // SessionManager to provide access to the host, this provides
    // // access through AWS credentials rather than SSH

    // const ssmRole = new iam.Role(this, "SSMRole", {
    //   assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
    //   managedPolicies: [
    //     iam.ManagedPolicy.fromAwsManagedPolicyName(
    //       "AmazonSSMManagedInstanceCore"
    //     ),
    //   ],
    // })
    // const bastionHostSg = new ec2.SecurityGroup(this, "BastionHostSg", {
    //   securityGroupName: "taterapp-infrastructure-bastion-host",
    //   vpc,
    //   description: "Allow EC2 bastion host to connect to RDS",
    //   allowAllOutbound: true,
    // })
    // const bastionHostInstance = new ec2.Instance(
    //   this,
    //   "BastionHostSSMInstance",
    //   {
    //     instanceName: "taterapp-infrastructure-bastion-host",
    //     vpc,
    //     instanceType: ec2.InstanceType.of(
    //       ec2.InstanceClass.T3,
    //       ec2.InstanceSize.MICRO
    //     ),
    //     machineImage: ec2.MachineImage.latestAmazonLinux2023(),
    //     vpcSubnets: {subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS},
    //     role: ssmRole,
    //     securityGroup: bastionHostSg,
    //   }
    // )
    // new cdk.CfnOutput(this, `export-bastion-host-instanceId`, {
    //   value: bastionHostInstance.instanceId,
    //   exportName: `taterapp-infrastructure:bastion-host:instanceId`,
    // })
    // // Give the bastion host access to the database
    // dbInstance.connections.allowFrom(bastionHostSg, ec2.Port.tcp(3306))
  }
}
