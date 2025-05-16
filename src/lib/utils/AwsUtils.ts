import * as sm from "@aws-sdk/client-secrets-manager"
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

export async function getSecretValue(name: string): Promise<string> {
  const client = new sm.SecretsManagerClient({})
  const command = new sm.GetSecretValueCommand({SecretId: name})
  const response = await client.send(command)

  if (response.SecretString) {
    return response.SecretString
  } else if (response.SecretBinary) {
    return Buffer.from(response.SecretBinary as Uint8Array).toString("utf-8")
  }

  throw new Error("Secret has no value")
}
