declare module '@ioc:Adonis/Addons/AdminJS' {
    import { BaseResource, Filter, ParamsType } from 'adminjs'
    import type {
        LucidModel,
        ModelQueryBuilderContract,
    } from '@ioc:Adonis/Lucid/Orm'

    /**
     * Resource adapter for AdminJS
     */
    export class Resource extends BaseResource {
        public readonly model: LucidModel
        constructor(
            model: LucidModel,
            validator: typeof import('@ioc:Adonis/Core/Validator')
        )

        /**
         * Helper to get list of properties for this resource
         */
        public properties(): Property[]

        /**
         * Helper to get property for the given column
         */
        public property(path: string): Property | null

        /**
         * Helper to apply filters on a given query
         */
        public applyFilter(
            query: ModelQueryBuilderContract<LucidModel>,
            filter: Filter
        ): ModelQueryBuilderContract<LucidModel>

        /**
         * Returns number of objects matching the given filter
         */
        public count(filter: Filter): Promise<number>

        /**
         * Returns list of objects matching the given filter
         */
        public find(
            filter: Filter,
            options: {
                limit?: number | undefined
                offset?: number | undefined
                sort?:
                    | {
                          sortBy?: string | undefined
                          direction?: 'asc' | 'desc' | undefined
                      }
                    | undefined
            }
        ): Promise<LucidRecord[]>

        /**
         * Returns object matching the given resource id
         */
        public findOne(id: string): Promise<LucidRecord>

        /**
         * Returns list of objects matching the given resource ids
         * @param ids
         * @returns
         */
        public findMany(ids: (string | number)[]): Promise<LucidRecord[]>

        /**
         * Sanitizes parameters so that they can be passed to {@link LucidRecord}
         */
        public sanitizeParams(params: Record<string, any>): Record<string, any>

        /**
         * Helper to build {@link LucidRecord} from params
         */
        public build(params: Record<string, any>): LucidRecord

        /**
         * Helper to validate params passed during creation / updation.
         *
         * TODO: add support for files
         * TODO: add support for JSON
         */
        public validateParams(params: ParamsType): Promise<Record<string, any>>

        /**
         * Create a new object in database and return its parameters
         */
        public create(params: Record<string, any>): Promise<ParamsType>

        /**
         * Update an existing object in database and return its parameters
         */
        public update(
            id: string | number,
            params: Record<string, any>
        ): Promise<ParamsType>

        /**
         * Delete an object from database
         */
        public delete(id: string | number): Promise<void>
    }
}
