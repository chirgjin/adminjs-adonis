declare module '@ioc:Adonis/Addons/AdminJS' {
    import AdminJS, { RouterType } from 'adminjs'
    import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
    import type { RouterContract } from '@ioc:Adonis/Core/Route'

    /**
     * Config for AdminJS router plugin
     * It handles on which route your admin panel is present.
     * You can also provide middlewares to it for authentication.
     *
     * If you disable plugin then you'll have to manually handle the routing
     */
    export type PluginConfig =
        | {
              /**
               * Whether to enable plugin or not
               */
              enabled: false
          }
        | {
              /**
               * Whether to enable plugin or not
               */
              enabled: true
              /**
               * Base route on which your admin panel resides.
               */
              routePrefix?: string
              /**
               * Middlewares which are applied on all the routes of admin panel
               */
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
