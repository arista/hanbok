import {Construct, IConstruct} from "constructs"
import * as cdk from "aws-cdk-lib"
import * as sm from "aws-cdk-lib/aws-secretsmanager"
import {AppResourcesBase} from "./AppResourcesBase"
import * as PM from "../devenv/ProjectModel"
import * as NU from "../utils/NameUtils"

export type AppInfrastructureBaseProps = {
  projectModel: PM.ProjectModel
  stackNameParts: Array<string>
}

export class AppInfrastructureBase<
  C extends AppInfrastructureBaseProps,
> extends Construct {
  constructor(
    scope: IConstruct,
    id: string,
    public props: C
  ) {
    super(scope, id)
    const {projectModel, stackNameParts} = props
    const resources = new AppResourcesBase(this, "resources", {
      projectModel,
    })
    const suiteName = projectModel.suite!.name
    const appName = projectModel.name

    // Create the username/password for the app's database user
    const dbUsername = NU.toAppDatabaseUser(suiteName, appName)
    const secretName = NU.toAppCredentialsSecretName(suiteName, appName)
    const dbSecret = new sm.Secret(this, "DbSecret", {
      secretName,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({username: dbUsername}),
        generateStringKey: "password",
        passwordLength: 32,
        // Avoid having any funny characters, since that can cause
        // problems with cli commands
        excludeCharacters: "!\"#$%&'()*+,-./:;<=>?@[\]^_\`{|}~\\",
        requireEachIncludedType: false,
      },
    })
    // FIXME - abstract this out
    const prefix = NU.toDashedName([suiteName, appName], (s) =>
      NU.toAlphanumDash(s, 65)
    )
    const secretExportName = `${prefix}:db:credentials:secret-name`
    new cdk.CfnOutput(this, `export-db-credentials-secret-name`, {
      value: secretName,
      exportName: secretExportName,
    })
  }
}
