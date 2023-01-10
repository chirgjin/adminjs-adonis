import type {
    AdminColumnOptions,
    HookDecorator,
} from '@ioc:Adonis/Addons/AdminJS'
import type {
    LucidModel,
    LucidRow,
    ModelQueryBuilderContract,
} from '@ioc:Adonis/Lucid/Orm'

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

export const beforeCreate: HookDecorator<LucidRow> = () =>
    function (target, property) {
        target.boot()
        target.$hooks.add(
            'before',
            'adminCreate',
            target[property].bind(target)
        )
    }

export const beforeUpdate: HookDecorator<LucidRow> = () =>
    function (target, property) {
        target.boot()
        target.$hooks.add(
            'before',
            'adminUpdate',
            target[property].bind(target)
        )
    }

export const beforeDelete: HookDecorator<LucidRow> = () =>
    function (target, property) {
        target.boot()
        target.$hooks.add(
            'before',
            'adminDelete',
            target[property].bind(target)
        )
    }

export const beforeFind: HookDecorator<
    ModelQueryBuilderContract<LucidModel>
> = () =>
    function (target, property) {
        target.boot()
        target.$hooks.add('before', 'adminFind', target[property].bind(target))
    }

export const beforeFetch: HookDecorator<
    ModelQueryBuilderContract<LucidModel>
> = () =>
    function (target, property) {
        target.boot()
        target.$hooks.add('before', 'adminFetch', target[property].bind(target))
    }

export const afterCreate: HookDecorator<LucidRow> = () =>
    function (target, property) {
        target.boot()
        target.$hooks.add('after', 'adminCreate', target[property].bind(target))
    }

export const afterUpdate: HookDecorator<LucidRow> = () =>
    function (target, property) {
        target.boot()
        target.$hooks.add('after', 'adminUpdate', target[property].bind(target))
    }

export const afterDelete: HookDecorator<LucidRow> = () =>
    function (target, property) {
        target.boot()
        target.$hooks.add('after', 'adminDelete', target[property].bind(target))
    }

export const afterFind: HookDecorator<LucidRow> = () =>
    function (target, property) {
        target.boot()
        target.$hooks.add('after', 'adminFind', target[property].bind(target))
    }

export const afterFetch: HookDecorator<LucidRow[]> = () =>
    function (target, property) {
        target.boot()
        target.$hooks.add('after', 'adminFetch', target[property].bind(target))
    }
