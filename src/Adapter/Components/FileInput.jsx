import { Input, FormMessage, FormGroup } from '@adminjs/design-system'
import { PropertyLabel } from 'adminjs/src/frontend/components/property-type/utils/property-label'
import _React from 'react'

/**
 * Input component for file type properties.
 * This is used on edit page only.
 */
export default function FileInput(props) {
    const { property, record, onChange } = props
    const error = record.errors?.[property.path]

    return (
        <>
            <FormGroup error={Boolean(error)}>
                <PropertyLabel property={property} />
                <Input
                    id={property.path}
                    name={property.name}
                    required={
                        typeof record.params[property.path] === 'string'
                            ? false
                            : property.isRequired
                    }
                    disabled={property.isDisabled}
                    onChange={(e) => {
                        const files = e.target.files

                        if (files.length < 1) {
                            onChange(property.path, '') // empty string is treated as null
                        } else {
                            onChange(property.path, files[0])
                        }
                    }}
                    type="file"
                    {...property.props}
                />
                {typeof record.params[property.path] === 'string' &&
                    record.params[property.path] && (
                        <a href={record.params[property.path]} target="_blank">
                            {record.params[property.path].substring(0, 70)}
                            {record.params[property.path].length > 70
                                ? '....'
                                : ''}
                        </a>
                    )}
                <FormMessage>{error && error.message}</FormMessage>
            </FormGroup>
        </>
    )
}
