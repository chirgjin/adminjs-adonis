import { adminColumn } from '../../../../src/Adapter/decorators'
import { test } from '@japa/runner'

import { AdminColumnOptions } from '@ioc:Adonis/Addons/AdminJS'

test.group('decorator | adminColumn', () => {
    test('adminColumnOptions are defined when using adminColumn', ({
        assert,
        models,
    }) => {
        const columnOptions: Partial<AdminColumnOptions> = {
            visible: false,
            editable: false,
            name: 'test',
        }

        const User = models.User
        class MyUser extends User {
            @adminColumn(columnOptions)
            public username: string
        }

        assert.notExists(User.$adminColumnOptions)
        assert.isObject(MyUser.$adminColumnOptions)
        assert.isObject(MyUser.$adminColumnOptions!.username)
        assert.deepEqual(MyUser.$adminColumnOptions!.username, columnOptions)
    })
})
