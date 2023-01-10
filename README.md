# Admin Js Adonis

Adapter & Plugin package to use [AdminJS](https://adminjs.co/) with [AdonisJS](https://adonisjs.com/).

## Getting Started

### Installation

```bash
# using npm:

npm install --save adonisjs-admin adminjs

# or using yarn:
yarn add adminjs-admin adminjs
```

After this, run:
```bash
node ace configure adonisjs-admin
```

### Configuration

The configuration for this package resides in `config/adminjs.ts`. Checkout [templates/config.txt](templates/config.txt) for configuration options.

### Model Customization

This package aims to auto-detect correct types of most of model columns but there are still some cases where it fails (for example: Enums, Attachments, nullable types etc) due to limitations of reflect-metadata package.

For this purpose, there is a `@adminColumn` decorator which you can use to inform the adapter how exactly you want a particular column to be displayed (or not displayed at all).

```ts
// User.ts
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import { adminColumn } from '@ioc:Adonis/Addons/AdminJS'

export enum UserType {
    STUDENT = 1,
    TEACHER = 2,
}

export class User extends BaseModel {
    @column({ isPrimary: true })
    public id: number

    @column()
    public username: string

    @column()
    @adminColumn({
        // password won't be visible on the list or show page
        visible: false
    })
    public password: string

    @column()
    @adminColumn({
        enum: UserType 
        // type will now be rendered as a select box
        // and will display the choices as text rather than numbers
    })
    public type: UserType

    @column()
    @adminColumn({
        // By default, `number | null` type is parsed as string
        type: "number",
        // By default, every field is required except the primary key
        optional: true,
    })
    public teachingNumber: number | null
}
```

For full options provided by adminColumn decorator, visit [here](./adonis-typings/adapter/decorator.ts#AdminColumnOptions)

### Hooks

This package also provides hooks for lifecycle management. These hooks are:

- beforeCreate
- beforeUpdate
- beforeDelete
- beforeFind
- beforeFetch
- afterCreate
- afterUpdate
- afterDelete
- afterFind
- afterFetch

They work the same as AdonisJS' hooks and when these hooks are called, corresponding AdonisJS hooks are also executed.
For example: when user is creating a new object, then the order of hooks is:
1. beforeCreate (of admin)
2. beforeCreate (of AdonisJS)
3. beforeSave (of AdonisJS)
4. afterCreate (of AdonisJS)
5. afterSave (of AdonisJS)
6. afterCreate (of admin)

Note: There is no `beforeSave` or `afterSave` hook in this package

Example:
```ts
// User.ts
import { beforeCreate, beforeUpdate } from '@ioc:Adonis/Addons/AdminJS'
import Hash from '@ioc:Adonis/Core/Hash'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export class User extends BaseModel {
    @column({ isPrimary: true })
    public id: number

    @column()
    public username: string

    @column()
    public password: string

    @beforeCreate()
    @beforeUpdate()
    public static async setPasswordIfDirty(instance: User) {
        if (instance.$dirty.password) {
            instance.password = await Hash.make(instance.password)
        }
    }
}

```