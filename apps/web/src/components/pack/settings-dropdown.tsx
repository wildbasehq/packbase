import {DropdownDivider, DropdownHeader, DropdownItem, DropdownMenu, SidebarLabel, Text} from "@/src/components";
import {Cog6ToothIcon} from "@heroicons/react/20/solid";

export default function PackSettingsDropdown() {
    return (
        <DropdownMenu anchor="top">
            <DropdownHeader>
                <div className="pr-6">
                    <Text size="xs" alt>Pack Options</Text>
                </div>
            </DropdownHeader>

            <DropdownDivider/>

            <DropdownItem>
                <Cog6ToothIcon className="w-4 h-4 inline-flex" data-slot="icon"/>
                <SidebarLabel>Settings</SidebarLabel>
            </DropdownItem>

            <DropdownItem>

            </DropdownItem>
        </DropdownMenu>
    )
}