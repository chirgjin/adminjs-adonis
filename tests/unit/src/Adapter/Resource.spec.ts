import { Resource } from '../../../../src/Adapter/Resource'
import { test } from '@japa/runner'
import { Filter, ValidationError } from 'adminjs'
import { DateTime } from 'luxon'
import sinon from 'sinon'

test.group('Resource | properties', (group) => {
    group.each.teardown(() => sinon.restore())

    test('should return correct list of properties', ({
        assert,
        application,
        models,
    }) => {
        const resource = application.container.make(Resource, [models.User])
        const stub = sinon.stub(resource, 'property').returns(null)

        const properties = resource.properties()

        const fields = ['id', 'username', 'password', 'createdAt']

        assert.isArray(properties)
        assert.lengthOf(properties, fields.length)
        // we returned null in our stub, so array should contain only null values
        assert.deepEqual(
            properties,
            fields.map(() => null)
        )

        fields.forEach((field) => assert.isTrue(stub.calledWith(field)))
    })
})

test.group('Resource | property', (group) => {
    let propertyImport: typeof import('../../../../src/Adapter/Property')

    group.each.teardown(() => sinon.restore())
    group.setup(async () => {
        propertyImport = await import('../../../../src/Adapter/Property')
    })

    test('should return correct property', ({
        assert,
        application,
        models,
    }) => {
        const resource = application.container.make(Resource, [models.User])
        const stub = sinon.stub(propertyImport, 'Property')

        assert.isNotNull(resource.property('id')) // should return a functionStub
        assert.isTrue(stub.calledWithNew())
    })

    test('should return null when provided with invalid path', ({
        assert,
        application,
        models,
    }) => {
        const resource = application.container.make(Resource, [models.User])
        const stub = sinon.stub(propertyImport, 'Property').returns(-1)

        assert.strictEqual(resource.property('abc'), null)
        assert.isFalse(stub.called)
    })
})

