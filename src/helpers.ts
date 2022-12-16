import { ValueOf } from '@ioc:Adonis/Addons/AdminJS'

// When the value of an enum key is a number then a reverse mapping is created i.e
// if enum has MY_VALUE=1, then 1=MY_VALUE will also exist but if enum has MY_VALUE='L'
// then L=MY_VALUE won't exist. So, we can safely assume that if a value is number
// then it is definitely a value but if a value is string & does have a back-mapping
// then it is a key

/**
 * Helper function to get list of keys of enum with correct type
 */
export function enumKeys<T extends Record<string, any>>(options: T) {
    const keys = Object.keys(options)

    return keys
        .filter((key) => {
            return typeof options[options[key]] !== 'number'
        })
        .map((key) => key.toLowerCase()) as Lowercase<keyof T & string>[]
}

/**
 * Helper function to get list of values of enum with correct type
 */
export function enumValues<T extends Record<string, any>>(options: T) {
    const allValues = Object.values(options)

    return allValues.filter((value) => {
        return typeof value === 'number' || !(value in options)
    }) as ValueOf<T>[]
}

/**
 * Helper function to get value from a key of enum and vice-versa
 */
export function getEnumValue<
    T extends Record<string, any>,
    Key extends string | number
>(
    options: T,
    key: Key
): Uppercase<Key & string> extends Uppercase<keyof T & string>
    ? T[Uppercase<Key & string>]
    : Key extends ValueOf<T>
    ? string
    : never {
    const uppercaseKey = String(key).toUpperCase()

    for (const enumKey in options) {
        if (
            enumKey === uppercaseKey ||
            String(enumKey).toUpperCase() === uppercaseKey
        ) {
            return options[enumKey]
        } else if (
            // checking against the values as well because string values of an enum
            // don't have them back-mapped as keys
            options[enumKey] === uppercaseKey ||
            String(options[enumKey]).toUpperCase() === uppercaseKey
        ) {
            return typeof options[options[enumKey]] === 'number'
                ? options[options[enumKey]]
                : (enumKey as any)
        }
    }

    throw new Error(
        `Key ${uppercaseKey} not found in ${JSON.stringify(options)}`
    )
}
