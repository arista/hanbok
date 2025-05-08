export function dashesToCamelCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase())
}

export function sanitizeCdkStackName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9-]/g, "-") // replace bad chars
    .replace(/^-+|-+$/g, "") // trim leading/trailing dashes
    .replace(/--+/g, "-") // collapse multiple dashes
    .slice(0, 128) // enforce length limit
}

export function toCdkStackName(
  parts: Array<string | null | undefined>
): string {
  return parts
    .filter((p) => p != null)
    .map((p) => dashesToCamelCase(p))
    .map((p) => sanitizeCdkStackName(p))
    .join("-")
}

export function sanitizeCodePipelineName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9-]/g, "-") // replace bad chars
    .replace(/^-+|-+$/g, "") // trim leading/trailing dashes
    .replace(/--+/g, "-") // collapse multiple dashes
    .slice(0, 100) // enforce length limit
}

export function toCodePipelineName(
  parts: Array<string | null | undefined>
): string {
  return parts
    .filter((p) => p != null)
    .map((p) => dashesToCamelCase(p))
    .map((p) => sanitizeCodePipelineName(p))
    .join("-")
}

export function sanitizeCodebuildProjectName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9-]/g, "-") // replace bad chars
    .replace(/^-+|-+$/g, "") // trim leading/trailing dashes
    .replace(/--+/g, "-") // collapse multiple dashes
    .slice(0, 100) // enforce length limit
}

export function toCodebuildProjectName(
  parts: Array<string | null | undefined>
): string {
  return parts
    .filter((p) => p != null)
    .map((p) => dashesToCamelCase(p))
    .map((p) => sanitizeCodebuildProjectName(p))
    .join("-")
}
