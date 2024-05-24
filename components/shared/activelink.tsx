'use client';
import {ReactElement} from "react";
import {usePathname} from "next/navigation";
import Link from "next/link";

export default function ActiveLink({ children, activeClassName, inactiveClassName, ...props }: {
    // allow multiple
    children: ReactElement | ReactElement[];
    className?: string;
    activeClassName: string;
    inactiveClassName: string;
    href: string;
    as?: string;
}) {
    const pathname = usePathname();
    const isActive = props.as ? pathname === props.as : pathname === props.href;

    props.className = isActive
        ? `${props.className} ${activeClassName}`.trim()
        : `${props.className} ${inactiveClassName}`.trim();

    return (
        <Link {...props}>
            {children}
        </Link>
    );

}