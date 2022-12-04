import AdminJS, { Router as AdminRouter, RouterType } from 'adminjs'

import type { RouterConfig } from '@ioc:Adonis/Addons/AdminJS'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import type { RouterContract } from '@ioc:Adonis/Core/Route'

/**
 * Helper function to create handler for a given adminjs route
 */
export function createRouteHandler(
    admin: AdminJS,
    route: RouterType['routes'][number]
) {
    return async (ctx: HttpContextContract) => {
        const controller = new route.Controller(
            {
                admin,
            },
            (ctx as any).auth?.user // if auth plugin is installed then get user from it
        )

        const html = await controller[route.action](
            {
                ...ctx.request,
                params: ctx.params,
                query: ctx.request.qs(),
                payload: {
                    ...ctx.request.body(),
                    ...ctx.request.allFiles(),
                },
                method: ctx.request.method().toLowerCase(),
            },
            ctx.response
        )

        if (route.contentType) {
            ctx.response.header('content-type', route.contentType)
        }

        return ctx.response.send(html)
    }
}

/**
 * Helper function to create handler to serve a given asset
 */
export function createAssetHandler(asset: RouterType['assets'][number]) {
    return ({ response }: HttpContextContract) => {
        return response.download(asset.src)
    }
}

/**
 * Helper function to build routes for an adminjs instance
 */
export function buildRoutes(
    admin: AdminJS,
    config: RouterConfig,
    Route: RouterContract
) {
    if (!config.enabled) {
        return
    }

    Route.group(() => {
        AdminRouter.assets.forEach((asset) => {
            Route.get(asset.path, createAssetHandler(asset))
        })

        AdminRouter.routes.forEach((route) => {
            Route[route.method.toLowerCase()](
                route.path.replace(/\{/g, ':').replace(/\}/g, ''),
                createRouteHandler(admin, route)
            )
        })
    })
        .prefix(config.routePrefix || '/')
        .middleware(config.middlewares || [])
}