test.group('Resource | applyFilter', (group) => {
    let propertyImport: typeof import('../../../../src/Adapter/Property')

    group.each.teardown(() => sinon.restore())
    group.setup(async () => {
        propertyImport = await import('../../../../src/Adapter/Property')
    })

    test('applies filters correctly to query', ({
        assert,
        application,
        models,
    }) => {
        const { Property } = propertyImport
        const UserModel = models.User
        const { column } = application.container.use('Adonis/Lucid/Orm')

        class User extends UserModel {
            @column()
            public uuid: string

            @column()
            public email: string
        }
        class FakeProperty extends Property {
            public type() {
                switch (this.columnKey) {
                    case 'id':
                        return 'number'
                    case 'username':
                    case 'email':
                        return 'string'
                    case 'createdAt':
                        return 'datetime'
                    case 'uuid':
                        return 'uuid'
                }

                throw new Error(
                    `Property.type shouldn't be called for ${this.columnKey}`
                )
            }

            public isId(): boolean {
                return this.columnKey === 'email'
            }
        }

        sinon.replace(propertyImport, 'Property', FakeProperty)
        const resource = application.container.make(Resource, [User])
        const query = models.User.query()
        const filter = new Filter(
            {
                'id': '1',
                'username': 'test',
                'createdAt~~from': 'from',
                'createdAt~~to': 'to',
                'email': 'test@test.com',
                'uuid': 'c101a94e-6993-42de-b0f0-1a8c1e777aae',
            },
            resource
        )

        const whereStub = sinon.stub(query, 'where')
        const whereBetweenStub = sinon.stub(query, 'whereBetween')
        const whereLikeStub = sinon.stub(query, 'whereLike')

        resource.applyFilter(query, filter)

        assert.isTrue(whereStub.calledWith('id', '1'))
        assert.isTrue(whereStub.calledWith('username', 'test'))
        assert.isTrue(
            whereStub.calledWith('uuid', 'c101a94e-6993-42de-b0f0-1a8c1e777aae')
        )
        assert.isTrue(whereStub.calledThrice)
        assert.isTrue(
            whereBetweenStub.calledOnceWith('createdAt', ['from', 'to'])
        )
        assert.isTrue(whereLikeStub.calledOnceWith('email', '%test@test.com%'))
    })

    test('skips filter on uuid when uuid is malformed', ({
        assert,
        application,
        models,
    }) => {
        const { Property } = propertyImport
        const UserModel = models.User
        const { column } = application.container.use('Adonis/Lucid/Orm')

        class User extends UserModel {
            @column()
            public uuid: string

            @column()
            public email: string
        }
        class FakeProperty extends Property {
            public type() {
                switch (this.columnKey) {
                    case 'id':
                        return 'number'
                    case 'username':
                    case 'email':
                        return 'string'
                    case 'createdAt':
                        return 'datetime'
                    case 'uuid':
                        return 'uuid'
                }

                throw new Error(
                    `Property.type shouldn't be called for ${this.columnKey}`
                )
            }

            public isId(): boolean {
                return this.columnKey === 'email'
            }
        }

        sinon.replace(propertyImport, 'Property', FakeProperty)
        const resource = application.container.make(Resource, [User])
        const query = models.User.query()
        const filter = new Filter(
            {
                'id': '1',
                'username': 'test',
                'createdAt~~from': 'from',
                'createdAt~~to': 'to',
                'email': 'test@test.com',
                'uuid': 'not-a-valid-uuid',
            },
            resource
        )

        const whereStub = sinon.stub(query, 'where')
        const whereBetweenStub = sinon.stub(query, 'whereBetween')
        const whereLikeStub = sinon.stub(query, 'whereLike')

        resource.applyFilter(query, filter)

        assert.isTrue(whereStub.calledWith('id', '1'))
        assert.isTrue(whereStub.calledWith('username', 'test'))
        assert.isTrue(whereStub.calledTwice)
        assert.isTrue(
            whereBetweenStub.calledOnceWith('createdAt', ['from', 'to'])
        )
        assert.isTrue(whereLikeStub.calledOnceWith('email', '%test@test.com%'))
    })
})

test.group('Resource | count', (group) => {
    group.each.teardown(() => sinon.restore())

    test('count is computed correctly', async ({
        assert,
        application,
        models,
    }) => {
        const resource = application.container.make(Resource, [models.User])
        const ModelQueryBuilder: any = application.container.use(
            'Adonis/Lucid/Database'
        ).ModelQueryBuilder

        const applyFilterStub = sinon
            .stub(resource, 'applyFilter')
            .returnsArg(0)
        const queryCountStub = sinon
            .stub(ModelQueryBuilder.prototype, 'count')
            .returnsThis()
        const firstOrFailStub = sinon
            .stub(ModelQueryBuilder.prototype, 'firstOrFail')
            .returns({
                $extras: {
                    count: 1,
                },
            })

        const filter = new Filter({}, resource)
        const count = await resource.count(filter)

        assert.strictEqual(count, 1)
        assert.isTrue(applyFilterStub.calledOnceWith(sinon.match.any, filter))
        assert.isTrue(queryCountStub.calledOnceWith('*', 'count'))
        assert.isTrue(firstOrFailStub.calledOnce)
    })
})

