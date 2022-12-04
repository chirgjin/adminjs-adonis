import { assert } from '@japa/assert'
import { runFailedTests } from '@japa/run-failed-tests'
import {
    configure,
    processCliArgs,
    run,
    TestContext,
    Group,
} from '@japa/runner'
import { specReporter } from '@japa/spec-reporter'

import { ApplicationContract } from '@ioc:Adonis/Core/Application'

import { cleanup, createTables, getModels, setupApplication } from './utils'

let app: ApplicationContract

/*
|--------------------------------------------------------------------------
| Configure tests
|--------------------------------------------------------------------------
|
| The configure method accepts the configuration to configure the Japa
| tests runner.
|
| The first method call "processCliArgs" process the command line arguments
| and turns them into a config object. Using this method is not mandatory.
|
| Please consult japa.dev/runner-config for the config docs.
*/
configure({
    ...processCliArgs(process.argv.slice(2)),
    ...{
        files: ['tests/**/*.spec.ts'],
        plugins: [assert(), runFailedTests()],
        reporters: [specReporter()],
        importer: (filePath: string) => import(filePath),
        setup: [
            async () => {
                app = await setupApplication()
                const models = getModels(app)

                await createTables(app)

                TestContext.getter('application', () => app)
                TestContext.getter('models', () => models)

                Group.getter('application', () => app)
                Group.getter('models', () => models)
            },
        ],
        teardown: [
            async () => {
                if (app) {
                    await cleanup(app)
                }
            },
        ],
    },
})

/*
|--------------------------------------------------------------------------
| Run tests
|--------------------------------------------------------------------------
|
| The following "run" method is required to execute all the tests.
|
*/
run()
