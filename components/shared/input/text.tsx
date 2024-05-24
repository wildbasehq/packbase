import cx from 'classnames'
import {forwardRef} from 'react'

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    description?: string
    label: string
    suffix?: string
    button?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({className, type, id, description, suffix, button, autoComplete, label, ...props}, ref) => {
        return (
            <>
                <label htmlFor={id} className="block text-sm font-medium leading-6 text-default">
                    {label}
                    {description && <p className="mt-1 text-xs leading-5 text-alt">{description}</p>}
                </label>
                <div className="flex mt-2">
                    <div
                        className={`${className} w-full flex rounded-md bg-default shadow-sm ring-1 ring-inset ring-neutral-300 dark:ring-white/10 focus-within:ring-2 focus-within:ring-inset focus-within:!ring-indigo-600 sm:max-w-md`}>
                        {suffix && <span
                            className="flex select-none items-center pl-3 text-neutral-500 sm:text-sm">{suffix}</span>}
                        <input
                            type={type || 'text'}
                            ref={ref}
                            name={id}
                            id={id}
                            autoComplete={autoComplete || 'off'}
                            className={cx('no-legacy block flex-1 border-0 bg-transparent py-1.5 px-3 text-default placeholder:text-neutral-400 focus:ring-0 sm:text-sm sm:leading-6', className)}
                            {...props}
                        />
                    </div>
                    {button && button}
                </div>
            </>
        )
    }
)
Input.displayName = 'Input'

export {Input}