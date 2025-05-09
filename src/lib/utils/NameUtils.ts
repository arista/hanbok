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

export function toDashedName(
  parts: Array<string | null | undefined>,
  sanitize: (str: string) => string
): string {
  return parts
    .filter((p) => p != null)
    .map((p) => dashesToCamelCase(p))
    .map((p) => sanitize(p))
    .join("-")
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
