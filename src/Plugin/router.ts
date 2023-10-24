import { inject } from '@adonisjs/core/build/standalone'
import AdminJS, { Router as AdminRouter, RouterType } from 'adminjs'

import type { PluginConfig } from '@ioc:Adonis/Addons/AdminJS'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import type { RouterContract } from '@ioc:Adonis/Core/Route'

import { AuthMiddleWare } from './authenticate/authMiddleware'
import { withLogin } from './authenticate/login'
import { withLogout } from './authenticate/logout'

@inject([null, null, 'Adonis/Core/Route'])
export class Router {
    constructor(
        protected admin: AdminJS,
        protected config: PluginConfig,
        private route: RouterContract
    ) {}

    /**
     * Helper function to create handler for a given adminjs route
     */
    public createRouteHandler(route: RouterType['routes'][number]) {
        return async (ctx: HttpContextContract) => {
            const user = (ctx as any).session.get('adminUser') // if session plugin is installed then get user from it
            const controller = new route.Controller(
                {
                    admin: this.admin,
                },
                user
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
    public createAssetHandler(asset: RouterType['assets'][number]) {
        return ({ response }: HttpContextContract) => {
            return response.download(asset.src)
        }
    }

    /**
     * Helper function to build routes for an adminjs instance
     */
    public buildRoutes() {
        if (!this.config.enabled) {
            return
        }

        this.route
            .group(() => {
                AdminRouter.assets.forEach((asset) => {
                    this.route.get(asset.path, this.createAssetHandler(asset))
                })

                AdminRouter.routes.forEach((route) => {
                    this.route[route.method.toLowerCase()](
                        route.path.replace(/\{/g, ':').replace(/\}/g, ''),
                        this.createRouteHandler(route)
                    )
                })
            })
            .prefix(this.config.routePrefix || '/')
            .middleware(this.config.middlewares || [])
    }

    public buildAuthenticatedRoutes() {
        if (!this.config.enabled) {
            return
        }

        this.route
            .group(() => {
                AdminRouter.assets.forEach((asset) => {
                    this.route.get(asset.path, this.createAssetHandler(asset))
                })

                AdminRouter.routes.forEach((route) => {
                    this.route[route.method.toLowerCase()](
                        route.path.replace(/\{/g, ':').replace(/\}/g, ''),
                        this.createRouteHandler(route)
                    ).middleware([AuthMiddleWare(this.config.auth.loginPath || this.admin.options.loginPath)])
                })

                withLogin(this.route, this.config, this.admin)

                withLogout(this.route, this.config, this.admin)
            })
            .prefix(this.config.routePrefix || '/')
            .middleware(this.config.middlewares || [])
    }
}
