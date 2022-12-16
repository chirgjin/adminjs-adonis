declare module '@ioc:Adonis/Addons/AdminJS' {
    import { BaseDatabase } from 'adminjs'

    /**
     * Database adapter for AdminJS
     */
    export class Database extends BaseDatabase {
        public static isAdapterFor(database: any): boolean
        /**
         * Get list of resources for current database.
         */
        public resources(): never[]
    }
}
