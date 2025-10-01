import UserSettingsHeader from "@/components/layout/user-dropdown/user-settings-header.tsx";
import {Activity, useEffect, useState} from "react";
import {Heading} from "@/src/components";
import {isVisible, vg} from "@/lib";
import {Text} from "@/components/shared/text.tsx";

export default function UserStoragePage() {
    const [userStorageOverbleed, setUserStorageOverbleed] = useState(0)
    const [userStorageUsed, setUserStorageUsed] = useState(0)
    const [fileCount, setFileCount] = useState()
    const [isInfinite, setIsInfinite] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // Converts 1GB in bytes
    const maxSize = 15 * 1000000000

    const useHumanReadable = (bytes: number) => {
        if (bytes >= 100000000) {
            return (bytes / 1000000000).toFixed() + ' GB'
        } else {
            return (bytes / 1000000).toFixed() + ' MB'
        }
    }

    const usePercentage = (bytes: number) => (
        Math.round((bytes / maxSize * 100))
    )

    const maxHumanReadable = useHumanReadable(maxSize)

    const userStorageUsedPercentage = usePercentage(userStorageUsed)

    useEffect(() => {
        vg.user.me.storage.get().then((result) => {
            setIsLoading(false)
            setFileCount(result.data.fileCount)
            setUserStorageUsed(result.data.totalBytes)
            // Overbleeding?
            if (result.data.totalBytes > maxSize) {
                setUserStorageOverbleed(usePercentage(result.data.totalBytes - maxSize))
            } else {
                setUserStorageOverbleed(0)
            }

            setIsInfinite(result.data.tier === 'void')
        })
    }, [])

    return (
        <div className="flex flex-col space-y-2">
            <UserSettingsHeader title="Storage" loading={isLoading}/>

            <div className="flex flex-col">
                <div className="w-full">
                    <div className="relative pt-1">
                        <Activity mode={isVisible(isInfinite)}>
                            <div className="flex mb-2 items-center">
                                <div className="mr-2 md:!mr-0 z-10 static md:absolute">
                                    <span
                                        className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200 dark:bg-green-500 dark:text-green-50">
                                        &infin;% Used
                                    </span>
                                </div>
                            </div>
                            <div
                                className="overflow-hidden h-2 mb-4 md:mt-5 text-xs flex rounded bg-blue-200 dark:bg-neutral-700">
                                <div
                                    className="w-full shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center animate-hue-linear !duration-5000 bg-gradient-to-r from-indigo-500 to-green-500"/>
                            </div>
                        </Activity>

                        <Activity mode={isVisible(!isInfinite)}>
                            <div className="flex mb-2 items-center">
                                {userStorageOverbleed > 0 && (
                                    <div className="mr-2 md:!mr-0 z-10 static md:absolute" style={{
                                        ...(
                                            userStorageOverbleed < 90 ? {
                                                left: `${userStorageOverbleed - 5}%`,
                                            } : {right: '-5px'}
                                        ),
                                    }}>
                                    <span
                                        className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-red-600 bg-red-200 dark:bg-red-500 dark:text-red-50">
                                        {userStorageOverbleed}% Over
                                    </span>
                                    </div>
                                )}

                                <div className="flex-grow z-10 static md:absolute" style={{
                                    ...(
                                        userStorageUsedPercentage <= 95 ? {
                                            left: `${userStorageUsedPercentage - (
                                                userStorageUsedPercentage > 15 ? 5 : userStorageUsedPercentage
                                            )}%`,
                                        } : {right: '-5px'}
                                    ), ...(
                                        userStorageOverbleed >= 80 ? {left: '0'} : {}
                                    ),
                                }}>
                                <span
                                    className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200 dark:bg-blue-500 dark:text-blue-50">
                                    {useHumanReadable(userStorageUsed)}
                                </span>
                                </div>
                                <div className="static md:absolute right-0 text-right">
                                <span className="text-xs font-semibold inline-block text-blue-600 dark:text-blue-50">
                                    {maxHumanReadable}
                                </span>
                                </div>
                            </div>
                            <div
                                className="overflow-hidden h-2 mb-4 md:mt-5 text-xs flex rounded bg-blue-200 dark:bg-neutral-700">
                                {isInfinite ? (
                                    <div
                                        className="w-full shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center animate-hue-linear !duration-5000 bg-gradient-to-r from-indigo-500 to-green-500"/>
                                ) : (
                                    <>
                                        {userStorageOverbleed > 0 && (
                                            <div
                                                style={{
                                                    width: `${userStorageOverbleed}%`,
                                                }}
                                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500"/>
                                        )}
                                        <div
                                            style={{width: `${userStorageUsedPercentage - userStorageOverbleed}%`}}
                                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"/>
                                    </>
                                )}
                            </div>
                        </Activity>
                    </div>
                </div>
            </div>

            <Activity mode={isVisible(!isInfinite)}>
                <Text alt size="xs" className="italic">
                    About {fileCount} files, contributing about {Math.round(userStorageUsedPercentage)}%. Don't feel
                    paranoid about your storage. We let you go over your limit, but we'll stop you if you go way too
                    much
                    over.
                </Text>
            </Activity>

            <Activity mode={isVisible(isInfinite)}>
                <Text alt size="xs" className="italic">
                    About {fileCount} files, using
                    up {useHumanReadable(userStorageUsed)} of {maxHumanReadable} Core.
                </Text>
            </Activity>

            <Activity mode={isVisible(isInfinite)}>
                <div className="flex flex-col space-y-4">
                    <Heading className="text-tertiary">
                        Use however much you want
                    </Heading>
                    <Text alt>
                        You have been granted unlimited storage capacity ("Void Storage") as a special gift from
                        Wildbase. This means you can store as much data as you need without worrying about space
                        limitations.
                    </Text>
                    <Text alt>
                        Void Storage is permanent, unless you severely break our trust and get suspended on
                        Packbase. If you do, we will take Void Storage away from you and blacklist you from ever
                        getting it again.
                    </Text>
                </div>
            </Activity>
        </div>
    )
}