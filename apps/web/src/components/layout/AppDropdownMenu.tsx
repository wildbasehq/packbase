import {
    DropdownDivider,
    DropdownHeading,
    DropdownItem,
    DropdownLabel,
    DropdownMenu,
    DropdownSection
} from "@/src/components";
import {Login} from "@/components/icons/plump/Login.tsx";
import {PlusIcon} from "@heroicons/react/16/solid";
import React from "react";

export default function AppDropdownMenu() {
    return (
        <DropdownMenu className="min-w-80 lg:min-w-64" anchor="bottom start">
            <DropdownSection aria-label="Account">
                <DropdownItem href="/id/login">
                    <Login/>
                    <DropdownLabel>Login</DropdownLabel>
                </DropdownItem>
            </DropdownSection>
            <DropdownDivider/>
            <DropdownSection>
                <DropdownHeading>
                    Recent accounts will show here...
                </DropdownHeading>
            </DropdownSection>
            <DropdownDivider/>
            <DropdownItem href="/teams/create">
                <PlusIcon/>
                <DropdownLabel>New team&hellip;</DropdownLabel>
            </DropdownItem>
        </DropdownMenu>
    )
}