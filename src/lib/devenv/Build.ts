import type { ProjectModel } from "@lib/devenv/ProjectModel";
import { createProjectModel } from "@lib/devenv/createProjectModel";

export class Build {
  constructor(props: {}) {}

  async run() {
    const model = await createProjectModel({});

    return model;
  }
}
