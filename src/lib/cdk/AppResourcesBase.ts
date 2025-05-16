import {Construct, IConstruct} from "constructs"
import * as R from "./Resources"
import * as ssm from "aws-cdk-lib/aws-ssm"
import * as s3 from "aws-cdk-lib/aws-s3"
import * as cdk from "aws-cdk-lib"
import * as route53 from "aws-cdk-lib/aws-route53"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import * as NU from "../utils/NameUtils"

export type AppResourcesBaseProps = R.ResourcesProps & {}

export class AppResourcesBase<
  C extends AppResourcesBaseProps,
> extends R.Resources<C> {
  constructor(scope: IConstruct, id: string, props: C) {
    super(scope, id, props)
  }

  // Returns a value exported by the app infrastructure CDK stack.
  // The given name will be appended to the infrastructure base name
  getInfrastructureExport(name: string): string {
    return cdk.Fn.importValue(`${this.cdkExportsPrefix}:${name}`)
  }
}
