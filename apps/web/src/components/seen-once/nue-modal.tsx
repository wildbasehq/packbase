/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import Modal from '@/components/modal'
import { Heading } from '@/components/shared/text.tsx'
import { useEffect, useState } from 'react'
import { Button } from '@/components/shared/experimental-button-rework'
import Markdown from '@/components/shared/markdown.tsx'
import { AnimatedCharacter, Expressions } from '@/components/shared/animated-character'
import SelectPills from '@/components/shared/input/select-pills.tsx'
import { Alert, AlertDescription, Checkbox, CheckboxField, Field, Input, InputGroup, Textarea } from '@/src/components'
import { Label } from '@headlessui/react'
import { setToken, vg } from '@/lib'
import { toast } from 'sonner'

/**
 * Character Text Box Modal for user guidance and onboarding
 */

const TALKING_DELAY = 2000

export interface DialogueStep {
    id: string
    title: string
    content: string[]
    expression?: number
    buttons?: {
        text: string
        action: (handlePrevious: () => void, handleNext: () => void) => void
        variant?: string
    }[]
    onShow?: () => void
    onComplete?: (formData?: Record<string, any>) => Promise<void>
    customComponent?: React.ReactNode
    form?: {
        fields: Array<{
            name: string
            label: string
            type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox'
            placeholder?: string
            options?: Array<{ value: string; label: string; disabled?: boolean; desc?: string; warn?: string }>
            required?: boolean
            defaultValue?: string | number | boolean
        }>
    }
}

export interface CharacterTextBoxConfig {
    steps: DialogueStep[]
    mascotSrc?: string
    stateMachine?: string
    onComplete?: () => void
    onCancel?: () => void
    showModal?: boolean
    allowSkip?: boolean
}

interface CharacterTextBoxProps {
    config?: CharacterTextBoxConfig
}

