import AdminJS from 'adminjs'

import type { PluginConfig } from '@ioc:Adonis/Addons/AdminJS'
import type { RouterContract } from '@ioc:Adonis/Core/Route'

const getLoginPath = (config: PluginConfig, admin: AdminJS): string => {
    let { loginPath, rootPath } = admin.options

    if (config.enabled && config.auth.loginPath && config.routePrefix) {
        loginPath = config.auth.loginPath
        rootPath = config.routePrefix
    }

    // since we are inside already namespaced router we have to replace login and logout routes that
    // they don't have rootUrl inside. So changing /admin/login to just /login.
    // but there is a case where user gives / as a root url and /login becomes `login`. We have to
    // fix it by adding / in front of the route
    const normalizedLoginPath = loginPath.replace(rootPath, '')

    return normalizedLoginPath.startsWith('/')
        ? normalizedLoginPath
        : `/${normalizedLoginPath}`
}

class Retry {
    private static retriesContainer: Map<string, Retry> = new Map()
    private lastRetry: Date | undefined
    private retriesCount = 0

    constructor(ip: string) {
        const existing = Retry.retriesContainer.get(ip)

        if (existing) {
            return existing
        }

        Retry.retriesContainer.set(ip, this)
    }

    public canLogin(maxRetries: number, duration: number): boolean {
        if (maxRetries === undefined) {
            return true
        } else if (maxRetries <= 0) {
            return true
        }

        if (
            !this.lastRetry ||
            new Date().getTime() - this.lastRetry.getTime() > duration * 1000
        ) {
            this.lastRetry = new Date()
            this.retriesCount = 1

            return true
        } else {
            this.lastRetry = new Date()
            this.retriesCount++

            return this.retriesCount <= maxRetries
        }
    }
}

export async function withLogin(
    route: RouterContract,
    config: PluginConfig,
    admin: AdminJS
) {
    const loginPath = getLoginPath(config, admin!)

    route.get(loginPath, async (ctx) => {
        if ((ctx as any).session.get('adminUser')) {
            return ctx.response.redirect(
                config.routePrefix || admin.options.rootPath!
            )
        }

        const loginPage = await admin.renderLogin({
            action: admin.options.loginPath,
            errorMessage: null,
        })

        return ctx.response.send(loginPage)
    })

    route.post(loginPath, async (ctx) => {
        if (
            !new Retry(ctx.request.ip()).canLogin(
                config.auth.maxRetries,
                config.auth.duration
            )
        ) {
            const loginPage = await admin.renderLogin({
                action: admin.options.loginPath,
                errorMessage: 'tooManyRequests',
            })

            return ctx.response.send(loginPage)
        }

        const { email, password } = ctx.request.body()

        const user = await Promise.resolve(config.auth.authenticate(email, password))

        if (user) {
            ;(ctx as any).session.put('adminUser', { email, password })

            return ctx.response.redirect(
                config.routePrefix || admin.options.rootPath!
            )
        } else {
            const loginPage = await admin.renderLogin({
                action: admin.options.loginPath,
                errorMessage: 'invalidCredentials',
            })

            return ctx.response.send(loginPage)
        }
    })
}
