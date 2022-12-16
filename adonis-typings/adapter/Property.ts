declare module '@ioc:Adonis/Addons/AdminJS' {
    import { BaseProperty } from 'adminjs'
    import { AdminColumnOptions } from '@ioc:Adonis/Addons/AdminJS'
    import {
        BelongsToRelationContract,
        LucidModel,
    } from '@ioc:Adonis/Lucid/Orm'

    /**
     * Type to get union of type of values of an object or array
     */
    export type ValueOf<T> = T extends object | any[] ? T[keyof T] : never

    /**
     * Property class to represent 1 column of a model.
     */
    export class Property extends BaseProperty {
        protected model: LucidModel
        protected columnKey: string
        protected validator: typeof import('@ioc:Adonis/Core/Validator')

        /**
         * Admin column options for the column
         */
        public columnOptions: AdminColumnOptions

        /**
         * Lucid Relation object for this property if type is reference
         */
        public relation: BelongsToRelationContract<
            LucidModel,
            LucidModel
        > | null

        constructor(
            model: LucidModel,
            columnKey: string,
            validator: typeof import('@ioc:Adonis/Core/Validator')
        )

        /**
         * Helper to get adonis validator schema node for this property
         */
        public getSchemaType(): ValueOf<
            Omit<
                typeof import('@ioc:Adonis/Core/Validator')['schema'],
                'refs' | 'create'
            >
        >
    }
}
