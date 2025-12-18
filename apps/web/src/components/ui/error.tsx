import type {ErrorInfo, ReactNode} from 'react';
import React from 'react';
import {Alert, AlertTitle, Button, Code, CodeGroup, Heading} from "@/src/components";
import {Text} from "@/components/shared/text.tsx";
import SadComputerIcon from "@/components/icons/sad-computer.tsx";
import Link from "@/components/shared/link.tsx";
import {ArrowUpRightIcon} from "@heroicons/react/20/solid";
import Tooltip from "@/components/shared/tooltip.tsx";

type ErrorBoundaryProps = {
    children: ReactNode;
    /**
     * A React node or a render function that receives (error, reset)
     * and returns a React node to display when an error occurs.
     */
    fallback?: ReactNode | ((error: unknown, reset: () => void) => ReactNode);
    /**
     * Optional error handler. Receives the error and component stack.
     */
    onError?: (error: unknown, info: { componentStack: string }) => void;
    /**
     * Called when the boundary is reset via the default "Try again" button
     * or when the provided `reset` function is invoked in a render fallback.
     */
    onReset?: () => void;
};

type ErrorBoundaryState = {
    hasError: boolean;
    error: unknown | null;
};

class ErrorBoundaryImpl extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = {
        hasError: false,
        error: null,
    };

    static getDerivedStateFromError(error: unknown): Partial<ErrorBoundaryState> {
        return {hasError: true, error};
    }

    componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
        // Allow consumers to handle/log errors
        this.props.onError?.(error, {componentStack: errorInfo.componentStack});
        // Basic console output for visibility during development
        // eslint-disable-next-line no-console
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    reset = () => {
        this.setState({hasError: false, error: null});
        this.props.onReset?.();
    };

    render() {
        if (this.state.hasError) {
            const {fallback} = this.props;

            if (typeof fallback === 'function') {
                return fallback(this.state.error, this.reset);
            }

            if (fallback) {
                return <>{fallback}</>;
            }

            // Default fallback UI
            return (
                <Alert className="flex !justify-center !items-center w-screen h-screen !rounded-none !border-0">
                    <div className="flex flex-col max-w-6xl">
                        <div className="flex items-center gap-4">
                            <AlertTitle>
                                <SadComputerIcon className="h-12 w-fit"/>
                            </AlertTitle>
                            <div className="flex flex-col">
                                <Heading>
                                    Failure: {this.state.error instanceof Error ? this.state.error.message : 'Something went wrong'}
                                </Heading>
                                <Text>
                                    A critical component crashed and can't
                                    recover. {navigator.appName === 'Packbase' ? "You'll need to restart this software entirely." : "Reload this page to try again."}
                                    <br/>
                                    This shouldn't happen. <Link href="https://discord.gg/StuuK55gYA" target="_blank"
                                                                 className="text-indigo-500">Report it <ArrowUpRightIcon
                                    className="h-4 w-4 inline-flex"/></Link>,
                                    otherwise it will never be fixed.
                                    <br/>
                                    Disable any ad-blockers or trackers for us to properly collect error data (via
                                    Sentry, PII OFF). This will the first thing we'd ask you to do if a fix isn't
                                    immediately obvious.
                                </Text>
                                <div className="space-x-2 mt-4">
                                    <Button href="https://work.wildbase.xyz">
                                        Report <ArrowUpRightIcon className="h-4 w-4 inline-flex"/>
                                    </Button>
                                    <Tooltip
                                        content="Doing this puts Packbase in an extremely unstable state. Only do this if there's specific content you need to recover.">
                                        <Button plain onClick={this.reset}>
                                            Soft Reset
                                        </Button>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                        <CodeGroup title="Context"
                                   code={this.state.error instanceof Error ? this.state.error.message : 'No error message available'}>
                            <Code
                                title="String">{this.state.error instanceof Error ? this.state.error.stack?.split('\n').slice(0, 5).join('\n') : 'No stack trace available'}</Code>
                        </CodeGroup>
                    </div>
                </Alert>
            );
        }

        return this.props.children;
    }
}

// @ts-ignore
ErrorBoundaryImpl.displayName = 'ErrorBoundary';

export default function ErrorBoundary(props: ErrorBoundaryProps) {
    return <ErrorBoundaryImpl {...props} />;
}