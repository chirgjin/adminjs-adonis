import { Property } from '.'
import { BaseRecord, BaseResource, ParamsType } from 'adminjs'

/**
 * Record class which corresponds to 1 LucidRow.
 */
export class LucidRecord extends BaseRecord {
    constructor(params: ParamsType, resource: BaseResource) {
        super({}, resource)

        this.storeParams(params)
    }

    /**
     * Helper function to set value on this record.
     * If property is attachment then we can't use flatten because it has a circular reference
     */
    public set(propertyPath: string, value: any) {
        const property = this.resource.property(propertyPath) as Property

        if (property.isAttachment) {
            this.params[propertyPath] = value
        } else {
            super.set(propertyPath, value)
        }

        return this.params
    }

    /**
     * Helper function to store values on this record in a flattened format.
     * We use this.set here so that file is handled properly.
     */
    public storeParams(payloadData?: object | undefined): void {
        if (!payloadData) {
            return super.storeParams(payloadData)
        }

        Object.keys(payloadData).forEach((key) => {
            this.set(key, payloadData[key])
        })
    }
}
