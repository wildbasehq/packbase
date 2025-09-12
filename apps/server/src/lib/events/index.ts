/*
 * Event/Hook system for server-wide signals.
 *
 * Provides a WordPress-like hook mechanism where listeners can subscribe to
 * named triggers and receive/transform data in sequence.
 *
 * I miss you, WordPress.
 */

/**
 * A function signature for trigger listeners.
 *
 * A listener may synchronously or asynchronously return the (possibly
 * transformed) data. If a listener returns `undefined`, the previous data value
 * is preserved and passed to the next listener.
 */
export type TriggerListener<T> = (data: T) => T | Promise<T> | undefined | Promise<undefined>;

/**
 * Map of trigger names to their associated payload types.
 *
 * Projects may declare a more specific map and use it with the generic
 * parameter of TriggerBus to achieve end-to-end type safety.
 */
export type TriggerMap = Record<string, unknown>;

/**
 * Subscription handle allowing a listener to be removed.
 */
export interface Subscription {
    /**
     * Unsubscribe the associated listener.
     */
    unsubscribe(): void;
}

/**
 * A minimal, typed event bus that manages named triggers.
 *
 * Listeners are executed in registration order. Each listener receives the
 * latest data and may return a new value to be forwarded to the next listener.
 * If a listener throws, the error is propagated and subsequent listeners are
 * not executed.
 *
 * Types are provided per-call instead of via a global TriggerMap. Example:
 *   bus.on<'HOWL_CREATE', { someKey: string }>('HOWL_CREATE', data => data);
 */
export class TriggerBus {
    private readonly listeners: Map<string, Set<TriggerListener<any>>> = new Map();

    /**
     * Register a listener for a trigger name.
     *
     * @typeParam Name - The trigger name as a string literal type.
     * @typeParam Payload - The payload type for this trigger.
     * @param name - The trigger name.
     * @param listener - Callback executed when the trigger is fired.
     * @returns A subscription handle to remove the listener.
     */
    on<Name extends string, Payload = unknown>(name: Name, listener: TriggerListener<Payload>): Subscription {
        let set = this.listeners.get(name);
        if (!set) {
            set = new Set();
            this.listeners.set(name, set);
        }
        set.add(listener as TriggerListener<any>);
        return {
            unsubscribe: () => {
                const current = this.listeners.get(name);
                if (current) {
                    current.delete(listener as TriggerListener<any>);
                    if (current.size === 0) this.listeners.delete(name);
                }
            },
        };
    }

    /**
     * Register a one-time listener for a trigger name. The listener is removed
     * after the first invocation.
     *
     * @typeParam Name - The trigger name as a string literal type.
     * @typeParam Payload - The payload type for this trigger.
     * @param name - The trigger name.
     * @param listener - Callback executed when the trigger is fired.
     * @returns A subscription handle to remove the listener early if needed.
     */
    once<Name extends string, Payload = unknown>(name: Name, listener: TriggerListener<Payload>): Subscription {
        const sub = this.on<Name, Payload>(name, async (data: Payload) => {
            try {
                const result = await listener(data);
                return (result === undefined ? data : result) as Payload;
            } finally {
                sub.unsubscribe();
            }
        });
        return sub;
    }

    /**
     * Remove a previously registered listener.
     *
     * @typeParam Name - The trigger name as a string literal type.
     * @typeParam Payload - The payload type for this trigger.
     * @param name - The trigger name.
     * @param listener - The same function reference passed to on/listenForTrigger.
     * @returns true if the listener was removed; false otherwise.
     */
    off<Name extends string, Payload = unknown>(name: Name, listener: TriggerListener<Payload>): boolean {
        const set = this.listeners.get(name);
        if (!set) return false;
        const had = set.delete(listener as TriggerListener<any>);
        if (set.size === 0) this.listeners.delete(name);
        return had;
    }

    /**
     * Determine whether the given trigger has any listeners.
     *
     * @typeParam Name - The trigger name as a string literal type.
     * @param name - The trigger name.
     */
    hasListeners<Name extends string>(name: Name): boolean {
        const set = this.listeners.get(name);
        return !!set && set.size > 0;
    }

    /**
     * Remove all listeners for a specific trigger or for all triggers.
     *
     * @typeParam Name - The trigger name as a string literal type.
     * @param name - The trigger name. If omitted, clears all triggers.
     */
    clear<Name extends string>(name?: Name): void {
        if (name) this.listeners.delete(name);
        else this.listeners.clear();
    }

    /**
     * Fire a trigger and pass data through all listeners in registration order.
     *
     * Each listener receives the latest data value and may return a new value.
     * Returning `undefined` preserves the current data value. Listeners may be
     * asynchronous. If any listener throws, the error is propagated and no further
     * listeners are executed.
     *
     * @typeParam Name - The trigger name as a string literal type.
     * @typeParam Payload - The payload type for this trigger.
     * @param name - The trigger name.
     * @param data - The initial data to pass to listeners.
     * @returns The final data after all listeners have run.
     */
    async trigger<Name extends string, Payload = unknown>(name: Name, data: Payload): Promise<Payload> {
        const set = this.listeners.get(name);
        if (!set || set.size === 0) return data;

        let current: Payload = data;
        // Preserve execution order: use a snapshot to avoid mutation during iteration.
        const snapshot = Array.from(set);
        for (const fn of snapshot) {
            const result = await (fn as TriggerListener<Payload>)(current);
            if (result !== undefined) {
                current = result;
            }
        }
        return current;
    }
}

/**
 * Global singleton instance for convenience across the server.
 *
 * Projects may import this for shared triggers (e.g., "HOWL_CREATE", "PACK_UPDATE").
 */
export const Baozi = new TriggerBus();

export default Baozi;
