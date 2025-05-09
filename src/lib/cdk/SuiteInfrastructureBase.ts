import {Construct, IConstruct} from "constructs"
import {SuiteResourcesBase} from "./SuiteResourcesBase"
import {S3Bucket} from "./S3Bucket"
import * as PM from "../devenv/ProjectModel"
import * as NU from "../utils/NameUtils"

export type SuiteInfrastructureBaseProps = {
  projectModel: PM.ProjectModel
  stackNameParts: Array<string>
}

export class SuiteInfrastructureBase<
  C extends SuiteInfrastructureBaseProps,
> extends Construct {
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
      cdkExportsPrefix: NU.toStackOutputName(stackNameParts),
    })

    //----------------------------------------
    // Create the buckets

    // For holding codepipeline artifacts
    this.cpArtifactsBucket = new S3Bucket(this, "cp-artifacts-bucket", {
      name: NU.toS3BucketName([suiteName, "cp-artifacts"]),
      isPublic: false,
      removePolicy: "empty-and-delete",
      exportName: resources.cpArtifactsBucket.exportName,
    })

    // For private data storage by all of the suite's apps
    this.privateBucket = new S3Bucket(this, "private", {
      name: NU.toS3BucketName([suiteName, "private"]),
      isPublic: false,
      removePolicy: "delete-if-empty",
      exportName: resources.privateBucket.exportName,
    })

    // For public files exposed by all of the suite's apps, such as
    // webapp assets
    this.publicBucket = new S3Bucket(this, "public", {
      name: NU.toS3BucketName([suiteName, "public"]),
      isPublic: true,
      isHostable: true,
      removePolicy: "delete-if-empty",
      cors: "allow-all-origins",
      exportName: resources.publicBucket.exportName,
    })
  }
}
