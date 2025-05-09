import * as iam from "aws-cdk-lib/aws-iam"
import * as s3 from "aws-cdk-lib/aws-s3"
import * as ecr from "aws-cdk-lib/aws-ecr"

export type IamPermissions = Array<IamPermission>

export interface IamPermission {
  actions: Array<string>
  resources?: Array<string>
}

export class Permissions {
  addToRole(role: iam.IRole, permissions: IamPermissions) {
    for (const permission of permissions) {
      const policyStatement = new iam.PolicyStatement()
      policyStatement.addActions(...permission.actions)
      if (permission.resources != null) {
        policyStatement.addResources(...permission.resources)
      }
      role.addToPrincipalPolicy(policyStatement)
    }
  }

  toCreateAndDeleteSqsQueues(): IamPermissions {
    return [
      {
        actions: ["sqs:CreateQueue", "sqs:DeleteQueue"],
        resources: ["arn:aws:sqs:*"],
      },
    ]
  }

  toReadAndWriteSqsQueues(): IamPermissions {
    return [
      {
        actions: ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:SendMessage"],
        resources: ["arn:aws:sqs:*"],
      },
    ]
  }

  toReadAndWriteS3Bucket(bucket: s3.IBucket): IamPermissions {
    return [
      {
        actions: [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:GetObjectAttributes",
          // Needed for writing a large file with s3 cp
          "s3:AbortMultipartUpload",
          "s3:ListMultipartUploadParts",
          "s3:ListBucketMultipartUploads",
          // Needed for copying a large file within s3
          "s3:PutObjectTagging",
          "s3:GetObjectTagging",
          "s3:GetObjectVersion",
          "s3:GetObjectVersionTagging",
        ],
        resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
      },
    ]
  }

  toReadS3Bucket(bucket: s3.IBucket): IamPermissions {
    return [
      {
        actions: [
          "s3:GetObject",
          "s3:ListBucket",
          "s3:GetObjectAttributes",
          "s3:GetObjectTagging",
          "s3:GetObjectVersion",
          "s3:GetObjectVersionTagging",
        ],
        resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
      },
    ]
  }

  toWriteS3BucketObjects(bucket: s3.IBucket): IamPermissions {
    return [
      {
        actions: ["s3:PutObject", "s3:PutObjectAcl"],
        resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
      },
    ]
  }

  toPullECRImages(): IamPermissions {
    return [
      {
        actions: [
          "ecr:BatchCheckLayerForAvailability",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer",
        ],
        resources: ["*"],
      },
    ]
  }

  toUseCDK(): IamPermissions {
    // The CDK system operates a little differently from other
    // permissions.  Wnen you start developing with CDK, you do an
    // initial "cdk bootstrap".  This creates a set of roles in your
    // account that effectively have administrator access, able to
    // access everything.  When running CDK, you need to be able to
    // assume those roles, since a CDK stack could be touching
    // anything in AWS.
    //
    // See https://stackoverflow.com/questions/57118082/what-iam-permissions-are-needed-to-use-cdk-deploy
    return [
      {
        actions: ["sts:AssumeRole"],
        resources: ["arn:aws:iam::*:role/cdk-*"],
      },
      {
        actions: ["sts:PassRole"],
        resources: ["*"],
      },
      // Taking down a CDK stack (effectively a cloudformation stack)
      // requires a separate permission
      {
        actions: ["cloudformation:DeleteStack"],
        resources: [`*`],
      },
    ]
  }

  toReadCDKOutputs(): IamPermissions {
    return [
      {
        actions: ["cloudformation:DescribeStacks"],
        resources: [`*`],
      },
    ]
  }

  toLoginToECR(): IamPermissions {
    return [
      {
        actions: ["ecr:GetAuthorizationToken"],
        resources: [`*`],
      },
    ]
  }

  toPushToECR(repositories: Array<ecr.IRepository>): IamPermissions {
    return [
      {
        actions: [
          "ecr:CompleteLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:InitiateLayerUpload",
          "ecr:BatchCheckLayerAvailability",
          "ecr:PutImage",
        ],
        resources: repositories.map((r) => r.repositoryArn),
      },
    ]
  }

  toUpdateLambdaCode(functionName: string): IamPermissions {
    return [
      {
        actions: ["lambda:UpdateFunctionCode", "lambda:GetFunction"],
        resources: [`arn:aws:lambda:*:*:function:${functionName}`],
      },
    ]
  }

  toReadSSMParameters(paramPrefix: string): IamPermissions {
    return [
      {
        actions: [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath",
        ],
        resources: [
          `arn:aws:ssm:*:*:parameter${paramPrefix}`
        ]
      },
    ]
  }
}
