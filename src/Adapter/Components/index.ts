import { ComponentLoader } from 'adminjs'

export const componentLoader = new ComponentLoader()

export const components = {
    FileInput: componentLoader.add('FileInput', './FileInput'),
    ListUrl: componentLoader.add('ListUrl', './ListUrl'),
    ShowUrl: componentLoader.add('ShowUrl', './ShowUrl'),
}
