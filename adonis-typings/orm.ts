declare module '@ioc:Adonis/Lucid/Orm' {
    import { AdminColumnOptions } from '@ioc:Adonis/Addons/AdminJS'

    export interface LucidModel {
        $adminColumnOptions?: Record<string, Partial<AdminColumnOptions>>
    }
}
