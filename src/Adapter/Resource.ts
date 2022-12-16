import { LucidRecord, Property } from '.'
import { getEnumValue } from '../helpers'
import { inject } from '@adonisjs/core/build/standalone'
import {
    BaseResource,
    ErrorTypeEnum,
    Filter,
    ParamsType,
    PropertyErrors,
    ValidationError,
} from 'adminjs'
import { DateTime } from 'luxon'
import Validator from 'validator'

import type { TypedSchema } from '@ioc:Adonis/Core/Validator'
import type {
    LucidModel,
    ModelQueryBuilderContract,
} from '@ioc:Adonis/Lucid/Orm'

/**
 * Resource adapter for AdminJS
 */
@inject([null, 'Adonis/Core/Validator'])
export class Resource extends BaseResource {
    constructor(
        public readonly model: LucidModel,
        private validator: typeof import('@ioc:Adonis/Core/Validator')
    ) {
        super(model)
    }

    /**
     * Whether this class can be used for the given model
     */
    public static isAdapterFor(model: any) {
        // we can't import BaseModel here so we have to use this hacky way
        return (
            typeof model === 'object' &&
            model &&
            ['$columnsDefinitions', '$relationsDefinitions'].filter(
                (property) => property in model
            )
        )
    }

    /**
     * The database being used by this resource
     */
    public databaseName(): string {
        return this.model.query().client.connectionName
    }

    /**
     * Type of database being used by this resource
     */
    public databaseType(): string {
        return this.model.query().client.dialect.name
    }

    /**
     * Name of this resource
     */
    public name() {
        return this.model.name
    }

    /**
     * Unique identifier for this resource
     */
    public id() {
        return this.model.table
    }

    /**
     * Helper to get list of properties for this resource
     */
    public properties() {
        const properties: Property[] = []

        for (const column of this.model.$columnsDefinitions.keys()) {
            properties.push(this.property(column)!)
        }

        return properties
    }

    /**
     * Helper to get property for the given column
     */
    public property(path: string) {
        if (!this.model.$columnsDefinitions.has(path)) {
            return null
        }

        return new Property(this.model, path, this.validator)
    }

    /**
     * Helper to apply filters on a given query
     */
    public applyFilter(
        query: ModelQueryBuilderContract<LucidModel>,
        filter: Filter
    ) {
        Object.keys(filter.filters).forEach((key) => {
            const filterElement = filter.filters[key]
            const property = filterElement.property

            if (typeof filterElement.value === 'string') {
                if (
                    property.type() === 'uuid' &&
                    !Validator.isUUID(filterElement.value)
                ) {
                    return
                }

                if (property.isId() && property.type() === 'string') {
                    query.whereLike(key, `%${filterElement.value}%`)
                } else {
                    query.where(key, filterElement.value)
                }
            } else {
                query.whereBetween(key, [
                    filterElement.value.from,
                    filterElement.value.to,
                ])
            }
        })

        return query
    }

    /**
     * Returns number of objects matching the given filter
     */
    public async count(filter: Filter) {
        const query = this.applyFilter(this.model.query(), filter)

        const obj = await query.count('*', 'count').firstOrFail()

        return +obj.$extras.count
    }

    /**
     * Returns list of objects matching the given filter
     */
    public async find(
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
    ): Promise<LucidRecord[]> {
        const query = this.applyFilter(this.model.query(), filter)

        if (options.limit !== undefined) {
            query.limit(options.limit)
        }

        if (options.offset !== undefined) {
            query.offset(options.offset)
        }

        if (options.sort !== undefined) {
            query.orderBy(
                options.sort.sortBy || this.model.primaryKey,
                options.sort.direction
            )
        }

        return (await query).map((obj) => this.build(obj.$attributes))
    }

    /**
     * Returns object matching the given resource id
     */
    public async findOne(id: string) {
        const obj = await this.model.find(id)

        if (!obj) {
            return null
        }

        return this.build(obj.$attributes)
    }

    /**
     * Returns list of objects matching the given resource ids
     * @param ids
     * @returns
     */
    public async findMany(ids: (string | number)[]) {
        const objects = await this.model
            .query()
            .whereIn(this.model.primaryKey, ids)

        return objects.map((obj) => this.build(obj.$attributes))
    }

    /**
     * Sanitizes parameters so that they can be passed to {@link LucidRecord}
     */
    public sanitizeParams(params: Record<string, any>) {
        const data: Record<string, any> = {}

        for (const key in params) {
            let value = params[key]
            const property = this.property(key)

            if (DateTime.isDateTime(value)) {
                value =
                    this.property(key)?.type() === 'date'
                        ? value.toISODate()
                        : value.toISO()
            } else if (property?.columnOptions.enum) {
                value = getEnumValue(
                    property.columnOptions.enum,
                    value
                ).toLowerCase()
            }

            data[key] = value
        }

        return data
    }

    /**
     * Helper to build {@link LucidRecord} from params
     */
    public build(params: Record<string, any>) {
        return new LucidRecord(this.sanitizeParams(params), this)
    }

    /**
     * Helper to validate params passed during creation / updation.
     *
     * TODO: add support for files
     * TODO: add support for JSON
     */
    public async validateParams(params: ParamsType) {
        const propertyHash: Record<string, Property> = {}

        const validatorSchema = this.validator.schema.create(
            this.properties().reduce((acc, property) => {
                acc[property.path()] = property.getSchemaType()
                propertyHash[property.path()] = property

                return acc
            }, {} as TypedSchema)
        )

        try {
            const data = await this.validator.validator.validate({
                schema: validatorSchema,
                data: params,
            })

            Object.entries(propertyHash).forEach(([key, property]) => {
                if (property.columnOptions.enum) {
                    // convert enum string value to integer
                    data[key] = getEnumValue(
                        property.columnOptions.enum,
                        data[key]
                    )
                }
            })

            return data
        } catch (error) {
            if (error instanceof this.validator.ValidationException) {
                // build AdminJS validation error from Adonis' ValidationException
                throw new ValidationError(
                    Object.entries((error as any).messages).reduce(
                        (acc, [key, messages]) => {
                            acc[key] = {
                                type: ErrorTypeEnum.Validation,
                                message: String(messages),
                            }

                            return acc
                        },
                        {} as PropertyErrors
                    )
                )
            }

            throw error
        }
    }

    /**
     * Create a new object in database and return its parameters
     */
    public async create(params: Record<string, any>): Promise<ParamsType> {
        const data = await this.validateParams(params)
        const object = await this.model.create(data)

        return this.sanitizeParams(object.$attributes)
    }

    /**
     * Update an existing object in database and return its parameters
     */
    public async update(
        id: string | number,
        params: Record<string, any>
    ): Promise<ParamsType> {
        const object = await this.model.findOrFail(id)

        await object.merge(await this.validateParams(params)).save()

        return this.sanitizeParams(object.$attributes)
    }

    /**
     * Delete an object from database
     */
    public async delete(id: string | number) {
        const object = await this.model.find(id)

        await object?.delete()
    }
}
