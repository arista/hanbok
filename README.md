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

* Write the code for each command in its own file under `commands/`.  For example: `commands/sample.ts`:

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

## Services

A Service is effectively a prisma database schema and, optionally, code intended for accessing the data through that schema.  During deployment, hanbok will automatically create and maintain a separate database for each defined service.

To add a service:

* Choose a name for the service

* Add a schema file at `src/services/{service name}/prisma/schema.prisma`:

```
__HANBOK_PRISMA_HEADER__

model SampleModel {
  ...
}
```

* Optionally, add code for accessing the database through the service at `src/services/{service name}/{capitalized service name}Service.ts`, potentially organized by "model objects" or some other organizing principle.  Note that nothing stops the rest of the app from accessing the prisma client directly, but it's encouraged to put some kind of API layer around each service.

* Within code that uses the prisma schema, import the prisma code like this:

`import {PrismaClient} from "prisma-app-client/{service name}/index.js"`

At development and deployment time, hanbok will replace the `__HANBOK_PRISMA_HEADER__` with the declarations needed to run prisma in the required environment.

## Webapps

A webapp consists of a server, a set of server routes, and a React app.

## Tests

