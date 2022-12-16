declare module '@ioc:Adonis/Addons/AdminJS' {
    import { AdminJSOptions } from 'adminjs'

    export type AdminConfig = {
        adapter: AdapterConfig
        plugin: PluginConfig

        adminjs?: AdminJSOptions | (() => Promise<AdminJSOptions>)
    }
}
