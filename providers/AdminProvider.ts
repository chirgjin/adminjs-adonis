import type { Router } from '../src/Plugin'
import AdminJS, { AdminJSOptions } from 'adminjs'

import { AdminConfig } from '@ioc:Adonis/Addons/AdminJS'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'

export default class AdminProvider {
    constructor(protected app: ApplicationContract) {}

    private extractModels(list: any[] | Record<any, any>) {
        const { BaseModel } = this.app.container.use('Adonis/Lucid/Orm')

        return Object.values(list).reduce(
            (models: Set<typeof BaseModel>, model) => {
                if (
                    typeof model === 'function' &&
                    model.prototype instanceof BaseModel
                ) {
                    models.add(model)
                } else if (typeof model === 'object' && model) {
                    this.extractModels(model).forEach((value) =>
                        models.add(value)
                    )
                }

                return models
            },
            new Set()
        ) as Set<typeof BaseModel>
    }

    private loadModels() {
        const { requireAll } = this.app.container.use('Adonis/Core/Helpers')

        return Array.from(
            this.extractModels(
                requireAll(
                    this.app.makePath(
                        this.app.resolveNamespaceDirectory('models') ||
                            'app/Models'
                    )
                )!
            )
        )
    }

    public register() {
        // Register your own bindings

        let admin: AdminJS | undefined

        this.app.container.withBindings(
            ['Adonis/Core/Validator', 'Adonis/Lucid/Orm', 'Adonis/Core/Config'],
            async (_, __, Config) => {
                this.app.container.bind('Adonis/Addons/AdminJS', () => ({
                    ...require('../src/Adapter'),
                    ...require('../src/Plugin'),
                    adminJS: admin,
                }))

                const config: AdminConfig = Config.get('adminjs')

                if (!config.plugin.enabled && !config.adapter.enabled) {
                    return
                }

                let options: AdminJSOptions

                if (typeof config.adminjs === 'function') {
                    options = await config.adminjs()
                } else {
                    options = config.adminjs || {}
                }

                if (config.adapter.enabled) {
                    const { Database, Resource } = require('../src/Adapter')

                    AdminJS.registerAdapter({
                        Database,
                        Resource,
                    })

                    const models = await (
                        config.adapter.models || this.loadModels.bind(this)
                    )()

                    if (!options.resources) {
                        options.resources = models
                    } else if (config.adapter.models) {
                        throw new Error(
                            `You cannot pass both 'adapter.models' and 'adminjs.resources'`
                        )
                    }

                    if (!options.databases) {
                        options.databases = ['lucid']
                    }

                    if (!options.componentLoader) {
                        options.componentLoader =
                            require('../src/Adapter/Components').componentLoader
                    }
                }

                if (config.plugin.enabled) {
                    if (config.plugin.routePrefix && options.rootPath) {
                        throw new Error(
                            `You can't provide both 'adminjs.rootPath' and 'plugin.routePrefix'!`
                        )
                    }

                    options.rootPath =
                        options.rootPath || config.plugin.routePrefix
                }

                admin = new AdminJS(options)

                const router: Router = this.app.container.make(
                    require('../src/Plugin').Router,
                    [admin, config.plugin]
                )

                if (config.plugin.auth.enabled) {
                    router.buildAuthenticatedRoutes()
                } else {
                    router.buildRoutes()
                }
            }
        )
    }

    public async boot() {
        // IoC container is ready
    }

    public async ready() {
        // App is ready
    }

    public async shutdown() {
        // Cleanup, since app is going down
    }
}