test.group('Resource | find', (group) => {
    group.each.teardown(() => sinon.restore())

    test('objects are returned correctly', async ({
        assert,
        application,
        models,
    }) => {
        const resource = application.container.make(Resource, [models.User])
        const user = new models.User()
        const ModelQueryBuilder: any = application.container.use(
            'Adonis/Lucid/Database'
        ).ModelQueryBuilder

        const applyFilterStub = sinon
            .stub(resource, 'applyFilter')
            .returnsArg(0)
        const limitStub = sinon
            .stub(ModelQueryBuilder.prototype, 'limit')
            .returnsThis()
        const offsetStub = sinon
            .stub(ModelQueryBuilder.prototype, 'offset')
            .returnsThis()
        const orderByStub = sinon
            .stub(ModelQueryBuilder.prototype, 'orderBy')
            .returnsThis()
        const thenStub = sinon
            .stub(ModelQueryBuilder.prototype, 'exec')
            .returns(Promise.resolve([user]))
        const buildStub = sinon.stub(resource, 'build').returns({
            fake: true,
        })

        const filter = new Filter({}, resource)
        const data = await resource.find(filter, {
            limit: 2,
            offset: 1,
            sort: {
                sortBy: 'username',
                direction: 'asc',
            },
        })

        assert.isArray(data)
        assert.lengthOf(data, 1)
        assert.deepEqual(data, [{ fake: true }])
        assert.isTrue(applyFilterStub.calledOnceWith(sinon.match.any, filter))
        assert.isTrue(limitStub.calledOnceWith(2))
        assert.isTrue(offsetStub.calledOnceWith(1))
        assert.isTrue(orderByStub.calledOnceWith('username', 'asc'))
        assert.isTrue(thenStub.calledOnce)
        assert.isTrue(buildStub.calledOnceWith(user.$attributes))
    })

    test('limit, offset & sortBy are not applied if not passed', async ({
        assert,
        application,
        models,
    }) => {
        const resource = application.container.make(Resource, [models.User])
        const user = new models.User()
        const ModelQueryBuilder: any = application.container.use(
            'Adonis/Lucid/Database'
        ).ModelQueryBuilder

        const applyFilterStub = sinon
            .stub(resource, 'applyFilter')
            .returnsArg(0)
        const limitStub = sinon
            .stub(ModelQueryBuilder.prototype, 'limit')
            .returnsThis()
        const offsetStub = sinon
            .stub(ModelQueryBuilder.prototype, 'offset')
            .returnsThis()
        const orderByStub = sinon
            .stub(ModelQueryBuilder.prototype, 'orderBy')
            .returnsThis()
        const thenStub = sinon
            .stub(ModelQueryBuilder.prototype, 'exec')
            .returns(Promise.resolve([user]))
        const buildStub = sinon.stub(resource, 'build').returns({
            fake: true,
        })

        const filter = new Filter({}, resource)
        const data = await resource.find(filter, {})

        assert.isArray(data)
        assert.lengthOf(data, 1)
        assert.deepEqual(data, [{ fake: true }])
        assert.isTrue(applyFilterStub.calledOnceWith(sinon.match.any, filter))
        assert.isFalse(limitStub.called)
        assert.isFalse(offsetStub.called)
        assert.isFalse(orderByStub.called)
        assert.isTrue(thenStub.calledOnce)
        assert.isTrue(buildStub.calledOnceWith(user.$attributes))
    })
})

test.group('Resource | findOne', (group) => {
    group.each.teardown(() => sinon.restore())

    test('returns correct object if it exists', async ({
        assert,
        application,
        models,
    }) => {
        const resource = application.container.make(Resource, [models.User])
        const user = new models.User()
        const findStub = sinon
            .stub(models.User, 'find')
            .returns(Promise.resolve(user))
        const buildStub = sinon.stub(resource, 'build').returnsArg(0)

        const obj = await resource.findOne('1')

        assert.deepEqual(obj, user.$attributes)
        assert.isTrue(findStub.calledOnceWith('1'))
        assert.isTrue(buildStub.calledOnceWith(user.$attributes))
    })

    test("returns null if object doesn't exist", async ({
        assert,
        application,
        models,
    }) => {
        const resource = application.container.make(Resource, [models.User])
        const findStub = sinon
            .stub(models.User, 'find')
            .returns(Promise.resolve(null))
        const buildStub = sinon.stub(resource, 'build').returnsArg(0)

        const obj = await resource.findOne('1')

        assert.isNull(obj)
        assert.isTrue(findStub.calledOnceWith('1'))
        assert.isFalse(buildStub.called)
    })
})

