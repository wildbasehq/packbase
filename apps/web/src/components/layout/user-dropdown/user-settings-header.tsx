import ProgressBar from '@/components/shared/progress-bar'
import {isVisible} from '@/lib'
import {Divider} from '@/src/components'
import {Activity} from 'react'

export default function UserSettingsHeader({title, description, loading}: {
    title: string,
    description?: string,
    loading?: boolean
}) {
    return (
        <>
            <div className="pb-4 pl-16! px-6 pt-6 bg-new-card select-none sm:pl-6!">
                <h1 className="font-bold text-[17px]">{title}</h1>

                <Activity mode={isVisible(!!description)}>
                    <div className="mt-2">
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                </Activity>

                <ProgressBar mask indeterminate={loading} value={0}/>
            </div>
            <Divider/>
        </>
    )
}