export default function NUEModal({ config }: CharacterTextBoxProps) {
    const {
        steps,
        mascotSrc = '/img/rive/mascat-placeholder-please-replace.riv',
        stateMachine = 'State Machine 1',
        onComplete,
        onCancel,
        showModal = true,
        allowSkip = true,
    } = config || createDebugNUEFlow()

    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [talking, setTalking] = useState(true)
    const [expression, setExpression] = useState(Expressions.AMAZED)
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState<Record<string, any>>({})
    const [formError, setFormError] = useState<string | null>(null)

    const currentStep = steps[currentStepIndex]

    useEffect(() => {
        if (currentStep) {
            setExpression(currentStep.expression ?? Expressions.AMAZED)
            setTalking(true)
            setFormError(null)
            currentStep.onShow?.()
        }
    }, [currentStepIndex])

    const handleNext = async () => {
        // Reset any previous form errors
        setFormError(null)

        // Validate required fields if form exists
        if (currentStep.form?.fields) {
            const missingRequiredFields = currentStep.form.fields.filter(
                field => field.required && (!formData[field.name] || formData[field.name] === '')
            )

            if (missingRequiredFields.length > 0) {
                const fieldNames = missingRequiredFields.map(field => field.label).join(', ')
                setFormError(`Please fill in the required field(s): ${fieldNames}`)
                setExpression(Expressions.UNIMPRESSED)
                setTalking(true)
                return
            }
        }

        if (currentStep.onComplete) {
            setIsLoading(true)
            try {
                // Pass form data to onComplete if form exists
                await currentStep.onComplete(formData)
            } catch (error) {
                console.error('Error executing onComplete:', error)
            } finally {
                setIsLoading(false)
            }
        }

        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(currentStepIndex + 1)
            // Reset form data when moving to next step
            // setFormData({})
        } else {
            onComplete?.()
        }
    }

    const handlePrevious = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(currentStepIndex - 1)
        }
    }

    const handleSkip = () => {
        onCancel?.()
    }

    const handleClose = () => {
        onCancel?.()
    }

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target

        // Clear error message when user updates form
        setFormError(null)

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }))
    }

    const handleCheckboxChange = (name: string, checked: boolean) => {
        // Clear error message when user updates checkbox
        setFormError(null)

        setFormData(prev => ({
            ...prev,
            [name]: checked,
        }))
    }

    const handleSelectChange = (name: string, selected: any) => {
        // Clear error message when user updates select
        setFormError(null)

        setFormData(prev => ({
            ...prev,
            [name]: selected.value || selected.name,
        }))
    }

    if (!currentStep) {
        return null
    }

    return (
        <Modal showModal={showModal} setShowModal={handleClose} className="relative !bg-muted w-[52rem] overflow-visible">
            {/* Character mascot */}
            <div className="absolute -top-6/7 md:-left-1/8 md:!-top-13 pointer-events-none w-1/2">
                <AnimatedCharacter
                    src={mascotSrc}
                    stateMachine={stateMachine}
                    expression={expression}
                    talkingState={[talking, setTalking]}
                    talkingDuration={TALKING_DELAY}
                    className="h-96"
                />
            </div>

            <div className="m-1 mt-3 md:ml-60 overflow-visible mb-32 xl:ml-72 md:mb-1">
                {/* Header with progress and skip option */}
                <div className="mx-2 my-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Heading size="xs">
                            Step {currentStepIndex + 1} of {steps.length}
                        </Heading>
                        <div className="flex gap-1">
                            {steps.map((_, index) => (
                                <div
                                    key={index}
                                    className={`w-2 h-2 rounded-full ${index <= currentStepIndex ? 'bg-primary' : 'bg-n-5'}`}
                                />
                            ))}
                        </div>
                    </div>
                    {allowSkip && (
                        <button onClick={handleSkip} className="text-sm text-muted-foreground hover:opacity-50 underline">
                            Skip
                        </button>
                    )}
                </div>

                {/* Main content area */}
                <div className="bg-white dark:bg-n-8 p-4 overflow-y-auto h-[18rem] rounded gap-4 justify-center items-center">
                    {/* Text content */}
                    <div className="space-y-4">
                        <Heading size="xl">{currentStep.title}</Heading>
                        <div className="space-y-2">
                            {currentStep.content.map((content, i) => (
                                <Markdown key={i}>{content}</Markdown>
                            ))}
                        </div>

                        {/* Form element */}
                        {currentStep.form && (
                            <div className="mt-4 space-y-3">
                                {formError && (
                                    <div className="p-2 mb-2 text-sm font-medium text-red-800 bg-red-100 rounded-md dark:bg-red-900 dark:text-red-200">
                                        {formError}
                                    </div>
                                )}
                                {currentStep.form.fields.map(field => (
                                    <InputGroup key={field.name} className="space-y-1">
                                        {field.type === 'select' ? (
                                            <SelectPills
                                                label={field.label + (field.required ? ' *' : '')}
                                                onChange={selected => handleSelectChange(field.name, selected)}
                                                options={[
                                                    ...(field.options?.map(option => ({
                                                        name: option.label,
                                                        id: option.value,
                                                        desc: option.desc,
                                                        disabled: option.disabled,
                                                        warn: option.warn,
                                                    })) || []),
                                                ]}
                                            />
                                        ) : field.type === 'textarea' ? (
                                            <Field>
                                                <Textarea placeholder={field.placeholder} name={field.name} onChange={handleFormChange} />
                                            </Field>
                                        ) : field.type === 'checkbox' ? (
                                            <CheckboxField>
                                                <Checkbox
                                                    name={field.name}
                                                    value={field.name}
                                                    aria-required={field.required}
                                                    onChange={checked => handleCheckboxChange(field.name, checked)}
                                                />
                                                <Label className="text-sm">{field.label}</Label>
                                            </CheckboxField>
                                        ) : (
                                            <Input
                                                id={field.name}
                                                name={field.name}
                                                type={field.type}
                                                placeholder={field.placeholder}
                                                required={field.required}
                                                value={formData[field.name] || field.defaultValue || ''}
                                                onChange={handleFormChange}
                                            />
                                        )}
                                    </InputGroup>
                                ))}
                            </div>
                        )}

                        {/* Custom component */}
                        {currentStep.customComponent && <div className="mt-4">{currentStep.customComponent}</div>}

                        {/* Action buttons */}
                        <div className="flex gap-2 mt-4">
                            {currentStep.buttons ? (
                                currentStep.buttons.map((button, index) => (
                                    <Button
                                        key={index}
                                        onClick={() => button.action(handlePrevious, handleNext)}
                                        // @ts-ignore
                                        color={button.variant ?? 'indigo'}
                                    >
                                        {button.text}
                                    </Button>
                                ))
                            ) : (
                                <>
                                    {currentStepIndex > 0 && (
                                        <Button onClick={handlePrevious} disabled={isLoading}>
                                            Previous
                                        </Button>
                                    )}
                                    <Button onClick={handleNext} color="indigo" disabled={isLoading}>
                                        {isLoading ? 'Loading' : currentStepIndex < steps.length - 1 ? 'Next' : 'Complete'}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    )
}

/*
 * The real one
 */
export function createNUEFlow(): CharacterTextBoxConfig {
    return {
        steps: [
            {
                id: 'welcome',
                title: `Welcome home~!`,
                content: [
                    'Welcome to Packbase!',
                    "I'm here to help you get started with your new Packbase account.",
                    "{img src:'noai_created'}{/img}",
                ],
                expression: Expressions.DEFAULT,
            },
            {
                id: 'display-name',
                title: 'Display Name',
                content: ['What should everyone call you? (You can change this later!)'],
                expression: Expressions.NORMAL,
                form: {
                    fields: [
                        {
                            name: 'display_name',
                            label: 'Display Name',
                            type: 'text',
                            placeholder: 'e.g. GOOD!BOY 🔜MFF   - or -   🐻‍Embrrr❄️   - or -   bob.',
                            required: true,
                        },
                    ],
                },
            },
            {
                id: 'profile',
                title: 'About You',
                content: ["don't be shy now~", '*ok, maybe a little shy, this is public.*'],
                expression: Expressions.AMAZED,
                form: {
                    fields: [
                        {
                            name: 'bio',
                            label: 'Bio',
                            type: 'textarea',
                            placeholder: 'Tell us a little about yourself',
                            required: true,
                        },
                    ],
                },
            },
            {
                id: 'subdomain',
                title: 'Want a free site?',
                content: [
                    'We can give you a free subdomain (your username) for your static site theme, or you can link a custom domain (// ALPHA NOTE: NOT ADDED. TBD //).',
                    'It must be about you specifically, and it must be unique. Want to host your company? Shove it in a /folder.',
                ],
                expression: Expressions.MOTIVATED,
                form: {
                    fields: [
                        {
                            name: 'subdomain',
                            label: ' ',
                            type: 'select',
                            options: [
                                {
                                    value: 'none',
                                    label: 'Nothing',
                                },
                                {
                                    value: 'free',
                                    label: 'Subdomain',
                                },
                            ],
                            required: false,
                        },
                        {
                            name: 'domain-agreement',
                            label: 'I solemly swear that I will follow the law, and that I will only use this subdomain for myself and myself alone.',
                            type: 'checkbox',
                            required: true,
                        },
                    ],
                },
            },
            {
                id: 'storage',
                title: 'Quick thingy about your stuff',
                content: [
                    'FYI, everyone gets a 15GB share of our storage for all their content they upload.',
                    'This storage is shared across anything you upload to Packbase, including your custom site content.',
                    'If you need more, you can link your own Pixeldrain account for 100% self-managed storage later.',
                ],
                expression: Expressions.NORMAL,
            },
            {
                id: 'private-alpha-notice',
                title: 'readme-or-get-banned-uwu.txt.md',
                content: [
                    'We are currently in private alpha, so you will not be able to use all the features of Packbase yet, and we are still working on some of the core features.',
                    "Please, be kind to one another - **we won't hesitate to ban you for life with no appeals**. We appreciate you taking the time to join and help us make something truly great, but we ask you to be respectful of our time as well. ***Remember***: We're far from a company - we're just a bunch of passionate people who want to make a great community.",
                    "We want to know how you'd like to use Packbase and what features are missing! After I finish yapping, join /p/support and howl in #ideas to tell us what you think!",
                ],
                expression: Expressions.UNIMPRESSED,
                onComplete: async formData => {
                    console.log('Form data submitted:', formData)
                    // @ts-ignore
                    const token = await window.Clerk?.session?.getToken()
                    setToken(token)
                    await vg.user.me
                        .post({
                            display_name: formData.display_name,
                            ...(formData.bio
                                ? {
                                      about: {
                                          bio: formData.bio,
                                      },
                                  }
                                : {}),
                        })
                        .then(({ data, error }) => {
                            console.log('User data:', data)
                            if (!data || error) {
                                toast.error(
                                    "Couldn't save: " +
                                        (error.value
                                            ? `${error.status}: ${error.value.summary || error.value.error}`
                                            : 'Something went wrong')
                                )
                            }
                        })
                },
            },
        ],
    }
}

/*
 * For debugging
 */
export function createDebugNUEFlow(): CharacterTextBoxConfig {
    return {
        steps: [
            {
                id: 'welcome',
                title: `Welcome home~`,
                content: ['Woa...!!!', "Let's go and *render* **some** __markdown__!.", 'I feel so [sigma](https://ifeelsosigma.com)!'],
                expression: Expressions.AMAZED,
                customComponent: (
                    <Alert variant="info">
                        <AlertDescription>This is a custom component example that can be included after the content!</AlertDescription>
                    </Alert>
                ),
                onComplete: async () => {
                    await new Promise(resolve => setTimeout(resolve, 1000))
                },
            },
            {
                id: 'form-example',
                title: 'Form Example',
                content: ['This step includes a form that will be submitted when you click Next.'],
                expression: Expressions.NORMAL,
                form: {
                    fields: [
                        {
                            name: 'display_name',
                            label: 'Display Name',
                            type: 'text',
                            placeholder: 'Some name here',
                            required: true,
                        },
                    ],
                },
                onComplete: async formData => {
                    console.log('Form data submitted:', formData)
                    await new Promise(resolve => setTimeout(resolve, 1000))
                },
            },
            {
                id: 'exp1',
                title: 'im so normal rn',
                content: [`Expressions.NORMAL ${Expressions.NORMAL}`],
                expression: Expressions.NORMAL,
            },
            {
                id: 'exp2',
                title: 'im so annoyed rn',
                content: [`Expressions.ANNOYED ${Expressions.ANNOYED}`],
                expression: Expressions.ANNOYED,
            },
            {
                id: 'exp3',
                title: 'im rlly sad :(',
                content: [`Expressions.SOBBING ${Expressions.SOBBING}`],
                expression: Expressions.SOBBING,
            },
            {
                id: 'exp4',
                title: 'im so worried rn',
                content: [`Expressions.WORRIED_STATIC ${Expressions.WORRIED_STATIC}`],
                expression: Expressions.WORRIED_STATIC,
            },
            {
                id: 'exp5',
                title: 'im so unimpressed rn',
                content: [`Expressions.UNIMPRESSED ${Expressions.UNIMPRESSED}`],
                expression: Expressions.UNIMPRESSED,
            },
            {
                id: 'exp6',
                title: 'im so worried rn',
                content: [`Expressions.WORRIED ${Expressions.WORRIED}`],
                expression: Expressions.WORRIED,
            },
            {
                id: 'exp7',
                title: 'im so amazed rn',
                content: [`Expressions.AMAZED ${Expressions.AMAZED}`],
                expression: Expressions.AMAZED,
            },
            {
                id: 'exp8',
                title: 'im so confused rn',
                content: [`Expressions.CONFUSED ${Expressions.CONFUSED}`],
                expression: Expressions.CONFUSED,
            },
            {
                id: 'exp9',
                title: 'im so motivated rn',
                content: [`Expressions.MOTIVATED ${Expressions.MOTIVATED}`],
                expression: Expressions.MOTIVATED,
            },
        ],
        allowSkip: true,
    }
}
