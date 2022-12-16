declare module '@ioc:Adonis/Addons/AdminJS' {
    import AdminJS, { RouterType } from 'adminjs'
    import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
    import type { RouterContract } from '@ioc:Adonis/Core/Route'

    /**
     * Config for router plugin
     */
    export type PluginConfig =
        | {
              // if disabled you'll have to manually register the routes
              enabled: false
          }
        | {
              enabled: true
              routePrefix?: string
              middlewares?: string[]
          }

    export class Router {
        protected admin: AdminJS
        protected config: PluginConfig
        private route
        constructor(admin: AdminJS, config: PluginConfig, route: RouterContract)
        /**
         * Helper function to create handler for a given adminjs route
         */
        public createRouteHandler(
            route: RouterType['routes'][number]
        ): (ctx: HttpContextContract) => Promise<void>
        /**
         * Helper function to create handler to serve a given asset
         */
        public createAssetHandler(
            asset: RouterType['assets'][number]
        ): ({ response }: HttpContextContract) => void
        /**
         * Helper function to build routes for an adminjs instance
         */
        public buildRoutes(): void
    }
}
