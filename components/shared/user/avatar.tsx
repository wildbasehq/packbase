import BoringAvatar from "boring-avatars";
import { clsx } from "clsx";

export default function UserAvatar({
    user,
    size = "lg",
    icon,
    ...props
}: {
    user?: any; // object - @todo: type this
    size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | number;
    icon?: string;
    [x: string]: any;
}) {
    const sizes = {
        xs: 16,
        sm: 24,
        md: 32,
        lg: 40,
        xl: 48,
        "2xl": 56,
        "3xl": 64,
    };

    props.className = `${props.className || ""}`;
    props.style = {
        ...props.style,
        width: typeof size === "number" ? size : sizes[size],
        height: typeof size === "number" ? size : sizes[size],
    };

    if ((!user || !user.images?.avatar) && !icon) {
        return (
            <div
                className={clsx(props.className, `inline-flex items-center justify-center overflow-hidden rounded-md bg-n-5 text-white`)}
                style={props.style}
                title={`${props.display_name}'s avatar`}
            >
                <BoringAvatar variant="beam" square size={typeof size === "number" ? size : sizes[size]} {...props} />
            </div>
        );
    } else {
        return (
            <img
                width={1024}
                height={1024}
                src={user?.images?.avatar || icon}
                alt={`${user?.username || props.display_name}'s avatar`}
                {...props}
                className={clsx(props.className, `inline-flex items-center justify-center overflow-hidden rounded-md text-white`)}
            />
        );
    }
}
