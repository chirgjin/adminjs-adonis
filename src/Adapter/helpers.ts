import type { AdminColumnOptions } from '@ioc:Adonis/Addons/AdminJS'
import type { LucidModel } from '@ioc:Adonis/Lucid/Orm'

/**
 * Helper function to get admin column options for given model & column.
 *
 * Adds default values to the options not provided by the user
 */
export function getAdminColumnOptions(model: LucidModel, columnKey: string) {
    const providedOptions =
        model.$adminColumnOptions && model.$adminColumnOptions[columnKey]
    const columnOptions = model.$getColumn(columnKey)

    if (!columnOptions) {
        throw new Error(`${model.name} doesn't have ${columnKey} column!`)
    }

    return {
        name: providedOptions?.name ?? columnOptions.columnName,
        position: providedOptions?.position ?? 1,
        type: providedOptions?.type || columnOptions.meta?.type,
        visible: providedOptions?.visible ?? true,
        editable: providedOptions?.editable ?? !columnOptions.isPrimary,
        unique: providedOptions?.unique ?? columnOptions.isPrimary,
        enum: providedOptions?.enum,
        sortable: providedOptions?.sortable || false,
        optional:
            providedOptions?.optional ??
            (columnOptions.meta?.autoCreate ||
                columnOptions.meta?.autoUpdate || // if autoCreate/autoUpdate is true then this is optional
                false),
        serialize: providedOptions?.serialize,
    } as AdminColumnOptions
}
