import NUEModal, {createNUEFlow} from "@/components/seen-once/nue-modal.tsx";
import {toast} from "sonner";
import {useLocation} from "wouter";
import {useEffect} from "react";
import {useUserAccountStore} from "@/lib";

export default function SetupAccountPage() {
    const {user} = useUserAccountStore()
    const [location] = useLocation()

    useEffect(() => {
        // Redirect to /p/new if account has display name set
        const hasDisplayName = !!user?.display_name; // Replace with actual check
        if (hasDisplayName) {
            window.location.href = '/p/new'
        }
    }, []);
    return (
        <div className="relative flex flex-1 items-center justify-center h-full w-full p-4">
            <NUEModal
                config={{
                    ...createNUEFlow(),
                    onComplete: () => {
                        window.location.reload()
                    },
                    onCancel: () => {
                        toast.message('Snoozed until next reload')
                    },
                }}
            />
        </div>
    )
}