import AdminJS from 'adminjs'

import type { PluginConfig } from '@ioc:Adonis/Addons/AdminJS'
import type { RouterContract } from '@ioc:Adonis/Core/Route'

const getLogoutPath = (config: PluginConfig, admin: AdminJS) => {
    const rootPath = config.enabled
        ? config.routePrefix!
        : admin.options.rootPath
    const logoutPath = config.auth.enabled
        ? config.auth.logoutPath!
        : admin.options.logoutPath

    const normalizedLogoutPath = logoutPath.replace(rootPath, '')

    return normalizedLogoutPath.startsWith('/')
        ? normalizedLogoutPath
        : `/${normalizedLogoutPath}`
}

export const withLogout = (
    router: RouterContract,
    config: PluginConfig,
    admin: AdminJS
): void => {
    const logoutPath = getLogoutPath(config, admin)
    router.get(logoutPath, async (ctx) => {
        ;(ctx as any).session.clear()

        return ctx.response.redirect(
            config.routePrefix || admin.options.rootPath
        )
    })
}
