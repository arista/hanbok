// Creates a "bastion host" - that is, a host inside the VPC that a
// developer can access from their local machine, and from there
// "jump" to access other resources in the VPC, such as the RDS
// database.
//
// Access to the bastion host uses AWS SessionManager rather than SSH,
// since that allows access just using AWS credentials

import {Construct} from "constructs"
import * as cdk from "aws-cdk-lib"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import * as rds from "aws-cdk-lib/aws-rds"
import * as iam from "aws-cdk-lib/aws-iam"
import * as Resources from "./Resources"
import * as NU from "../utils/NameUtils"

export type Props = {
  vpc: ec2.IVpc
  db: rds.IDatabaseInstance
  suiteName: string
  resource: Resources.BastionHostResource
}

export class BastionHost extends Construct {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id)

    const {vpc, db, suiteName, resource} = props

    const ssmRole = new iam.Role(this, "SSMRole", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AmazonSSMManagedInstanceCore"
        ),
      ],
    })
    const bastionHostSg = new ec2.SecurityGroup(this, "BastionHostSg", {
      securityGroupName: `${NU.toAlphanumDash(suiteName, 64)}-bastionHost`,
      vpc,
      description: "Allow EC2 bastion host to connect to RDS",
      allowAllOutbound: true,
    })
    const bastionHostInstance = new ec2.Instance(
      this,
      "BastionHostSSMInstance",
      {
        instanceName: `${NU.toAlphanumDash(suiteName, 64)}-bastionHost`,
        vpc,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        vpcSubnets: {subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS},
        role: ssmRole,
        securityGroup: bastionHostSg,
      }
    )
    new cdk.CfnOutput(this, `export-instanceId`, {
      value: bastionHostInstance.instanceId,
      exportName: resource.instanceIdExportName,
    })
    // Give the bastion host access to the database
    db.connections.allowFrom(bastionHostSg, ec2.Port.tcp(3306))
  }
}
