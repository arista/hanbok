import {APIGatewayEvent, APIGatewayProxyResult, Context} from "aws-lambda"
import {
  AppServerEnvBase,
  LambdaBuildArtifacts,
  ViteManifest,
  BuildInfo,
} from "./AppServerTypes"
import {LambdaRouterImpl} from "../routes/LambdaRouterImpl"
import path from "node:path"
import fs from "node:fs"

export type LambdaHandler = (
  event: APIGatewayEvent,
  context: Context
) => Promise<APIGatewayProxyResult>

export function createLambdaAppServer(
  f: (props: AppServerEnvBase) => void
): LambdaHandler {
  const {manifest, buildInfo} = readLambdaBuildArtifacts()
  const {routesEndpoint, assetsBase} = readLambdaEnvVars()
  const router = new LambdaRouterImpl()
  const props: AppServerEnvBase = {
    router,
    routesPrefix: "/",
    isProduction: true,
    routesEndpoint,
    routerBase: "/",
    manifest: manifest,
    assetsBase,
    buildInfo,
  }
  console.log(`Creating lambda with config, including: ${JSON.stringify({routesEndpoint, assetsBase, buildInfo}, null, 2)}`)
  f(props)
  console.log(`Lambda created`)
  return async (event, context) => {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ event, context }, null, 2),
    }

    /*
    const result = await router.handleRequest(event)
    if (result == null) {
      const {httpMethod, path, headers, multiValueHeaders, body} = event
      if (httpMethod === "GET" && path === "/request-info") {
        return {
          statusCode: 200,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({event, context}, null, 2),
        }
      } else {
        return {
          statusCode: 404,
          body: "Not Found",
        }
      }
    } else {
      return result
      }
      */
  }
}

export function readLambdaBuildArtifacts(): LambdaBuildArtifacts {
  const artifactsDir = path.join(__dirname, "build-artifacts")

  function readJson<T>(filename: string): T {
    const infile = path.join(artifactsDir, filename)
    return JSON.parse(fs.readFileSync(infile, "utf-8"))
  }

  const buildInfo: BuildInfo = readJson("buildInfo.json")
  const manifest: ViteManifest = readJson("manifest.json")
  return {
    buildInfo,
    manifest,
  }
}

export type LambdaEnvVars = {
  routesEndpoint: string
  assetsBase: string
}

export function readLambdaEnvVars(): LambdaEnvVars {
  return {
    routesEndpoint: readEnvVar("ROUTES_ENDPOINT"),
    assetsBase: readEnvVar("ASSETS_BASE"),
  }
}

function readEnvVar(name: string): string {
  const ret = process.env[name]
  if (ret == null || ret.length === 0) {
    throw new Error(
      `Environment variable "${name}" is not defined, or is empty`
    )
  }
  return ret
}
