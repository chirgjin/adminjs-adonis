import { enumKeys, getEnumValue } from '../helpers'
import { inject } from '@adonisjs/core/build/standalone'
import { BaseProperty, PropertyType } from 'adminjs'
import { DateTime } from 'luxon'
import 'reflect-metadata'

import type { AdminColumnOptions, ValueOf } from '@ioc:Adonis/Addons/AdminJS'
import type { FileValidationOptions } from '@ioc:Adonis/Core/BodyParser'
import type {
    BelongsToRelationContract,
    LucidModel,
    LucidRow,
} from '@ioc:Adonis/Lucid/Orm'

import { getAdminColumnOptions } from './helpers'

/**
 * Property class to represent 1 column of a model.
 */
@inject([null, null, 'Adonis/Core/Validator'])
export class Property extends BaseProperty {
    /**
     * Stores computed reference so that it isn't computed again
     */
    private __reference: string | null
    /**
     * Stores computed type so that it isn't computed again
     */
    private __type: PropertyType | 'file'
    /**
     * Admin column options for the column
     */
    public columnOptions: AdminColumnOptions
    /**
     * Lucid Relation object for this property if type is reference
     */
    public relation: BelongsToRelationContract<LucidModel, LucidModel> | null =
        null
    /**
     * Attachment validation options
     */
    public attachmentOptions?: Partial<FileValidationOptions>
    /**
     * Whether property is attachment or not. Can't re-use type for this due to inheritance issues
     */
    public get isAttachment() {
        this.type() // compute type

        return this.__type === 'file'
    }

    constructor(
        protected model: LucidModel,
        protected columnKey: string,
        protected validator: typeof import('@ioc:Adonis/Core/Validator')
    ) {
        const columnOptions = getAdminColumnOptions(model, columnKey)

        super({
            path: columnKey,
            isId: columnOptions.unique,
            isSortable: columnOptions.sortable,
            position: columnOptions.position,
        })

        if (columnOptions.type) {
            this.__type = columnOptions.type
        }

        this.columnOptions = columnOptions
    }

    /**
     * returns type of this property
     */
    public type() {
        if (!this.__type) {
            this.__type = this.getType()
        }

        if (this.__type === 'file') {
            return 'string'
        }

        return this.__type
    }

    /**
     * Helper to compute type for this property.
     * If type can't be computed then defaults to 'string'
     */
    private getType() {
        if (this.reference()) {
            return 'reference'
        }

        if (this.columnKey === 'uuid') {
            return 'uuid'
        } else if (this.columnKey === 'password') {
            return 'password'
        }

        const type = Reflect.getMetadata(
            'design:type',
            this.model.prototype,
            this.columnKey
        )

        if (type === String) {
            return 'string'
        } else if (type === Number) {
            return 'number'
        } else if (type === DateTime) {
            return 'datetime'
        } else if (type === Boolean) {
            return 'boolean'
        }

        return 'string'
    }

    /**
     * Whether this property is editable or not
     */
    public isEditable() {
        return this.columnOptions.editable
    }

    /**
     * Whether this property is visible or not
     */
    public isVisible() {
        return this.columnOptions.visible
    }

    /**
     * Whether this property is required or not
     */
    public isRequired() {
        return !this.columnOptions.optional
    }

    /**
     * Returns list of available values for this property if {@link AdminColumnOptions.enum} is provided
     */
    public availableValues(): string[] | null {
        if (!this.columnOptions.enum) {
            return null
        }

        return enumKeys(this.columnOptions.enum)
    }

    /**
     * Returns reference for this property if any matching lucid belongsTo relation is found
     */
    public reference() {
        if (this.__reference === undefined) {
            this.__reference = this.getReference()
        }

        return this.__reference
    }

    /**
     * Helper to compute reference relation for this property.
     */
    private getReference() {
        for (const relation of this.model.$relationsDefinitions.values()) {
            if (!relation.booted) {
                relation.boot()
            }

            if (
                relation.type === 'belongsTo' &&
                relation.foreignKey === this.columnKey
            ) {
                this.relation = relation

                return relation.relatedModel().table
            }
        }

        return null
    }

    /**
     * Helper function to apply `nullableAndOptional` on a schema validator node if it's optional
     */
    private withNullable<
        T extends ValueOf<
            Omit<
                typeof import('@ioc:Adonis/Core/Validator')['schema'],
                'refs' | 'create'
            >
        >
    >(node: T, ...args: Parameters<T>): ReturnType<T> {
        if (
            this.columnOptions.optional ||
            this.path() === this.model.primaryKey // primary key is usually auto-generated
        ) {
            return node.nullableAndOptional.call(null, ...args)
        } else return node.call(null, ...args)
    }

    /**
     * Helper to get adonis validator schema node for this property
     */
    public getSchemaType() {
        let type = this.type()

        if (type === 'reference' && this.relation) {
            const prop = new Property(
                this.relation.relatedModel(),
                this.relation.localKey,
                this.validator
            )

            type = prop.type()
        }

        if (this.columnOptions.enum) {
            return this.withNullable(
                this.validator.schema.enum,
                this.availableValues()!
            )
        } else if (this.isAttachment) {
            return this.withNullable(
                this.validator.schema.file,
                this.attachmentOptions
            )
        }

        switch (type) {
            case 'uuid':
                return this.withNullable(this.validator.schema.string, {}, [
                    this.validator.rules.uuid({ version: 'all' }),
                ])
            case 'boolean':
                return this.withNullable(this.validator.schema.boolean)
            case 'date':
                return this.withNullable(this.validator.schema.date, {
                    format: 'yyyy-MM-dd',
                })
            case 'datetime':
                return this.withNullable(this.validator.schema.date)
            case 'float':
            case 'number':
                return this.withNullable(this.validator.schema.number)
            case 'key-value':
            case 'mixed':
                return this.withNullable(
                    this.validator.schema.object
                ).anyMembers()
            case 'password':
            case 'currency':
            case 'richtext':
            case 'string':
            case 'textarea':
            case 'phone':
            default:
                return this.withNullable(this.validator.schema.string)
        }
    }

    /**
     * Helper function to serialize this property for a given row.
     * If serialize method is defined then it is used.
     * If value is DateTime then it is converted to ISO format
     * if value is enum then a corresponding string to that enum is generated
     * If value is attachment then url is returned for that attachment
     * otherwise, value itself is returned
     */
    public async serialize(row: LucidRow) {
        let value = row[this.path()]

        if (this.columnOptions.serialize) {
            return await this.columnOptions.serialize(value, this.path(), row)
        }

        if (value === null || value === undefined) {
            return value
        }

        if (DateTime.isDateTime(value)) {
            return this.type() === 'date' ? value.toISODate() : value.toISO()
        }

        if (this.columnOptions.enum) {
            value = getEnumValue(this.columnOptions.enum, value)

            return typeof value === 'string' ? value.toLowerCase() : value
        }

        if (this.isAttachment) {
            return value.url
        }

        return value
    }
}
