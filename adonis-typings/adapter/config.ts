declare module '@ioc:Adonis/Addons/AdminJS' {
    import { LucidModel } from '@ioc:Adonis/Lucid/Orm'

    /**
     * Config for AdminJS Adapter.
     * It handles how AdminJS interacts with lucid & your models.
     *
     * If you disable adapter then you'll have to manually create & register resources
     */
    export type AdapterConfig =
        | {
              /**
               * Whether to enable adapter or not
               */
              enabled: false
          }
        | {
              /**
               * Whether to enable adapter or not
               */
              enabled: true
              /**
               * A function which returns list of models to register with AdminJS.
               * By Default, all your models inside `App/Models` namespace are loaded recursively
               */
              models?: () => Promise<Array<LucidModel>>
          }
}
