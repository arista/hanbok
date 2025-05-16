import * as cf from "@aws-sdk/client-cloudformation"

export async function readCloudFormationExport(name: string): Promise<string> {
  const client = new cf.CloudFormationClient()
  const command = new cf.ListExportsCommand({})
  const result = await client.send(command)

  const ret = result.Exports?.find((e) => e.Name === name)?.Value
  if (ret == null) {
    throw new Error(`CloudFormation export "${name}" not found`)
  }
  return ret
}
