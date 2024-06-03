import LoginGradient from '@/app/id/create/client/gradient'

export default function IDLayout({children}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {/* test */}
            <div className="animate-slide-down-fade absolute inset-0 -z-10 dark:opacity-75">
                <LoginGradient/>
            </div>

            <div className="h-full grid grid-cols-1 2xl:grid-cols-2">
                <div
                    className="col-span-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
                    <div className="mx-auto w-full max-w-sm lg:w-96">
                        {children}
                    </div>
                </div>
                <div className="hidden col-span-1 2xl:block relative rounded-tl-3xl rounded-bl-3xl overflow-hidden">
                    <img
                        className="inset-0 h-full w-full object-cover"
                        src="https://images.unsplash.com/photo-1505904267569-f02eaeb45a4c?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1908&q=80"
                        alt=""
                    />
                </div>
            </div>
        </>
    )
}