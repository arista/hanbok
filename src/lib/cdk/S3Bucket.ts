import {Construct} from "constructs"
import * as cdk from "aws-cdk-lib"
import * as s3 from "aws-cdk-lib/aws-s3"

export type Props = {
  name: string
  isPublic?: boolean
  // Can the bucket be used to host http access
  isHostable?: boolean
  // What should happen when the bucket is removed from the stack
  removePolicy?: RemovePolicy
  cors?: CorsConfig
  // The name that should be used to export the bucket's name
  exportName?: string
}

export type RemovePolicy =
  // Do not remove the bucket when it's removed from the stack
  | "no-delete"
  // Only remove the bucket if it's empty
  | "delete-if-empty"
  // Empty out the bucket and remove it
  | "empty-and-delete"

export type CorsConfig = "none" | "allow-all-origins"

export class S3Bucket extends Construct {
  bucket: s3.IBucket
  export: cdk.CfnOutput | null = null

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id)

    const {name, isPublic, isHostable, removePolicy, cors, exportName} = props
    const access = isPublic
      ? {
          publicReadAccess: true,
          blockPublicAccess: new s3.BlockPublicAccess({
            blockPublicAcls: false,
            blockPublicPolicy: false,
            ignorePublicAcls: false,
            restrictPublicBuckets: false,
          }),
        }
      : {
          publicReadAccess: false,
        }

    const hostable = isHostable
      ? {
          // This is apparently how you do s3 http hosting
          websiteIndexDocument: "index.html",
        }
      : {}

    const removal = (() => {
      switch (removePolicy) {
        case "no-delete":
          return {}
        case "delete-if-empty":
          return {
            removalPolicy: cdk.RemovalPolicy.DESTROY,
          }
        case "empty-and-delete":
          return {
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
          }
        default:
          return {}
      }
    })()

    const bucket = new s3.Bucket(this, "bucket", {
      bucketName: name,
      ...access,
      ...hostable,
      ...removal,
    })

    if (cors != null) {
      switch (cors) {
        case "allow-all-origins":
          bucket.addCorsRule({
            allowedMethods: [s3.HttpMethods.GET],
            allowedOrigins: ["*"],
            allowedHeaders: ["*"],
            maxAge: 3000,
          })
          break
        case "none":
          break
        default:
          const unexpected: never = cors
          break
      }
    }

    if (exportName != null) {
      this.export = new cdk.CfnOutput(this, `export`, {
        value: name,
        exportName,
      })
    }

    this.bucket = bucket
  }
}
