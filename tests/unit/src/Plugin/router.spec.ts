import { Router } from '../../../../src/Plugin/router'
import { test } from '@japa/runner'
import AdminJS, { RouterType } from 'adminjs'
import httpMocks from 'node-mocks-http'
import sinon from 'sinon'

import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

test.group('Router | createRouteHandler', (group) => {
    let ctx: HttpContextContract
    const route: RouterType['routes'][number] = {
        method: 'GET',
        path: '/',
        Controller: class {
            public admin: AdminJS

            constructor({ admin }: { admin: AdminJS }) {
                this.admin = admin
            }

            public test() {}
        },
        contentType: 'text/html',
        action: 'test',
    }
    let admin: AdminJS

    group.each.setup(() => {
        ctx = group.application.container.use('Adonis/Core/HttpContext').create(
            '/',
            {},
            httpMocks.createRequest({
                method: 'GET',
            })
        )
        admin = new AdminJS()
    })

    group.each.teardown(() => {
        sinon.restore()
    })

    test('controller is called and adequate response is sent', async ({
        assert,
        application,
    }) => {
        const router = application.container.make(Router, [
            admin,
            {
                enabled: true,
            },
        ])
        const actionStub = sinon
            .stub(route.Controller.prototype, 'test')
            .returns('Sample HTML Text')
        const responseHeaderSpy = sinon.spy(ctx.response, 'header')
        const responseSendSpy = sinon.spy(ctx.response, 'send')

        const handler = router.createRouteHandler(route)

        assert.isFunction(handler)

        await handler(ctx)

        assert.isTrue(actionStub.calledOnce)
        assert.isTrue(
            responseHeaderSpy.calledWith('content-type', route.contentType)
        )
        assert.isTrue(responseSendSpy.calledOnceWith('Sample HTML Text'))
    })
})

test.group('Router | createAssetHandler', (group) => {
    let ctx: HttpContextContract
    const asset: RouterType['assets'][number] = {
        path: '/',
        src: 'abc.txt',
    }
    let admin: AdminJS

    group.each.setup(() => {
        ctx = group.application.container
            .use('Adonis/Core/HttpContext')
            .create('/', {})
        admin = new AdminJS()
    })

    group.each.teardown(() => {
        sinon.restore()
    })

    test('controller is called and file is sent', async ({
        assert,
        application,
    }) => {
        const spy = sinon.spy(ctx.response, 'download')
        const router = application.container.make(Router, [
            admin,
            {
                enabled: true,
            },
        ])

        const handler = router.createAssetHandler(asset)

        assert.isFunction(handler)

        await handler(ctx)

        assert.isTrue(spy.calledOnceWith(asset.src))
    })
})

test.group('Router | buildRoutes', (group) => {
    group.each.teardown(() => {
        sinon.restore()
    })

    test('routes are not registered if config is not enabled', ({
        assert,
        application,
    }) => {
        const Route = application.container.use('Adonis/Core/Route')
        const admin = new AdminJS()
        const router = application.container.make(Router, [
            admin,
            {
                enabled: false,
            },
        ])

        const groupStub = sinon.stub(Route, 'group')

        router.buildRoutes()

        assert.isFalse(groupStub.called)
    })

    test('all the routes are successfully registered if config is enabled', ({
        assert,
        application,
    }) => {
        const Route = application.container.use('Adonis/Core/Route')
        const admin = new AdminJS()

        // TODO: find a better solution to this
        const middlewareStub = sinon.stub()
        const prefixStub = sinon.stub().returns({
            middleware: middlewareStub,
        })
        const groupStub = sinon.stub(Route, 'group').returns({
            prefix: prefixStub,
            middleware: middlewareStub,
        } as any)
        const config = {
            enabled: true,
            routePrefix: '/admin123',
            middlewares: ['abc123'],
        }
        const router = application.container.make(Router, [admin, config])

        router.buildRoutes()

        assert.isTrue(groupStub.calledOnce)
        assert.isTrue(prefixStub.calledOnceWith(config.routePrefix))
        assert.isTrue(middlewareStub.calledOnceWith(config.middlewares))

        const methodStub = sinon.stub()
        ;(['get', 'put', 'post', 'patch', 'delete'] as const).forEach(
            (method) => {
                sinon.replace(Route, method, methodStub)
            }
        )

        // call the callback provided to the group method
        groupStub.args[0][0]()

        assert.isTrue(methodStub.called)
    })
})
