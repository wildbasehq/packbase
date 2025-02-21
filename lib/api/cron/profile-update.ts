import {supabase, vg} from '@/lib/api'
import {useResourceStore, useUIStore, useUserAccountStore} from '@/lib/states.ts'

export const getSelfProfile = (cb?: () => void) => {
    log.info('User Data', 'Syncing user data...')

    const {setUser} = useUserAccountStore.getState()
    const {queueWorker, completeWorker} = useUIStore.getState()
    const {setResources} = useResourceStore.getState()

    queueWorker('account-sync')
    vg.user.me
        .get()
        .then(async ({data}) => {
            log.info('User Data', 'Got:', data)
            const dipswitch = (await vg.dipswitch.get({
                query: {}
            })).data || []

            log.info('User Data', 'Got dipswitch:', dipswitch)
            let userBuild = {
                id: data.id,
                username: data?.username || 'new_here_' + new Date().getTime(),
                display_name: data?.display_name || 'new_here_' + new Date().getTime(),
                reqOnboard: !data || !data?.username,
                dp: dipswitch,
                anonUser: !data,
                ...data,
            }

            if (JSON.stringify(userBuild) !== JSON.stringify(JSON.parse(localStorage.getItem('user-account') || '{}').state?.user)) {
                log.info('User Data', '↻ User data changed, updating...')
                setUser(userBuild)
            }

            if (!userBuild.anonUser) {
                const packs = (await vg.user.me.packs.get()).data || []
                if (JSON.stringify(packs) !== localStorage.getItem('packs')) {
                    log.info('User Data', '↻ Packs data changed, updating...')
                    localStorage.setItem('packs', JSON.stringify(packs))
                    setResources(packs)
                }
            } else {
                localStorage.removeItem('packs')
                setResources([])
            }

            log.info('User Data', 'Syncing user data... Done')

            cb && cb()
            completeWorker('account-sync')
        })
        .catch(e => {
            log.error('User Data', 'Error:', e)
            supabase.auth.signOut()
        })
}
