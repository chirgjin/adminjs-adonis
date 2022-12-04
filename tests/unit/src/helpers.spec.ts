import { enumKeys, enumValues, getEnumValue } from '../../../src/helpers'
import { test } from '@japa/runner'

test.group('Helpers | enumKeys', () => {
    test('returns correct keys for an enum with only numbers', ({ assert }) => {
        enum MyEnum {
            A = 1,
            B = 2,
            C = 3,
        }

        const keys = enumKeys(MyEnum)

        assert.isArray(keys)
        assert.deepEqual(keys, ['a', 'b', 'c'])
    })

    test('returns correct keys for an enum with only strings', ({ assert }) => {
        enum MyEnum {
            A = 'a1',
            B = 'b2',
            C = 'c3',
        }

        const keys = enumKeys(MyEnum)

        assert.isArray(keys)
        assert.deepEqual(keys, ['a', 'b', 'c'])
    })

    test('returns correct keys for an enum with both strings & numbers', ({
        assert,
    }) => {
        enum MyEnum {
            A = 'a',
            B = 'b',
            C = 3,
        }

        const keys = enumKeys(MyEnum)

        assert.isArray(keys)
        assert.deepEqual(keys, ['a', 'b', 'c'])
    })
})

test.group('Helpers | enumValues', () => {
    test('returns correct values for an enum with only numbers', ({
        assert,
    }) => {
        enum MyEnum {
            A = 1,
            B = 2,
            C = 3,
        }

        const values = enumValues(MyEnum)

        assert.isArray(values)
        assert.deepEqual(values, [1, 2, 3])
    })

    test('returns correct values for an enum with only strings', ({
        assert,
    }) => {
        enum MyEnum {
            A = 'a1',
            B = 'b2',
            C = 'c3',
        }

        const values = enumValues(MyEnum)

        assert.isArray(values)
        assert.deepEqual(values, ['a1', 'b2', 'c3'])
    })

    test('returns correct values for an enum with both strings & numbers', ({
        assert,
    }) => {
        enum MyEnum {
            A = 'a',
            B = 'b',
            C = 3,
        }

        const values = enumValues(MyEnum)

        assert.isArray(values)
        assert.deepEqual(values, ['a', 'b', 3])
    })
})

test.group('Helpers | getEnumValue', () => {
    test('returns correct value for an enum with only numbers', ({
        assert,
    }) => {
        enum MyEnum {
            A = 1,
            B = 2,
            C = 3,
        }

        assert.deepEqual(getEnumValue(MyEnum, 'A'), 1)
        assert.deepEqual(getEnumValue(MyEnum, 1), 'A')
    })

    test('returns correct value for an enum with only strings', ({
        assert,
    }) => {
        enum MyEnum {
            A = 'a1',
            B = 'b2',
            C = 'c3',
        }

        assert.deepEqual(getEnumValue(MyEnum, 'A'), 'a1')
        assert.deepEqual(getEnumValue(MyEnum, 'a1'), 'A')
    })

    test('returns correct values for an enum with both strings & numbers', ({
        assert,
    }) => {
        enum MyEnum {
            A = 'a',
            B = 'b',
            C = 3,
        }

        assert.deepEqual(getEnumValue(MyEnum, 'A'), 'a')
        assert.deepEqual(getEnumValue(MyEnum, 'C'), 3)
        assert.deepEqual(getEnumValue(MyEnum, 3), 'C')
    })
})
