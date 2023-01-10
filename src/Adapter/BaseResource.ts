import { getEnumValue } from '../helpers'
import { inject } from '@adonisjs/core/build/standalone'
import {
    BaseResource as BaseAdminResource,
    ErrorTypeEnum,
    Filter,
    ParamsType,
    PropertyErrors,
    ResourceOptions,
    ValidationError,
} from 'adminjs'
import AdminJS from 'adminjs/types/src'
import Validator from 'validator'

import type { TypedSchema } from '@ioc:Adonis/Core/Validator'
import type {
    LucidModel,
    LucidRow,
    ModelQueryBuilderContract,
} from '@ioc:Adonis/Lucid/Orm'

import { components } from './Components'
import { Property } from './Property'
import { LucidRecord } from './Record'

/**
 * Resource adapter for AdminJS
 */
@inject([null, 'Adonis/Core/Validator'])
export class BaseResource extends BaseAdminResource {
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
            typeof model === 'function' &&
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
        return 'lucid'
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

        await this.model.$hooks.exec('before', 'adminFetch', query)

        const data = await query

        await this.model.$hooks.exec('after', 'adminFetch', data)

        const objects: LucidRecord[] = []

        for (const obj of data) {
            objects.push(this.build(await this.sanitizeParams(obj)))
        }

        return objects
    }

    /**
     * Returns object matching the given resource id
     */
    public async findOne(id: string) {
        const query = this.model.query().where(this.model.primaryKey, id)

        await this.model.$hooks.exec('before', 'adminFind', query)

        const obj = await query.first()

        if (!obj) {
            return null
        }

        await this.model.$hooks.exec('after', 'adminFind', obj)

        return this.build(await this.sanitizeParams(obj))
    }

    /**
     * Returns list of objects matching the given resource ids
     * @param ids
     * @returns
     */
    public async findMany(ids: (string | number)[]) {
        const query = this.model.query().whereIn(this.model.primaryKey, ids)

        await this.model.$hooks.exec('before', 'adminFetch', query)

        const data = await query

        await this.model.$hooks.exec('after', 'adminFetch', data)

        const objects: LucidRecord[] = []

        for (const obj of data) {
            objects.push(this.build(await this.sanitizeParams(obj)))
        }

        return objects
    }

    /**
     * Sanitizes parameters so that they can be passed to {@link LucidRecord}
     */
    public async sanitizeParams(row: LucidRow) {
        const data: Record<string, any> = {}

        for (const property of this.properties()) {
            if (!property.isEditable() && !property.isVisible()) {
                continue
            }

            data[property.path()] = await property.serialize(row)
        }

        return data
    }

    /**
     * Helper to build {@link LucidRecord} from params
     */
    public build(params: Record<string, any>): LucidRecord {
        return new LucidRecord(params, this)
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
                if (property.isEditable()) {
                    acc[property.path()] = property.getSchemaType()
                    propertyHash[property.path()] = property
                }

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
        const object = new this.model().fill(data)

        await this.model.$hooks.exec('before', 'adminCreate', object)

        await object.save()

        await this.model.$hooks.exec('after', 'adminCreate', object)

        return await this.sanitizeParams(object)
    }

    /**
     * Update an existing object in database and return its parameters
     */
    public async update(
        id: string | number,
        params: Record<string, any>
    ): Promise<ParamsType> {
        const object = await this.model.findOrFail(id)
        object.merge(await this.validateParams(params))

        await this.model.$hooks.exec('before', 'adminUpdate', object)

        await object.save()

        await this.model.$hooks.exec('after', 'adminUpdate', object)

        return await this.sanitizeParams(object)
    }

    /**
     * Delete an object from database
     */
    public async delete(id: string | number) {
        const object = await this.model.find(id)

        await this.model.$hooks.exec('before', 'adminDelete', object)

        await object?.delete()

        await this.model.$hooks.exec('after', 'adminDelete', object)
    }

    /**
     * Helper used internally by adminjs to assign decorator to this resource.
     * In order to add support for file attachments, we update the options property
     * to override the components which are rendered so that proper file in displayed
     */
    public assignDecorator(
        admin: AdminJS,
        options?: ResourceOptions | undefined
    ): void {
        const finalOptions: ResourceOptions = options || {}

        finalOptions.properties = finalOptions.properties || {}

        for (const property of this.properties()) {
            if (
                property.isAttachment &&
                !finalOptions.properties[property.path()]
            ) {
                finalOptions.properties[property.path()] = {
                    components: {
                        edit: components.FileInput,
                        list: components.ListUrl,
                        show: components.ShowUrl,
                    },
                }

                if (property.attachmentOptions?.extnames) {
                    finalOptions.properties[property.path()].props = {
                        accept: property.attachmentOptions?.extnames
                            .map((ext) => `.${ext}`)
                            .join(','),
                    }
                }
            }
        }

        return super.assignDecorator(admin, finalOptions)
    }
}
