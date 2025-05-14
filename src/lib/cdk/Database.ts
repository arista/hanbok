import {Construct} from "constructs"
import * as cdk from "aws-cdk-lib"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import * as rds from "aws-cdk-lib/aws-rds"
import * as iam from "aws-cdk-lib/aws-iam"
import * as Resources from "./Resources"
import * as NU from "../utils/NameUtils"

export type Props = {
  suiteName: string
  vpc: ec2.IVpc
  resource: Resources.DatabaseResource
}

export class Database extends Construct {
  instance: rds.IDatabaseInstance

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id)

    const {suiteName, resource, vpc} = props

    // FIXME - make configurable?
    const rdsAdminUsername = "admin"
    const rdsCredentials = rds.Credentials.fromGeneratedSecret(
      rdsAdminUsername,
      {
        secretName: NU.toDbCredentialsSecretName(suiteName),
      }
    )

    // RDS instance
    const dbInstance = new rds.DatabaseInstance(this, "db", {
      instanceIdentifier: NU.toDatabaseName(suiteName),
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      vpcSubnets: {subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS},
      multiAz: false,
      allocatedStorage: 20, // GB // FIXME - make configurable
      maxAllocatedStorage: 100, // GB - FIXME - make configurable
      credentials: rdsCredentials,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
    })
    new cdk.CfnOutput(this, `export-endpoint-address`, {
      value: dbInstance.dbInstanceEndpointAddress,
      exportName: resource.endpointAddressExportName,
    })
    new cdk.CfnOutput(this, `export-endpoint-port`, {
      value: dbInstance.dbInstanceEndpointPort,
      exportName: resource.endpointPortExportName,
    })
    new cdk.CfnOutput(this, `export-admin-credentials-secret-name`, {
      value: dbInstance.secret!.secretName,
      exportName: resource.adminCredsSecretNameExportName,
    })
    new cdk.CfnOutput(this, `export-sg`, {
      value: dbInstance.connections.securityGroups[0]!.securityGroupId,
      exportName: resource.securityGroupIdExportName,
    })

    this.instance = dbInstance
  }
}
