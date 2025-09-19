Opinionated platform for developing and deploying web apps in AWS

# Conceptual Model

# Deployment Model

# Application Structure

An "App" is intended to be represented in a single directory structure, preferably in a single git repo.

## Libraries

A library is a set of code that's named, compiled,and exported for use by other applications.

An App can define and export multiple libraries.  This is typically used to export both a "lib", and a "cli" library, in which the "lib" is intended for actual external use, while the "cli" is used to run command-line commands.

Each library will be compiled to files `dist/{library name}/{library name}.es.js` and with associated types in `dist/{library name}/{library name}.d.ts`.

Adding a library involves the following steps (assume the library is named "lib"):

* Add the library to `hanbok.config.ts`:

```
export default defineConfig({
  features: {
    lib: [
      {name: "lib"},
    ],
  },
})
```

* Add the library to `package.json`:

```
"exports": {
    "./lib": {
      "types": "./dist/lib/lib.d.ts",
      "import": "./dist/lib/lib.es.js",
      "default": "./dist/lib/lib.es.js"
    }
}
```

* Write an entry point in `src/lib.ts`

This should export the code that needs to be in the library.  It can reference any code from the repo, not just code in the library-specific directory.

* Write the types in `src/lib-types.ts`

This should export any type definitions that should be exported in the `.d.ts` file.

* Place library-specific code in `src/lib/`

Include code specific to the library.  The code used by the library doesn't need to be confined to this directory - it can, for example, bring in anything else in the repo such as generated prisma files, other library code, etc.  But code specific to the library should be placed here.

## CLI

A command-line interface can be added to an App using [oclif](https://oclif.io/).  This involves the following steps:

* Decide on a name for the cli executable.  For example, `mycli`.

* Add the "cli" library using the library steps above with entry point at `src/cli.ts`

* Add oclif packages:

```
npm install --save oclif
npm install --save-dev @oclif/core @oclif/plugin-autocomplete @oclif/plugin-help @oclif/plugin-not-found
```

* Add the oclif declaration to `package.json`:

```
  "bin": {
    "{cli executable}": "bin/{cli executable}",
    "{cli executable}-debug": "bin/{cli executable}-debug"
  },
  "oclif": {
    "bin": "{cli executable}",
    "commands": {
      "strategy": "explicit",
      "target": "./dist/cli/cli.es.js",
      "identifier": "COMMANDS"
    },
    "plugins": [
      "@oclif/plugin-help",
      "@oclif/plugin-not-found",
      "@oclif/plugin-autocomplete"
    ],
    "topicSeparator": " "
  }
```

* Create the executable files and make them executable:

  * `bin/{cli executable}`

```
#!/usr/bin/env node

import {execute} from '@oclif/core'
await execute({dir: import.meta.url})
```

  * `bin/{cli executable}-debug`

```
#!/bin/bash

# Fail on command failure, undefined variables, and piped command
# failures, get the package directory
set -euo pipefail
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

DEBUG=* exec ${DIR}/{cli executable} "$@"
```

* Write the code for the cli:

  * Put each command in its own file under `commands/`, `commands/sample.ts` for example:

```
import "source-map-support/register.js"
import * as OC from "@oclif/core"

export class Command extends OC.Command {
  static override description = "Sample command"
  static override args = {...}
  static override flags = {...}
  static override enableJsonFlag = true

  async run() {
    const {args, flags} = await this.parse(Command)
    return await (async () => {
      ...
    })()
  }
}
```

  * For hierarchical commands, have the directory structure mirror the command hierarchy.  For example: `commands/db/initialize.ts`
  * Import all of the commands into the `cli.ts` file and export a `COMMANDS` structure mapping command names to the imported commands.  Hierarchical command structures should be specified using `:` to separate hierarchy levels (even though the command hierarhcy will still use spaces as separators on the actual cli)

```
import {Command as SampleCommand} from "./cli/commands/sample"
import {Command as DbInitializeCommand} from "./cli/commands/db/initialize"

export const COMMANDS = {
  "sample": SampleCommand,
  "db:initialize": DbInitializeCommand,
}
```

## Tests

## Services

## Webapps


```
./.gitignore
./README.md
./hanbok.config.ts
./package-lock.json
./package.json
./src/cdk.ts
./src/cdk/AppInfrastructure.ts
./src/cdk/Backend.ts
./src/cdk/Deployenv.ts
./src/lib-types.ts
./src/lib.ts
./src/lib/Sample.ts
./src/services/main/prisma/schema.prisma
./src/webapps/main/routes/RouteTypes.ts
./src/webapps/main/routes/Routes.ts
./src/webapps/main/server/AppRouteHandlerBase.ts
./src/webapps/main/server/AppRouteHandlerFactory.ts
./src/webapps/main/server/AppServer.ts
./src/webapps/main/server/DevAppServer.ts
./src/webapps/main/server/LambdaAppServer.ts
./src/webapps/main/server/MockBackend.ts
./src/webapps/main/server/handlers/PageHandler.ts
./src/webapps/main/server/handlers/SampleResourceHandler.ts
./src/webapps/main/ui/app/App.tsx
./src/webapps/main/ui/app/AppClient.ts
./src/webapps/main/ui/app/AppRoutes.tsx
./src/webapps/main/ui/app/Controller.ts
./src/webapps/main/ui/app/Model.ts
./src/webapps/main/ui/app/PageContext.ts
./src/webapps/main/ui/app/ViewEnv.ts
./src/webapps/main/ui/app/Webapp.ts
./src/webapps/main/ui/app/useViewEnv.ts
./src/webapps/main/ui/assets/SampleApp-balancingAct.png
./src/webapps/main/ui/assets/SampleApp.png
./src/webapps/main/ui/boilerplate/assetTypes.d.ts
./src/webapps/main/ui/boilerplate/index.css
./src/webapps/main/ui/boilerplate/main.tsx
./src/webapps/main/ui/components/Navbar.tsx
./src/webapps/main/ui/index.html
./src/webapps/main/ui/layouts/DashboardLayout.tsx
./src/webapps/main/ui/layouts/Layout.tsx
./src/webapps/main/ui/pages/About.tsx
./src/webapps/main/ui/pages/DashboardStats.tsx
./src/webapps/main/ui/pages/ErrorPage.tsx
./src/webapps/main/ui/pages/Home.tsx
./src/webapps/main/ui/pages/NotFound.tsx
./src/webapps/main/ui/pages/SampleResources.tsx
./src/webapps/main/ui/public/sampleIcon.svg
./test/test.ts
```
