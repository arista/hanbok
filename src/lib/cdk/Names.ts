//--------------------------------------------------
// NamesBase

export class NamesBase {
  constructor() {}
}

//--------------------------------------------------
// Names

export class Names extends NamesBase {
  constructor() {
    super()
  }

  suite(name: string): SuiteNames {
    return new SuiteNames(this, name)
  }
}

//--------------------------------------------------
// SuiteNames

export class SuiteNames extends NamesBase {
  constructor(
    public names: Names,
    public name: string
  ) {
    super()
  }

  app(name: string): AppNames {
    return new AppNames(this, name)
  }
}

//--------------------------------------------------
// AppNames

export class AppNames extends NamesBase {
  constructor(
    public suite: SuiteNames,
    public name: string
  ) {
    super()
  }

  deployenv(name: string): DeployenvNames {
    return new DeployenvNames(this, name)
  }

  backend(name: string): BackendNames {
    return new BackendNames(this, name)
  }
}

//--------------------------------------------------
// DeployenvNames

export class DeployenvNames extends NamesBase {
  constructor(
    public app: AppNames,
    public name: string
  ) {
    super()
  }

  webapp(name: string): DeployenvWebappNames {
    return new DeployenvWebappNames(this, name)
  }
}

//--------------------------------------------------
// DeployenvNames

export class DeployenvWebappNames extends NamesBase {
  constructor(
    public deployenv: DeployenvNames,
    public name: string
  ) {
    super()
  }
}

//--------------------------------------------------
// BackendNames

export class BackendNames extends NamesBase {
  constructor(
    public app: AppNames,
    public name: string
  ) {
    super()
  }

  service(name: string): BackendServiceNames {
    return new BackendServiceNames(this, name)
  }
}

//--------------------------------------------------
// BackendServiceNames

export class BackendServiceNames extends NamesBase {
  constructor(
    public backend: BackendNames,
    public name: string
  ) {
    super()
  }
}
