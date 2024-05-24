import {LoadingDots} from '@/components/shared/icons'
import {Logo} from '@/components/shared/logo'
import Link from 'next/link'
import Button from '@/components/shared/button'
import {Input} from '@/components/shared/input/text'
import {NGTabList} from '@/components/NGLibrary'
import {Key, Sparkles} from 'lucide-react'

export default function SignInModal(props: { noShadow?: any; }) {

    return (
        <div
            className={`w-full overflow-hidden ${props?.noShadow ? '' : 'shadow-xl'} bg-default md:max-w-md md:rounded-2xl md:border border-default`}>
            <div
                className="flex flex-col items-center justify-center space-y-3 border-b border-default px-4 py-6 pt-8 text-center md:px-16">
                <Logo className="h-10 w-10 rounded-full"/>
                <h3 className="font-display text-2xl font-bold">Login</h3>
                <p className="text-sm text-alt">
                    Authenticate with your Yipnyap ID to continue.
                </p>
            </div>

            <form className="flex flex-col space-y-4 bg-default-alt px-4 py-8 md:px-16"
                  action="/api/auth/signin/credentials" method="POST">
                <NGTabList srLabel="Choose method of login"
                           navClassName="grid grid-cols-2 gap-2"
                           tabs={[
                               {
                                   name: 'Legacy',
                                   children: (
                                       <>
                                           <div>
                                               <Input
                                                   label="Username"
                                                   description="This is your first username, not your display name or @handle."
                                                   suffix="yipnyap.me/@"
                                                   id="username"
                                                   type="text"
                                                   autoComplete="username"
                                               />
                                           </div>

                                           <div>
                                               <Input
                                                   label="Password"
                                                   id="password"
                                                   type="password"
                                                   autoComplete="password"
                                               />
                                           </div>
                                       </>
                                   )
                               }, {
                                   name: <div className="flex items-center gap-2">
                                       <Sparkles className="h-4 w-4 text-default"/> Magic Link
                                   </div>,
                                   key: 'magic-link',
                                   children: (
                                       <>
                                           <div>
                                               <Input
                                                   label="Email"
                                                   description="You'll get a super secret link in your inbox that'll immediately log you in. This skips your Email 2FA (but not other 2FA methods)."
                                                   id="email"
                                                   type="email"
                                                   autoComplete="email"
                                               />
                                           </div>
                                       </>
                                   )
                               }, {
                                   // Passkey
                                   name: <div className="flex items-center gap-2">
                                       <Key className="h-4 w-4 text-default"/> Passkey
                                   </div>,
                                   children: (
                                       <>
                                           <span className="block text-sm text-default">
                                               Passkeys are a secure way to login without a password.
                                           </span>
                                           <span className="block text-sm text-default">
                                               This requires you to have a passkey set up already. When
                                               Passkeys have matured, this will be the default login method.
                                           </span>
                                       </>
                                   )
                               }
                           ]}/>

                <div>
                    {/* Remember Me checkbox & Forgot password */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember"
                                name="remember"
                                type="checkbox"
                                className="h-4 w-4 text-indigo-600 ring-1 ring-inset ring-neutral-300 dark:ring-white/10 focus:ring-indigo-500 border-neutral-300 rounded"
                            />
                            <label htmlFor="remember" className="ml-2 block text-sm text-default">
                                Remember me
                            </label>
                        </div>

                        <div className="text-sm">
                            <Link href="/id/recovery/" className="font-medium text-blue-600 hover:text-blue-500">
                                Forgot your password?
                            </Link>
                        </div>
                    </div>
                    <Button type="submit" variant="primary" className="mt-4 !w-full items-center">
                        <LoadingDots color="white"/>
                        <span className="opacity-0">T</span>
                    </Button>
                </div>
            </form>
        </div>
    )
};
