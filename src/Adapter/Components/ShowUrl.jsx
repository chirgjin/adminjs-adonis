import { ValueGroup } from '@adminjs/design-system'
import _React from 'react'

import ListUrl from './ListUrl'

/**
 * Component to display url on 'show' page
 * Internally uses {@link ListUrl} component
 */
export default function ShowUrl(props) {
    const { property } = props

    return (
        <ValueGroup label={property.label}>
            <ListUrl {...props} />
        </ValueGroup>
    )
}
