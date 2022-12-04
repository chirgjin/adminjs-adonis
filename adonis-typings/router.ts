declare module '@ioc:Adonis/Addons/AdminJS' {
    export type RouterConfig =
        | {
              enabled: false
          }
        | {
              enabled: true
              routePrefix?: string
              middlewares?: string[]
          }
}
