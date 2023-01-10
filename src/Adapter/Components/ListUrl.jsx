import _React from 'react'

/**
 * Component to display a url on list page
 */
export default function ListUrl(props) {
    const { property, record } = props

    const value = record?.params[property.path]

    if (typeof value === 'undefined' || !value) {
        return null
    }

    return (
        <a href={value} target="_blank">
            {value.substring(0, 70)}
            {value.length > 70 && '...'}
        </a>
    )
}
