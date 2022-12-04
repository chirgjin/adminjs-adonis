import { getModels } from '.'

import { ApplicationContract } from '@ioc:Adonis/Core/Application'

declare module '@japa/runner' {
    // eslint-disable-next-line no-unused-vars
    interface TestContext {
        application: ApplicationContract
        models: ReturnType<typeof getModels>
    }

    // eslint-disable-next-line no-unused-vars
    interface Group {
        application: ApplicationContract
        models: ReturnType<typeof getModels>
    }
}
