import {Construct, IConstruct} from "constructs"
import * as ssm from "aws-cdk-lib/aws-ssm"
import * as s3 from "aws-cdk-lib/aws-s3"
import * as cdk from "aws-cdk-lib"
import * as route53 from "aws-cdk-lib/aws-route53"
import * as ec2 from "aws-cdk-lib/aws-ec2"

export type ResourcesProps = {
  exportsPrefix: string
}

export class Resources<C extends ResourcesProps> extends Construct {
  constructor(
    public scope: IConstruct,
    id: string,
    public props: C
  ) {
    super(scope, id)
  }

  _ssmStringParams: CachedResources<string> | null = null
  get ssmStringParams(): CachedResources<string> {
    return (this._ssmStringParams ||= (() => {
      return new CachedResources((name) => {
        return ssm.StringParameter.valueForStringParameter(
          this.scope,
          `ssm-param-${name}`
        )
      })
    })())
  }

  _ssmSecureStringParams: CachedResources<string> | null = null
  get ssmSecureStringParams(): CachedResources<string> {
    return (this._ssmSecureStringParams ||= (() => {
      return new CachedResources((name) => {
        // The version must be specified for secure SSM params, and
        // must be changed if the value changes
        const version = 1
        return ssm.StringParameter.valueForSecureStringParameter(
          this.scope,
          `ssm-secureparam-${name}`,
          version
        )
      })
    })())
  }

  _s3Buckets: CachedResources<s3.IBucket> | null = null
  get buckets(): CachedResources<s3.IBucket> {
    return (this._s3Buckets ||= (() => {
      return new CachedResources((name) => {
        return s3.Bucket.fromBucketName(this.scope, `bucket-${name}`, name)
      })
    })())
  }

  _hostedZones: CachedResources<route53.IHostedZone> | null = null
  get hostedZones(): CachedResources<route53.IHostedZone> {
    return (this._hostedZones ||= (() => {
      return new CachedResources((name) => {
        return route53.HostedZone.fromLookup(
          this.scope,
          `hosted-zone-${name.replace(/\./g, "")}`,
          {
            domainName: name,
          }
        )
      })
    })())
  }

  _subnetsById: CachedResources<ec2.ISubnet> | null = null
  get subnetsById(): CachedResources<ec2.ISubnet> {
    return (this._subnetsById ||= (() => {
      return new CachedResources((name) => {
        return ec2.Subnet.fromSubnetId(this.scope, `subnet-byId-${name}`, name)
      })
    })())
  }
}

class CachedResources<T> {
  byName: {[name: string]: T} = {}
  constructor(public createFunc: (name: string) => T) {}
  get(name: string): T {
    return (this.byName[name] ||= (() => this.createFunc(name))())
  }
}

export class S3BucketResource {
  constructor(
    public resources: Resources<any>,
    public exportNameSuffix: string
  ) {}

  get exportName() {
    return `${this.resources.props.exportsPrefix}:${this.exportNameSuffix}`
  }

  // Returns the token representing the value exported with the given
  // exportName
  get exportedValue() {
    return cdk.Fn.importValue(this.exportName)
  }

  _bucket?: s3.IBucket
  get bucket() {
    return (this._bucket ??= (() => {
      const name = this.exportedValue
      return s3.Bucket.fromBucketName(
        this.resources.scope,
        `bucket-${name}`,
        name
      )
    })())
  }
}
