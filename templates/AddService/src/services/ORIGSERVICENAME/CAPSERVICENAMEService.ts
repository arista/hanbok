import {PrismaClient} from "prisma-app-client/ORIGSERVICENAME/index.js"

export class CAPSERVICENAMEService {
  _prisma?: PrismaClient
  get prisma(): PrismaClient {
    return (this._prisma ??= (() => {
      return new PrismaClient({})
    })())
  }

  constructor() {}
}
