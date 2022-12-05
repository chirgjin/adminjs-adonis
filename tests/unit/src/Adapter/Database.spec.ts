import { Database } from '../../../../src/Adapter/Database'
import { test } from '@japa/runner'

test.group('Database | isAdapterFor', () => {
    test('should return true for lucid', ({ assert }) => {
        assert.isTrue(Database.isAdapterFor('lucid'))
    })
    test('should return false for anything other than lucid', ({ assert }) => {
        assert.isFalse(Database.isAdapterFor('lucid1'))
        assert.isFalse(Database.isAdapterFor('abc'))
    })
})
