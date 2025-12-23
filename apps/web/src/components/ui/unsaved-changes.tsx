import {Button, Text} from '@/src/components'
import {HandRaisedIcon} from '@heroicons/react/16/solid'
import {motion} from 'motion/react'

export default function UnsavedChangesWarning({hasChanges, submitting}: { hasChanges: boolean; submitting: boolean }) {
    return (
        <motion.div
            animate={hasChanges ? 'visible' : 'hidden'}
            initial="hidden"
            variants={{
                visible: {
                    y: 0,
                    scale: 1,
                    opacity: 1,
                    pointerEvents: 'auto'
                },
                hidden: {
                    y: 100,
                    scale: 0.85,
                    opacity: 0,
                    pointerEvents: 'none'
                },
            }}
            transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25,
                duration: 0.65,
            }}
            className="w-full z-50 fixed left-0 right-0 bottom-0"
        >
            <div className="relative">
                <div
                    className="flex justify-between rounded-2xl items-center z-10 gap-2 p-2 my-4 w-fit mx-auto dark min-h-10 min-w-[21.25rem] bg-n-7 bg-linear-to-b from-white/12 to-transparent pl-3 shadow-panel-n-7 dark:shadow-panel-black/8"
                >
                    <div className="flex items-center">
                        <HandRaisedIcon className="inline-block w-4 h-4 mr-1 text-muted-foreground"/>
                        <Text className="text-white text-xs!">
                            You have unsaved changes.
                        </Text>
                    </div>
                    <div className="flex-1"/>
                    <Button color="indigo" type="submit" className="text-xs! py-1! px-2!"
                            disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
                </div>

                <div
                    className="absolute mask-t-from-0 backdrop-blur-[1px] bg-linear-to-b from-transparent -z-1 to-background w-full -mb-9 h-24 -bottom-2 left-0 right-0"
                />
            </div>
        </motion.div>
    )
}