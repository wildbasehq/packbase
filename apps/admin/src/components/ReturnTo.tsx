import { Link } from '@carbon/react'
import { ArrowLeft } from '@carbon/react/icons'

export default function ReturnTo({ href, application, view }: { href: string; application: string; view: string }) {
    return (
        <div className="security--shell__banner__container">
            <Link
                id="returnToBanner"
                className="security--shell__banner"
                href={href}
                style={{
                    backgroundImage: `url('/images/aurora-banner@2x.png')`,
                }}
            >
                <ArrowLeft size={16} className="security--shell__banner__icon" />
                <span className="security--shell__banner__text">{`Return to ${application} / ${view}`}</span>
            </Link>
        </div>
    )
}
