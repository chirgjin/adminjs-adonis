import { getAdminColumnOptions } from '../../../../src/Adapter/helpers'
import { test } from '@japa/runner'

test.group('helpers | getAdminColumnOptions', () => {
    test('defaults are applied correctly to admin column options', ({
        assert,
        models,
    }) => {
        const User = models.User
        class MyUser extends User {}
        MyUser.$adminColumnOptions = {
            username: {
                visible: false,
                editable: false,
                name: 'test',
            },
        }

        const options = getAdminColumnOptions(MyUser, 'username')

        assert.isObject(options)
        assert.deepEqual(options, {
            name: 'test',
            position: 1,
            type: undefined,
            visible: false,
            editable: false,
            unique: false,
            enum: undefined,
            sortable: false,
            optional: false,
        })
    })
})
