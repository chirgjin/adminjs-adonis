import { AdminConfig } from '@ioc:Adonis/Addons/AdminJS'

export const config: AdminConfig = {
    /**
     * Plugin refers to the 'routing' part of AdminJS.
     * It handles on which route your admin panel is present.
     * You can also provide middlewares to it for authentication.
     *
     * If you disable plugin then you'll have to manually handle the routing
     */
    plugin: {
        /**
         * Whether to enable plugin or not
         */
        enabled: true,
        /**
         * Base route on which your admin panel resides.
         */
        routePrefix: '/admin',
        /**
         * Middlewares which are applied on all the routes of admin panel
         */
        middlewares: [],
    },
    /**
     * Adapter refers to the database interaction part of AdminJS
     * It handles how AdminJS interacts with lucid & your models.
     *
     * If you disable adapter then you'll have to manually create & register resources
     */
    adapter: {
        /**
         * Whether to enable adapter or not
         */
        enabled: true,

        /**
         * Optionally, you can provide a function which returns list of models to register with AdminJS.
         * By Default, all your models inside `App/Models` namespace are loaded recursively
         */
        // models: () => import('App/Models'),
    },

    /**
     * Optionally, you can also provide custom AdminJS configuration which will be auto applied.
     * You can also provide a function which imports the config (for cleaner code & more flexibility)
     */
    // adminjs: {},
    // If you have your config as a default export at 'app/AdminJS/config.ts':
    // adminjs: () => import('App/AdminJS/config').then((data) => data.default),
}

export default config