test.group('Resource | findMany', (group) => {
    group.each.teardown(() => sinon.restore())

    test('returns correct objects', async ({ assert, application, models }) => {
        const resource = application.container.make(Resource, [models.User])
        const user = new models.User()
        const ModelQueryBuilder: any = application.container.use(
            'Adonis/Lucid/Database'
        ).ModelQueryBuilder

        const whereInStub = sinon
            .stub(ModelQueryBuilder.prototype, 'whereIn')
            .returnsThis()
        const thenStub = sinon
            .stub(ModelQueryBuilder.prototype, 'exec')
            .returns(Promise.resolve([user]))
        const buildStub = sinon.stub(resource, 'build').returns({
            fake: true,
        })

        const data = await resource.findMany([1])

        assert.isArray(data)
        assert.deepEqual(data, [{ fake: true }])
        assert.isTrue(whereInStub.calledOnceWith('id', [1]))
        assert.isTrue(thenStub.calledOnce)
        assert.isTrue(buildStub.calledOnceWith(user.$attributes))
    })
})

test.group('Resource | sanitizeParams', (group) => {
    group.each.teardown(() => sinon.restore())

    test('sanitizes parameteres correctly', async ({
        assert,
        application,
        models,
    }) => {
        const { column } = application.container.use('Adonis/Lucid/Orm')
        const UserModel = models.User
        const enumHelpers = await import('../../../../src/helpers')

        enum UserType {
            USER = 1,
            ADMIN = 2,
        }
        class User extends UserModel {
            @column()
            public type: string

            @column.date()
            public birthDate: DateTime
        }

        User.$adminColumnOptions = {
            type: {
                enum: UserType,
            },
        }
        const resource = application.container.make(Resource, [User])
        const params = {
            id: 1,
            type: 1,
            createdAt: DateTime.local(),
            birthDate: DateTime.local(),
        }

        const enumStub = sinon.stub(enumHelpers, 'getEnumValue')

        enumStub.withArgs(UserType, UserType.ADMIN).returns('ADMIN')
        enumStub.withArgs(UserType, UserType.USER).returns('USER')

        const data = resource.sanitizeParams(params)

        assert.deepEqual(data, {
            id: 1,
            type: 'user',
            createdAt: params.createdAt.toISO(),
            birthDate: params.birthDate.toISODate(),
        })
        assert.isTrue(enumStub.calledOnceWith(UserType, 1))
    })
})

test.group('Resource | validateParams', (group) => {
    let propertyImport: typeof import('../../../../src/Adapter/Property')

    group.each.teardown(() => sinon.restore())
    group.setup(async () => {
        propertyImport = await import('../../../../src/Adapter/Property')
    })

    test('validates parameters correctly', async ({
        assert,
        application,
        models,
    }) => {
        const { Property } = propertyImport
        const { schema } = application.container.use('Adonis/Core/Validator')

        class FakeProperty extends Property {
            public getSchemaType() {
                switch (this.columnKey) {
                    case 'id':
                        return schema.number()
                    case 'createdAt':
                        return schema.date()
                    default:
                        return schema.string()
                }
            }
        }

        sinon.replace(propertyImport, 'Property', FakeProperty)

        const resource = application.container.make(Resource, [models.User])
        const params = {
            id: 1,
            createdAt: DateTime.local().toISO(),
            username: 'hello-world',
            password: 'Hi!',
        }

        const validatedData = await resource.validateParams(params)

        assert.isObject(validatedData)
        assert.strictEqual(validatedData.id, params.id)
        assert.strictEqual(validatedData.username, params.username)
        assert.strictEqual(validatedData.password, params.password)
        assert.isTrue(DateTime.isDateTime(validatedData.createdAt))
        assert.strictEqual(validatedData.createdAt.toISO(), params.createdAt)
    })

    test('throws validation error if validation fails', async ({
        assert,
        application,
        models,
    }) => {
        const { Property } = propertyImport
        const { schema } = application.container.use('Adonis/Core/Validator')

        class FakeProperty extends Property {
            public getSchemaType() {
                switch (this.columnKey) {
                    case 'id':
                        return schema.number()
                    case 'createdAt':
                        return schema.date()
                    default:
                        return schema.string()
                }
            }
        }

        sinon.replace(propertyImport, 'Property', FakeProperty)

        const resource = application.container.make(Resource, [models.User])
        const params = {
            id: 'some-random-string',
            createdAt: 'invalid-date',
            username: null,
        }

        try {
            await resource.validateParams(params)

            throw new Error(`resource.validateParams didn't throw exception!`)
        } catch (e) {
            assert.instanceOf(e, ValidationError)
        }
    })
})

