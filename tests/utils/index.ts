import { Application } from '@adonisjs/core/build/standalone'
import { Filesystem } from '@poppinss/dev-utils'
import { DateTime } from 'luxon'
import { join, posix, sep } from 'path'
import 'reflect-metadata'

import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import type { BelongsTo, HasMany, LucidModel } from '@ioc:Adonis/Lucid/Orm'

export const fs = new Filesystem(join(__dirname, '__app'))
export type UserModelType = ReturnType<typeof getModels>['User']
export type TodoListModelType = ReturnType<typeof getModels>['TodoList']
export type TodoListItemModelType = ReturnType<typeof getModels>['TodoListItem']

/**
 * Setup application
 */
export async function setupApplication(
    additionalProviders?: string[],
    environment: 'web' | 'repl' | 'test' = 'test'
) {
    await fs.add('.env', '')
    await fs.add(
        'config/app.ts',
        `
export const appKey = 'averylong32charsrandomsecretkey'
export const http = {
    cookie: {},
    trustProxy: () => true,
}
  `
    )

    await fs.add(
        'config/database.ts',
        `
const databaseConfig = {
    connection: 'sqlite',
    connections: {
        sqlite: {
            client: 'sqlite',
            connection: {
                filename: '${join(fs.basePath, 'db.sqlite3')
                    .split(sep)
                    .join(posix.sep)}',
            },
            pool: {
                afterCreate: (conn, cb) => {
                    conn.run('PRAGMA foreign_keys=true', cb)
                },
            },
            useNullAsDefault: true
        },
    },
}

export default databaseConfig`
    )

    const app = new Application(fs.basePath, environment, {
        aliases: {
            App: './app',
        },
        providers: ['@adonisjs/core', '@adonisjs/lucid'].concat(
            additionalProviders || []
        ),
    })

    await app.setup()
    await app.registerProviders()
    await app.bootProviders()

    return app
}

/**
 * Create tables for users, todo list & its items
 */
export async function createTables(application: ApplicationContract) {
    const db = application.container.use('Adonis/Lucid/Database')

    const connection = db.connection()

    await connection.schema.createTableIfNotExists('users', (table) => {
        table.increments('id')
        table.string('username').notNullable().unique()
        table.string('password').notNullable()
        table.timestamp('created_at').notNullable()
    })

    await connection.schema.createTableIfNotExists('todo_lists', (table) => {
        table.increments('id')
        table
            .integer('user_id')
            .unsigned()
            .references('id')
            .inTable('users')
            .notNullable()
            .onDelete('CASCADE')
        table.string('title').notNullable()
        table.timestamp('created_at').notNullable()
    })

    await connection.schema.createTableIfNotExists(
        'todo_list_items',
        (table) => {
            table.increments('id')
            table
                .integer('todo_list_id')
                .unsigned()
                .references('id')
                .inTable('todo_lists')
                .notNullable()
                .onDelete('CASCADE')
            table.string('content').notNullable()
            table.timestamp('completed_at').nullable()
            table.timestamp('created_at').notNullable()
        }
    )
}

/**
 * Returns the models for User, TodoList & TodoListItem
 */
export function getModels(
    application: ApplicationContract,
    baseModel?: LucidModel
) {
    const { BaseModel, column, hasMany, belongsTo } =
        application.container.use('Adonis/Lucid/Orm')

    const base = baseModel || BaseModel

    class User extends base {
        @column({
            isPrimary: true,
        })
        public id: number

        @column()
        public username: string

        @column()
        public password: string

        @column.dateTime({
            autoCreate: true,
        })
        public createdAt: DateTime

        @hasMany(() => TodoList)
        public todoLists: HasMany<typeof TodoList>
    }

    class TodoList extends base {
        @column({
            isPrimary: true,
        })
        public id: number

        @column()
        public userId: number

        @belongsTo(() => User)
        public user: BelongsTo<typeof User>

        @column()
        public title: string

        @column.dateTime({
            autoCreate: true,
        })
        public createdAt: DateTime

        @hasMany(() => TodoListItem)
        public items: HasMany<typeof TodoListItem>
    }

    class TodoListItem extends base {
        @column({ isPrimary: true })
        public id: number

        @column()
        public todoListId: number

        @belongsTo(() => TodoList)
        public todoList: BelongsTo<typeof TodoList>

        @column()
        public content: string

        @column.dateTime()
        public completedAt: DateTime | null

        @column.dateTime({ autoCreate: true })
        public createdAt: DateTime
    }

    return {
        User,
        TodoList,
        TodoListItem,
    }
}

/**
 * Create random users & optionally their todo lists as well
 */
export async function createUsers({
    model,
    count = 5,
    todoList,
}: {
    model: UserModelType
    count?: number
    todoList?: Omit<Parameters<typeof createTodoLists>[0], 'user'>
}) {
    const users = await model.createMany(
        Array(count)
            .fill(0)
            .map((_, index) => ({
                username: `User${index}${Date.now()}`, // for now just add current timestamp for uniqueness
                password: 'verysecurehashedpassword',
            }))
    )

    if (todoList) {
        for (const user of users) {
            user.$setRelated(
                'todoLists',
                await createTodoLists({
                    ...todoList,
                    user,
                })
            )
        }
    }

    return users
}

/**
 * Create todolists for given user & optionally add items as well.
 */
export async function createTodoLists({
    user,
    count = 5,
    items,
}: {
    user: InstanceType<UserModelType>
    count?: number
    items?: Omit<Parameters<typeof createTodoListItems>[0], 'todoList'>
}) {
    const todoLists = await user.related('todoLists').createMany(
        Array(count)
            .fill(0)
            .map((_, index) => ({
                title: `TodoList ${index}`,
            }))
    )

    if (items) {
        for (const todoList of todoLists) {
            todoList.$setRelated(
                'items',
                await createTodoListItems({
                    ...items,
                    todoList,
                })
            )
        }
    }

    return todoLists
}

/**
 * Create items for a given todo list.
 * If completed is true then completedAt is also populated
 */
export async function createTodoListItems({
    todoList,
    count = 5,
    completed = false,
}: {
    todoList: InstanceType<TodoListModelType>
    count?: number
    completed?: boolean
}) {
    return await todoList.related('items').createMany(
        Array(count)
            .fill(0)
            .map((_, index) => ({
                content: `TodoListItem ${index}`,
                completedAt: completed
                    ? DateTime.now().minus({
                          hour: 1,
                      })
                    : null,
            }))
    )
}

/**
 * Performs cleanup
 */
export async function cleanup(application: ApplicationContract) {
    const db = application.container.use('Adonis/Lucid/Database')
    await db.connection().schema.dropTableIfExists('todo_list_items')
    await db.connection().schema.dropTableIfExists('todo_lists')
    await db.connection().schema.dropTableIfExists('users')
    await db.manager.closeAll()
    await fs.cleanup()
}

/**
 * Reset database tables
 */
export async function reset(application: ApplicationContract) {
    const db = application.container.use('Adonis/Lucid/Database')
    await db.connection().truncate('users')
}
