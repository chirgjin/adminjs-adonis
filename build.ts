import { Compiler } from '@adonisjs/assembler/build/src/Compiler'

async function build() {
    const compiler = new Compiler(__dirname, [], false)

    await compiler.compileForProduction(true, 'yarn')
}

build()
