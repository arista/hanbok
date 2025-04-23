// Models a project

import { ProjectConfig } from "./ProjectConfig";

export type ProjectModel = {
  projectRoot: string;
  config: ProjectConfig;
  features: Features;
};

export type Features = {
  lib: LibConfig | null;
};

export type LibConfig = {
  libFile: string;
  libTypesFile: string | null;
};
