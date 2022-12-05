import { BaseDatabase } from 'adminjs'

/**
 * Database adapter for AdminJS
 */
export class Database extends BaseDatabase {
    public static isAdapterFor(database: any) {
        return database === 'lucid'
    }

    /**
     * Get list of resources for current database.
     */
    public resources() {
        // TODO: Implement this
        return []
    }
}
