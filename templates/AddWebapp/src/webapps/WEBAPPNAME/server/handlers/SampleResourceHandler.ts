import * as AppRouteHandlerBase from "../AppRouteHandlerBase"
import {z} from "zod"
import {routeDefs} from "../../routes/Routes"
import * as RT from "../../routes/RouteTypes"
import {MockBackend} from "../MockBackend"
import {NotFoundError} from "hanbok/routes"
import short from "short-uuid"
import {PrismaClient as PrismaClientMain} from "prisma-app-client/main/index.js"

export type Props = AppRouteHandlerBase.Props & {
  backend: MockBackend
  prismaMain: PrismaClientMain
}

export class Handler extends AppRouteHandlerBase.Handler<Props> {
  constructor(props: Props) {
    super(props)
  }

  get prismaMain() {
    return this.props.prismaMain
  }

  async list(): Promise<
    z.infer<typeof routeDefs.api.sampleResource.list.response>
  > {
    const records = await this.prismaMain.sampleResource.findMany({
      orderBy: {publicId: "asc"},
    })
    const items = records.map((r) => {
      const {publicId, name, age} = r
      return {publicId, name, age}
    })
    return {items}
  }

  async create(
    request: z.infer<typeof routeDefs.api.sampleResource.create.request>
  ): Promise<z.infer<typeof routeDefs.api.sampleResource.create.response>> {
    const item = request.body.item
    const r: RT.SampleResource.Resource = {
      publicId: short.generate(),
      name: item.name,
      age: item.hasOwnProperty("age") ? (item.age ?? null) : null,
    }
    await this.prismaMain.sampleResource.create({data: r})
    return {item: r}
  }

  async get(
    request: z.infer<typeof routeDefs.api.sampleResource.get.request>
  ): Promise<z.infer<typeof routeDefs.api.sampleResource.get.response>> {
    const {publicId} = request.params
    const item = await this._get(publicId)
    return {item}
  }

  async delete(
    request: z.infer<typeof routeDefs.api.sampleResource.delete.request>
  ): Promise<z.infer<typeof routeDefs.api.sampleResource.delete.response>> {
    const {publicId} = request.params
    const item = await this._get(publicId)
    await this.prismaMain.sampleResource.delete({where: {publicId}})
    return {item}
  }

  async update(
    request: z.infer<typeof routeDefs.api.sampleResource.update.request>
  ): Promise<z.infer<typeof routeDefs.api.sampleResource.update.response>> {
    const {publicId} = request.params
    const {item} = request.body
    const ret = await this._get(publicId)
    await this.prismaMain.sampleResource.update({
      where: {publicId},
      data: ret,
    })
    return {
      item: ret,
    }
  }

  async _get(publicId: string): Promise<RT.SampleResource.Resource> {
    const ret = await this.prismaMain.sampleResource.findUnique({
      where: {publicId},
    })
    if (ret == null) {
      throw new NotFoundError(`SampleResource "${publicId}" not found`)
    }
    return ret
  }
}
