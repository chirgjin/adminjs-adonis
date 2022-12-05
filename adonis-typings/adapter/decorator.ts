declare module '@ioc:Adonis/Addons/AdminJS' {
    import { PropertyType } from 'adminjs'

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
        type?: PropertyType
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
    }
}
