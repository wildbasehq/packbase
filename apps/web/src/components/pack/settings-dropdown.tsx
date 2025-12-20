import {
    DropdownDivider,
    DropdownHeader,
    DropdownItem,
    DropdownMenu,
    ResourceSettingsModal,
    SidebarLabel,
    Text
} from "@/src/components";
import {Cog6ToothIcon} from "@heroicons/react/20/solid";
import {useResourceStore, vg} from "@/lib";
import {
    hasPackAnyManagementPermissions,
    hasPackPermissionBit,
    PACK_PERMISSIONS
} from "@/lib/utils/has-pack-permission-bit.ts";
import LogoutIcon from "@/components/icons/logout.tsx";
import {toast} from "sonner";

export default function PackSettingsDropdown({show}: {
    show: (modal: React.ReactNode) => void
}) {
    const {currentResource} = useResourceStore()

    const currentPermissions = currentResource?.membership?.permissions || 0

    if (!currentResource) {
        return <></>
    }

    return (
        <DropdownMenu anchor="top">
            <DropdownHeader>
                <div className="pr-6">
                    <Text size="xs" alt>Pack Options</Text>
                </div>
            </DropdownHeader>

            <DropdownDivider/>

            <DropdownItem className="hidden!"/>

            {hasPackAnyManagementPermissions(currentPermissions) && (
                <DropdownItem onClick={() => show(<ResourceSettingsModal/>)}>
                    <Cog6ToothIcon className="w-4 h-4 inline-flex" data-slot="icon"/>
                    <SidebarLabel>Settings</SidebarLabel>
                </DropdownItem>
            )}

            {!hasPackPermissionBit(currentPermissions, PACK_PERMISSIONS.Owner) && (
                <DropdownItem onClick={() => {
                    vg.pack({id: currentResource.id})
                        .join.delete()
                        .then(() => {
                            window.location.reload()
                        })
                        .catch(e => {
                            toast.error(e.message)
                        })
                }}>
                    <LogoutIcon/>
                    <SidebarLabel>Leave Pack</SidebarLabel>
                </DropdownItem>
            )}

        </DropdownMenu>
    )
}