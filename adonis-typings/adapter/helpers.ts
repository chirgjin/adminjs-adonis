declare module '@ioc:Adonis/Addons/AdminJS' {
    import { LucidModel } from '@ioc:Adonis/Lucid/Orm'

    export function getAdminColumnOptions(
        model: LucidModel,
        columnKey: string
    ): AdminColumnOptions
}
