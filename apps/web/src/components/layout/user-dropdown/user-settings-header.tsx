import React, {Activity} from "react";
import {isVisible} from "@/lib";
import ProgressBar from "@/components/shared/progress-bar.tsx";

export default function UserSettingsHeader({title, description, loading}: {
    title: string,
    description?: string,
    loading?: boolean
}) {
    return (
        <>
            <div className="border-b pb-4 mb-4 border-n-5/10">
                <h1 className="font-bold text-[17px]">{title}</h1>

                <Activity mode={isVisible(loading)}>
                    <ProgressBar mask indeterminate/>
                </Activity>
            </div>

            <Activity mode={isVisible(!!description)}>
                <div className="mb-4">
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
            </Activity>
        </>
    )
}