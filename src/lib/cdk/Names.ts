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

  suite(suiteName: string): SuiteNames {
    return new SuiteNames(suiteName)
  }
}

//--------------------------------------------------
// SuiteNames

export class SuiteNames extends NamesBase {
  constructor(public suiteName: string) {
    super()
  }

  app(appName: string): AppNames {
    return new AppNames(this.suiteName, appName)
  }
}

//--------------------------------------------------
// AppNames

export class AppNames extends NamesBase {
  constructor(
    public suiteName: string,
    public appName: string
  ) {
    super()
  }
}
