import {IConstruct} from "constructs"
import * as cdk from "aws-cdk-lib"
import * as s3 from "aws-cdk-lib/aws-s3"

export function dashesToCamelCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase())
}

export function toAlphanumDash(str: string, maxLength: number): string {
  return str
    .replace(/[^a-zA-Z0-9-]/g, "-") // replace bad chars
    .replace(/^-+|-+$/g, "") // trim leading/trailing dashes
    .replace(/--+/g, "-") // collapse multiple dashes
    .slice(0, maxLength) // enforce length limit
}

export function toCombinedName(
  parts: Array<string | null | undefined>,
  separator: string,
  sanitize: (str: string) => string
): string {
  return parts
    .filter((p) => p != null)
    .map((p) => dashesToCamelCase(p))
    .map((p) => sanitize(p))
    .join(separator)
}

export function toDashedName(
  parts: Array<string | null | undefined>,
  sanitize: (str: string) => string
): string {
  return toCombinedName(parts, "-", sanitize)
}

export function toUnderscoredName(
  parts: Array<string | null | undefined>,
  sanitize: (str: string) => string
): string {
  return toCombinedName(parts, "_", sanitize)
}

export function sanitizeCdkStackName(name: string): string {
  return toAlphanumDash(name, 128)
}

export function toCdkStackName(
  parts: Array<string | null | undefined>
): string {
  return toDashedName(parts, sanitizeCdkStackName)
}

export function sanitizeCodePipelineName(name: string): string {
  return toAlphanumDash(name, 100)
}

export function toCodePipelineName(
  parts: Array<string | null | undefined>
): string {
  return toDashedName(parts, sanitizeCodePipelineName)
}

export function sanitizeCodeBuildName(name: string): string {
  return toAlphanumDash(name, 255)
}

export function toCodeBuildName(
  parts: Array<string | null | undefined>
): string {
  return toDashedName(parts, sanitizeCodeBuildName)
}

export function sanitizeCodebuildProjectName(name: string): string {
  return toAlphanumDash(name, 100)
}

export function toCodebuildProjectName(
  parts: Array<string | null | undefined>
): string {
  return toDashedName(parts, sanitizeCodebuildProjectName)
}

export function sanitizeStackOutputName(name: string): string {
  return toAlphanumDash(name, 128)
}

export function toStackOutputName(
  parts: Array<string | null | undefined>
): string {
  return toDashedName(parts, sanitizeStackOutputName)
}

export function sanitizeS3BucketName(name: string): string {
  return toAlphanumDash(name, 63).toLowerCase()
}

export function toS3BucketName(
  parts: Array<string | null | undefined>
): string {
  return toDashedName(parts, sanitizeS3BucketName)
}

export function sanitizeCertificateName(name: string): string {
  return toAlphanumDash(name, 128).toLowerCase()
}

export function toCertificateName(
  parts: Array<string | null | undefined>
): string {
  return toDashedName(parts, sanitizeCertificateName)
}

export function sanitizeLambdaName(name: string): string {
  return toAlphanumDash(name, 64).toLowerCase()
}

export function toLambdaName(
  suiteName: string,
  appName: string,
  deployenv: string,
  webappName: string
): string {
  return toDashedName(
    [suiteName, appName, deployenv, "webapp", webappName],
    sanitizeLambdaName
  )
}

export function sanitizeWebappApiName(name: string): string {
  return toAlphanumDash(name, 64).toLowerCase()
}

export function toWebappApiName(
  suiteName: string,
  appName: string,
  deployenv: string,
  webappName: string
): string {
  return toDashedName(
    [suiteName, appName, deployenv, "webapp", webappName],
    sanitizeWebappApiName
  )
}

// FIXME - factor out these two methods
export function toAssetsBase(
  construct: IConstruct,
  publicBucket: s3.IBucket,
  appName: string,
  deployenv: string
) {
  return cdk.Fn.join("", [
    // Unfortunately we have to constrct the https url
    // manually, since bucketWebsiteUrl returns an
    // http url
    //publicBucket.bucketWebsiteUrl,
    "https://",
    publicBucket.bucketName,
    ".s3.",
    cdk.Stack.of(construct).region,
    ".amazonaws.com",
    `/webapp-assets/by-app/${appName}/by-deployenv/${deployenv}`,
  ])
}

export function toWebappAssetsBase(
  construct: IConstruct,
  publicBucket: s3.IBucket,
  appName: string,
  webappName: string,
  deployenv: string
) {
  return cdk.Fn.join("", [
    // Unfortunately we have to constrct the https url
    // manually, since bucketWebsiteUrl returns an
    // http url
    //publicBucket.bucketWebsiteUrl,
    "https://",
    publicBucket.bucketName,
    ".s3.",
    cdk.Stack.of(construct).region,
    ".amazonaws.com",
    `/webapp-assets/by-app/${appName}/by-deployenv/${deployenv}/by-webapp/${webappName}/site/`,
  ])
}

export function toDbCredentialsSecretName(suiteName: string) {
  return `${toAlphanumDash(suiteName, 64)}/db/credentials/admin`
}

export function toDatabaseInstanceName(suiteName: string) {
  return `${toAlphanumDash(suiteName, 64)}-db`
}

// Follow MySQL's rules
export function toDevServiceDatabaseName(
  suiteName: string,
  appName: string,
  serviceName: string
) {
  return toUnderscoredName([suiteName, appName, serviceName], (str) =>
    dashesToCamelCase(str)
  )
}

export function toAppDatabasesPrefix(suiteName: string, appName: string) {
  return toUnderscoredName([suiteName, appName], (str) =>
    dashesToCamelCase(str)
  )
}

// Follow MySQL's rules
export function toAppDatabaseUser(suiteName: string, appName: string) {
  return toUnderscoredName([suiteName, appName], (str) =>
    dashesToCamelCase(str)
  )
}

export function toAppCredentialsSecretName(suiteName: string, appName: string) {
  return `${toAlphanumDash(suiteName, 64)}/${toAlphanumDash(appName, 64)}/db/credentials`
}

// Follow MySQL's rules
export function toBackendServiceDatabaseName(
  suiteName: string,
  appName: string,
  backend: string,
  serviceName: string
) {
  return toUnderscoredName([suiteName, appName, backend, serviceName], (str) =>
    dashesToCamelCase(str)
  )
}
