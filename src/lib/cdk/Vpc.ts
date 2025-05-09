import {Construct} from "constructs"
import * as cdk from "aws-cdk-lib"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import * as Resources from "./Resources"

export type Props = {
  name: string
  resource: Resources.VpcResource
}

export class Vpc extends Construct {
  vpc: ec2.IVpc

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id)

    const {name, resource} = props

    const vpc = new ec2.Vpc(this, "vpc", {
      vpcName: name,
      maxAzs: 2,

      // Note that this is ~$30/month, but is needed if things in
      // "private-subnet" are to access the internet
      natGateways: 1,

      subnetConfiguration: [
        // Only for things that must receive inbound internet traffic:
        // load balances, NAT gateways, bastion hosts (e.g., SSH jump
        // boxes)
        {
          name: "public-subnet",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        // Things that shouldn't be accessible from the internet, but
        // might still need outbound access to the internet - most app
        // services (lambdas, ec2 instances, etc.) go in here
        {
          name: "private-subnet",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        // Things that shouldn't connect to the internet at all - RDS
        // could go in here
        {
          name: "isolated",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    })
    new cdk.CfnOutput(this, `export-vpc-id`, {
      value: vpc.vpcId,
      exportName: resource.vpcIdExportName,
    })
    new cdk.CfnOutput(this, `export-vpc-azs`, {
      value: vpc.availabilityZones.join(","),
      exportName: resource.azsExportName,
    })
    new cdk.CfnOutput(this, `export-public-subnet-ids`, {
      value: vpc
        .selectSubnets({subnetType: ec2.SubnetType.PUBLIC})
        .subnetIds.join(","),
      exportName: resource.publicSubnets.subnetIdsExportName,
    })
    new cdk.CfnOutput(this, `export-private-subnet-ids`, {
      value: vpc
        .selectSubnets({subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS})
        .subnetIds.join(","),
      exportName: resource.privateSubnets.subnetIdsExportName,
    })
    new cdk.CfnOutput(this, `export-isolated-subnet-ids`, {
      value: vpc
        .selectSubnets({subnetType: ec2.SubnetType.PRIVATE_ISOLATED})
        .subnetIds.join(","),
      exportName: resource.isolatedSubnets.subnetIdsExportName,
    })

    this.vpc = vpc
  }
}
