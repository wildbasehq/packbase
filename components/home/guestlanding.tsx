import CrawlText from '@/components/shared/CrawlText'

export default function GuestLanding() {
    return (
        <div className="flex flex-col">
            <div className="relative isolate py-24 sm:py-32">
                <div
                    className="hidden snapanim-hue-blur sm:absolute sm:-top-32 sm:right-1/2 sm:-z-10 sm:mr-10 sm:block sm:transform-gpu"
                    aria-hidden="true"
                >
                    <div
                        className="aspect-[1097/845] w-[68.5625rem] bg-gradient-to-tr from-[#ff4694] to-[#776fff] opacity-20"
                        style={{
                            clipPath:
                                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                        }}
                    />
                </div>
                <div
                    className="absolute snapanim-hue-blur-reverse -top-52 left-1/2 -z-10 -translate-x-1/2 transform-gpu sm:top-[-28rem] sm:ml-16 sm:translate-x-0 sm:transform-gpu"
                    aria-hidden="true"
                >
                    <div
                        className="aspect-[1097/845] w-[68.5625rem] bg-gradient-to-tr from-[#ff4694] to-[#776fff] opacity-20"
                        style={{
                            clipPath:
                                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                        }}
                    />
                </div>
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:mx-0">
                        <h2 className="text-4xl font-bold tracking-tight text-default sm:text-6xl"
                            style={{
                                whiteSpace: 'break-spaces',
                            }}
                        >
                            <CrawlText>
                                a random ass furry site
                            </CrawlText>
                            <p className="mt-4 text-lg text-alt">
                                <CrawlText delay={700} fast>
                                    :)
                                </CrawlText>
                            </p>
                        </h2>
                    </div>
                </div>
            </div>
        </div>
    )
}
