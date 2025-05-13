import {Construct, IConstruct} from "constructs"
import * as ssm from "aws-cdk-lib/aws-ssm"
import * as s3 from "aws-cdk-lib/aws-s3"
import * as cdk from "aws-cdk-lib"
import * as route53 from "aws-cdk-lib/aws-route53"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import * as NU from "../utils/NameUtils"
import * as PM from "../devenv/ProjectModel"
import * as acm from "aws-cdk-lib/aws-certificatemanager"

export type ResourcesProps = {
  projectModel: PM.ProjectModel
}

export class Resources<C extends ResourcesProps> extends Construct {
  constructor(
    public scope: IConstruct,
    id: string,
    public props: C
  ) {
    super(scope, id)
  }

  get cdkExportsPrefix() {
    const {projectModel} = this.props
    switch (projectModel.type) {
      case "Suite":
        return NU.toStackOutputName([projectModel.name])
      case "App":
        return NU.toStackOutputName([projectModel.suite?.name])
    }
  }

  _subnetsById: CachedResources<ec2.ISubnet> | null = null
  get subnetsById(): CachedResources<ec2.ISubnet> {
    return (this._subnetsById ||= (() => {
      return new CachedResources((name) => {
        return ec2.Subnet.fromSubnetId(this.scope, `subnet-byId-${name}`, name)
      })
    })())
  }

  _ssmStringParams: CachedResources<string> | null = null
  get ssmStringParams(): CachedResources<string> {
    return (this._ssmStringParams ||= (() => {
      return new CachedResources((name) => {
        return ssm.StringParameter.valueForStringParameter(this.scope, name)
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
          // ${NU.toAlphanumDash(name, 64)} - do we need this?
          version
        )
      })
    })())
  }

  // _s3Buckets: CachedResources<s3.IBucket> | null = null
  // get buckets(): CachedResources<s3.IBucket> {
  //   return (this._s3Buckets ||= (() => {
  //     return new CachedResources((name) => {
  //       return s3.Bucket.fromBucketName(this.scope, `bucket-${name}`, name)
  //     })
  //   })())
  // }

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
    return `${this.resources.cdkExportsPrefix}:${this.exportNameSuffix}`
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

export class VpcResource {
  publicSubnets: VpcSubnetResource
  privateSubnets: VpcSubnetResource
  isolatedSubnets: VpcSubnetResource

  constructor(
    public resources: Resources<any>,
    public exportNameSuffix: string
  ) {
    this.publicSubnets = new VpcSubnetResource(
      this.resources,
      `${this.exportNameBase}:subnets:public`
    )
    this.privateSubnets = new VpcSubnetResource(
      this.resources,
      `${this.exportNameBase}:subnets:private`
    )
    this.isolatedSubnets = new VpcSubnetResource(
      this.resources,
      `${this.exportNameBase}:subnets:isolated`
    )
  }

  get exportNameBase() {
    return `${this.resources.cdkExportsPrefix}:${this.exportNameSuffix}`
  }

  // id of the vpc
  get vpcIdExportName() {
    return `${this.exportNameBase}:id`
  }
  get vpcIdExportedValue() {
    return cdk.Fn.importValue(this.vpcIdExportName)
  }

  // The comma-separated list of the vpc's availability zones
  get azsExportName() {
    return `${this.exportNameBase}:azs`
  }
  get azsExportedValue() {
    return cdk.Fn.split(",", this.azsExportName)
  }
}

export class VpcSubnetResource {
  constructor(
    public resources: Resources<any>,
    public exportNameSuffix: string
  ) {}

  // id of the vpc
  get subnetIdsExportName() {
    return `${this.resources.cdkExportsPrefix}:${this.exportNameSuffix}:ids`
  }
  get subnetIdsExportedValue() {
    return cdk.Fn.split(",", this.subnetIdsExportName)
  }

  _subnets?: Array<ec2.ISubnet>
  get subnets() {
    return (this._subnets ??= (() => {
      return this.subnetIdsExportedValue.map((id) =>
        this.resources.subnetsById.get(id)
      )
    })())
  }
}

export class CertificateResources {
  constructor(
    public resources: Resources<any>,
    public exportNameSuffix: string
  ) {}

  byName: Record<string, CertificateResource> = {}

  get(name: string): CertificateResource {
    return (this.byName[name] ||= (() => {
      return new CertificateResource(
        this.resources,
        `${this.exportNameSuffix}:${name}`,
        name
      )
    })())
  }
}

export class CertificateResource {
  constructor(
    public resources: Resources<any>,
    public exportNameSuffix: string,
    public name: string
  ) {}

  get exportNameBase() {
    return `${this.resources.cdkExportsPrefix}:${this.exportNameSuffix}`
  }

  // arn of the certificate
  get arnExportName() {
    return `${this.exportNameBase}:arn`
  }
  get arnExportedValue() {
    return cdk.Fn.importValue(this.arnExportName)
  }

  _certificate?: acm.ICertificate
  get certificate() {
    return (this._certificate ??= (() => {
      const arn = this.arnExportedValue
      return acm.Certificate.fromCertificateArn(
        this.resources.scope,
        `cerrtificate-${this.name}`,
        arn
      )
    })())
  }
}
