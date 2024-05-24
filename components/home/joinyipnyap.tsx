'use client';
import {useModal} from "@/components/modal/provider";
import SignInModal from "@/components/modal/sign-in-modal";
import {ReactNode} from "react";

export default function JoinYipnyap() {
    const modal = useModal();

    return (
        <span className="text-blue-600 cursor-pointer" onClick={() => modal?.show(SignInModal as unknown as ReactNode)}>
            Join Yipnyap &rarr;
        </span>
    )
}