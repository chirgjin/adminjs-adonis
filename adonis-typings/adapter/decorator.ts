declare module '@ioc:Adonis/Addons/AdminJS' {
    import { PropertyType } from 'adminjs'
    import {
        LucidModel,
        LucidRow,
        ModelQueryBuilderContract,
    } from '@ioc:Adonis/Lucid/Orm'

    export type AdminColumnOptions = {
        /**
         * Name of field.
         */
        name: string
        /**
         * Position of display in the form.
         * Defaults to 1
         */
        position: number
        /**
         * Type of field.
         */
        type?: PropertyType | 'file'
        /**
         * Whether field is visible or not. Defaults to true
         */
        visible: boolean
        /**
         * Whether field is editable or not. Defaults to false for primary key & true for all others
         */
        editable: boolean
        /**
         * Whether field is unique or not. Defaults to true for primary key & false for all others
         */
        unique: boolean
        /**
         * Available enum options for this field.
         */
        enum?: Record<string, any>
        /**
         * Whether field is sortable or not. Defaults to true
         */
        sortable: boolean
        /**
         * Whether field is optional or not. Defaults to false
         */
        optional: boolean
        /**
         * Function to convert attribute to displayable value
         */
        serialize?: (
            value: any,
            attribute: string,
            instance: LucidRow
        ) => any | Promise<any>
    }

    export function adminColumn(
        options: Partial<AdminColumnOptions>
    ): (target: LucidRow, property: string) => void

    /**
     * Type for decorators providing hook functionalities
     */
    export type HookDecorator<ArgType> = () => <
        Property extends string,
        T extends LucidModel &
            Record<Property, (arg: ArgType) => Promise<void> | void>
    >(
        target: T,
        property: Property
    ) => void

    /**
     * Before create hook.
     * Executed after all parameters have been validated but before save is called.
     *
     * Runs before the original 'beforeCreate' hook of AdonisJS
     */
    export const beforeCreate: HookDecorator<LucidRow>

    /**
     * Before update hook.
     * Executed after all parameters have been validated but before save is called.
     *
     * Runs before the original 'beforeUpdate' hook of AdonisJS
     */
    export const beforeUpdate: HookDecorator<LucidRow>

    /**
     * Before delete hook.
     *
     * Runs before the original 'beforeDelete' hook of AdonisJS
     */
    export const beforeDelete: HookDecorator<LucidRow>

    /**
     * Before find hook.
     * Executed when a single object is fetched i.e on show & edit pages.
     *
     * Runs before the original 'beforeFind' hook of AdonisJS
     */
    export const beforeFind: HookDecorator<
        ModelQueryBuilderContract<LucidModel>
    >

    /**
     * Before fetch hook.
     * Executed when multiple objects are fetched i.e on list & filter pages
     * or when the list of objects is displayed in select box of related fields.
     *
     * Runs before the original 'beforeCreate' hook of AdonisJS
     */
    export const beforeFetch: HookDecorator<
        ModelQueryBuilderContract<LucidModel>
    >

    /**
     * After create hook.
     * Only called if create operation is completed successfully.
     *
     * Runs after the original 'afterCreate' hook of AdonisJS
     */
    export const afterCreate: HookDecorator<LucidRow>

    /**
     * After update hook.
     * Only called if update operation is completed successfully.
     *
     * Runs after the original 'afterUpdate' hook of AdonisJS
     */
    export const afterUpdate: HookDecorator<LucidRow>

    /**
     * After delete hook.
     * Only called if delete operation is completed successfully.
     *
     * Runs after the original 'afterDelete' hook of AdonisJS
     */
    export const afterDelete: HookDecorator<LucidRow>

    /**
     * After find hook.
     * Executed when a single object is fetched i.e on show & edit pages.
     *
     * Runs after the original 'afterFind' hook of AdonisJS
     */
    export const afterFind: HookDecorator<LucidRow>

    /**
     * After fetch hook.
     * Executed when multiple objects are fetched i.e on list & filter pages
     * or when the list of objects is displayed in select box of related fields.
     *
     * Runs after the original 'beforeCreate' hook of AdonisJS
     */
    export const afterFetch: HookDecorator<LucidRow[]>
}