test.group('Resource | create', (group) => {
    group.each.teardown(() => sinon.restore())

    test('Creates object successfully', async ({
        assert,
        models,
        application,
    }) => {
        const resource = application.container.make(Resource, [models.User])
        const user = new models.User()

        const params = {
            id: 1,
            username: 'hello-world',
            password: 'hello!',
        }
        const sanitizedData = {
            ...params,
            createdAt: DateTime.local().toISO(),
        }
        const validateParamsStub = sinon
            .stub(resource, 'validateParams')
            .returns(Promise.resolve(params))
        const createStub = sinon
            .stub(models.User, 'create')
            .returns(Promise.resolve(user))
        const sanitizeStub = sinon
            .stub(resource, 'sanitizeParams')
            .returns(sanitizedData)

        const data = await resource.create(params)

        assert.deepEqual(data, sanitizedData)
        assert.isTrue(validateParamsStub.calledOnceWith(params))
        assert.isTrue(createStub.calledOnceWith(params))
        assert.isTrue(sanitizeStub.calledOnceWith(user.$attributes))
    })
})

test.group('Resource | update', (group) => {
    group.each.teardown(() => sinon.restore())

    test('Updates object successfully', async ({
        assert,
        models,
        application,
    }) => {
        const resource = application.container.make(Resource, [models.User])
        const user = new models.User()

        const params = {
            id: 1,
            username: 'hello-world',
            password: 'hello!',
        }
        const sanitizedData = {
            ...params,
            createdAt: DateTime.local().toISO(),
        }

        const validateParamsStub = sinon
            .stub(resource, 'validateParams')
            .returns(Promise.resolve(params))
        const findOrFailStub = sinon
            .stub(models.User, 'findOrFail')
            .returns(Promise.resolve(user))
        const saveStub = sinon
            .stub(models.User.prototype, 'save')
            .returns(Promise.resolve(user))
        const sanitizeStub = sinon
            .stub(resource, 'sanitizeParams')
            .returns(sanitizedData)

        const data = await resource.update(1, params)

        assert.deepEqual(data, sanitizedData)
        assert.deepEqual(user.$attributes, params)
        assert.isTrue(findOrFailStub.calledOnceWith(1))
        assert.isTrue(validateParamsStub.calledOnceWith(params))
        assert.isTrue(saveStub.calledOnce)
        assert.isTrue(sanitizeStub.calledOnceWith(user.$attributes))
    })
})

test.group('Resource | delete', (group) => {
    group.each.teardown(() => sinon.restore())

    test('Deletes object successfully', async ({
        assert,
        models,
        application,
    }) => {
        const resource = application.container.make(Resource, [models.User])
        const user = new models.User()

        const findStub = sinon
            .stub(models.User, 'find')
            .returns(Promise.resolve(user))
        const deleteStub = sinon
            .stub(models.User.prototype, 'delete')
            .returns(Promise.resolve())

        await resource.delete(1)

        assert.isTrue(findStub.calledOnceWith(1))
        assert.isTrue(deleteStub.calledOnce)
    })
})
