declare module '@ioc:Adonis/Addons/AdminJS' {
    import { LucidModel } from '@ioc:Adonis/Lucid/Orm'

    export type AdapterConfig =
        | {
              enabled: false
          }
        | {
              enabled: true
              models?: () => Promise<Array<LucidModel>>
          }
}
