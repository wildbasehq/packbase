import { supabase, vg } from '@/lib/api'
import { useResourceStore, useUserAccountStore, WorkerStore } from '@/lib/index'

export const getSelfProfile = (cb?: () => void) => {
    log.info('User Data', 'Syncing user data...')

    const { setUser } = useUserAccountStore.getState()
    const { enqueue } = WorkerStore.getState()
    const { setResources } = useResourceStore.getState()

    enqueue('account-sync', async () => {
        vg.user.me
            .get()
            .then(async ({ data }) => {
                log.info('User Data', 'Got:', data)

                let userBuild = {
                    id: data.id,
                    username: data?.username || 'new_here',
                    display_name: data?.display_name || 'new_here',
                    reqOnboard: !data || !data?.username,
                    dp: data?.dp || {},
                    anonUser: !data?.username,
                    ...data,
                }

                if (JSON.stringify(userBuild) !== JSON.stringify(JSON.parse(localStorage.getItem('user-account') || '{}').state?.user)) {
                    log.info('User Data', '↻ User data changed, updating...')
                    setUser(userBuild)
                }

                if (!userBuild.anonUser) {
                    enqueue('pack-sync', async () => {
                        const packs = (await vg.user.me.packs.get()).data || []
                        if (JSON.stringify(packs) !== localStorage.getItem('packs')) {
                            log.info('User Data', '↻ Packs data changed, updating...')
                            localStorage.setItem('packs', JSON.stringify(packs))
                            setResources(packs)
                        } else {
                            setResources(JSON.parse(localStorage.getItem('packs') || '[]'))
                        }
                    })
                } else {
                    localStorage.removeItem('packs')
                    setResources([])
                }

                log.info('User Data', 'Syncing user data... Done')

                cb && cb()
            })
            .catch(e => {
                log.error('User Data', 'Error:', e)
                supabase.auth.signOut()
            })
    })
}
