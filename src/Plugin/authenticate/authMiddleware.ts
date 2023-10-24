export function AuthMiddleWare(loginPath: string) {
    return async (ctx: any, next: any) => {
        if (!ctx.session || !ctx.session.get('adminUser')) {
            return ctx.response.redirect(loginPath)
        }

        return next()
    }
}
