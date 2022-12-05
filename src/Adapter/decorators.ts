import type { AdminColumnOptions } from '@ioc:Adonis/Addons/AdminJS'
import type { LucidModel, LucidRow } from '@ioc:Adonis/Lucid/Orm'

/**
 * Define type, optional etc properties for AdminJS
 */
export function adminColumn(options: Partial<AdminColumnOptions>) {
    return function (target: LucidRow, property: string) {
        const model = target.constructor as LucidModel

        model.$defineProperty('$adminColumnOptions', {}, 'inherit')

        model.$adminColumnOptions![property] = options
    }
}
