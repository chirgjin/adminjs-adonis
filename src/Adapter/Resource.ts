import * as validator from '@ioc:Adonis/Core/Validator'
import { LucidModel } from '@ioc:Adonis/Lucid/Orm'

import { BaseResource } from './BaseResource'

export class Resource extends BaseResource {
    constructor(public readonly model: LucidModel) {
        super(model, validator)
    }
}
