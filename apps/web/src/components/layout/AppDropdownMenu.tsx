import {
    DropdownDivider,
    DropdownHeading,
    DropdownItem,
    DropdownLabel,
    DropdownMenu,
    DropdownSection
} from "@/src/components";
import {Login} from "@/components/icons/plump/Login.tsx";
import React from "react";
import {SignedIn, SignedOut} from "@clerk/clerk-react";

export default function AppDropdownMenu() {
    return (
        <DropdownMenu className="min-w-80 lg:min-w-64" anchor="bottom start">
            <SignedOut>
                <DropdownSection aria-label="Account">
                    <DropdownItem href="/id/login">
                        <Login/>
                        <DropdownLabel>Login</DropdownLabel>
                    </DropdownItem>
                </DropdownSection>
            </SignedOut>
            <SignedIn>
                <DropdownSection aria-label="Account">
                    <DropdownItem href="https://packbase.app">
                        <DropdownLabel>
                            Use a real instance
                        </DropdownLabel>
                    </DropdownItem>
                </DropdownSection>
            </SignedIn>
            <DropdownDivider/>
            <DropdownSection>
                <DropdownHeading>
                    Your packs will show here&hellip;
                </DropdownHeading>
                <DropdownHeading>
                    packs are disabled by the instance owner.
                </DropdownHeading>
            </DropdownSection>
        </DropdownMenu>
    )
}