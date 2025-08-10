import {YapockType} from '@/index'
import fetchRoute from './fetch'
import idRoute from './[id]'
import readRoute from './read'

export default (app: YapockType) => {
    return app.group('/inbox', (group: any) => group
        .use(fetchRoute)
        .use(idRoute)
        .use(readRoute)
    )
}
