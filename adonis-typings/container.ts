/* eslint-disable no-unused-vars */
declare module '@ioc:Adonis/Core/Application' {
    import * as adminJS from '@ioc:Adonis/Addons/AdminJS'

    interface ContainerBindings {
        'Adonis/Addons/AdminJS': typeof adminJS
    }
}
