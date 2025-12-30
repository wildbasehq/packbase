/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {WorkerLinter} from 'harper.js'

/**
 * Packbase SDK (v2): Class-based global event bus with IndexedDB persistence for plugins and their functions.
 * Not backwards compatible with previous API.
 */

// Event data structure
export interface PackbaseEventData {
    type: string
    data: any
    timestamp: number
    source: string
}

// Plugin information interface
export interface PluginInfo {
    name: string
    version: string
    author: string
    description: string
    permissions?: string[]
}

type PluginFunctionMap = Map<string, Function>

interface StoredPluginRecord {
    id: string
    info: PluginInfo
}

interface StoredFunctionRecord {
    id: string // `${pluginId}:${functionName}`
    pluginId: string
    name: string
    code: string // serialized function via fn.toString()
}

declare global {
    interface Window {
        Packbase: Packbase
        harper: WorkerLinter
    }
}

class Packbase {
    public readonly version = '2.0.0'

    private readonly eventListeners = new Map<string, Set<(data: PackbaseEventData) => void>>()
    private pluginFunctions = new Map<string, PluginFunctionMap>()
    private registeredPlugins = new Map<string, PluginInfo>()

    private readonly idbSupported = typeof window !== 'undefined' && 'indexedDB' in window
    private dbPromise: Promise<IDBDatabase> | null = null
    private log = {
        debug: (msg: string, ...args: any[]) => log.debug('Packbase SDK', msg, ...args),
        info: (msg: string, ...args: any[]) => log.info('Packbase SDK', msg, ...args),
        warn: (msg: string, ...args: any[]) => log.warn('Packbase SDK', msg, ...args),
        error: (msg: string, ...args: any[]) => log.error('Packbase SDK', msg, ...args),
    }

    // ------------- Event API -------------

    constructor() {
        console.log(
            `%c      _
__/\\_| |__   __ _ ___  ___
\\    / '_ \\ / _\` / __|/ _ \\
/_  _\\ |_) | (_| \\__ \\  __/
  \\/ |_.__/ \\__,_|___/\\___|

  (c) Wildbase 2025
`,
            'color: #ff6b35;'
        )

        console.log('')
        console.log('Welcome. Don\'t run random scripts people send to you. That\'d be fucking stupid as shit.')
        console.log('')

        if (this.idbSupported) {
            this.openDB()
                .then(() => this.restoreFromDB())
                .then(() => this.log.info('IndexedDB state restored'))
                .catch(err => this.log.warn('IndexedDB init failed:', err))
        } else {
            this.log.info('IndexedDB not supported; running in memory-only mode')
        }
    }

    on(eventName: string, callback: (data: PackbaseEventData) => void): () => void {
        this.log.info(`on(): ${eventName}`)
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, new Set())
        }
        const listeners = this.eventListeners.get(eventName)!
        listeners.add(callback)
        return () => this.off(eventName, callback)
    }

    off(eventName: string, callback: (data: PackbaseEventData) => void): void {
        const listeners = this.eventListeners.get(eventName)
        if (!listeners) return
        listeners.delete(callback)
        if (listeners.size === 0) {
            this.eventListeners.delete(eventName)
        }
    }

    once(eventName: string, callback: (data: PackbaseEventData) => void): void {
        const wrapper = (data: PackbaseEventData) => {
            this.off(eventName, wrapper)
            callback(data)
        }
        this.on(eventName, wrapper)
    }

    // ------------- Plugin API -------------

    emit(eventName: string, data: any): void {
        const eventData: PackbaseEventData = {
            type: eventName,
            data,
            timestamp: Date.now(),
            source: 'Packbase',
        }

        const listeners = this.eventListeners.get(eventName)
        if (listeners) {
            for (const cb of listeners) {
                try {
                    cb(eventData)
                } catch (e) {
                    this.log.error('Packbas SDK', `Error in listener for '${eventName}':`, e)
                }
            }
        }
        this.debugEvent(eventData)
    }

    registerPlugin(pluginInfo: PluginInfo, functions?: Record<string, Function>): string {
        const id = this.generatePluginId(pluginInfo)
        this.registeredPlugins.set(id, pluginInfo)
        this.emit('plugin:registered', {pluginId: id, pluginInfo})

        // Persist plugin and optionally functions (async, fire-and-forget)
        if (this.idbSupported) {
            this.savePluginToDB(id, pluginInfo).catch(e => this.log.warn('Persist plugin failed:', e))
            if (functions) {
                this.registerFunctions(id, functions).catch(e => this.log.warn('Persist functions failed:', e))
            }
        } else if (functions) {
            // Memory-only function registration
            this.ensureFunctionMap(id)
            for (const [name, fn] of Object.entries(functions)) {
                this.pluginFunctions.get(id)!.set(name, fn)
            }
        }

        return id
    }

    async registerFunctions(pluginId: string, functions: Record<string, Function>): Promise<void> {
        if (!this.registeredPlugins.has(pluginId)) {
            throw new Error(`Plugin ${pluginId} is not registered`)
        }
        this.ensureFunctionMap(pluginId)
        const fnMap = this.pluginFunctions.get(pluginId)!
        for (const [name, fn] of Object.entries(functions)) {
            fnMap.set(name, fn)
            if (this.idbSupported) {
                await this.saveFunctionToDB(pluginId, name, fn)
            }
        }
    }

    async unregisterPlugin(pluginId: string): Promise<boolean> {
        const existed = this.registeredPlugins.delete(pluginId)
        this.pluginFunctions.delete(pluginId)

        if (existed && this.idbSupported) {
            try {
                await this.deletePluginFromDB(pluginId)
                await this.deleteFunctionsForPluginFromDB(pluginId)
            } catch (e) {
                this.log.warn('Unregister plugin DB cleanup failed:', e)
            }
        }

        if (existed) {
            this.emit('plugin:unregistered', {pluginId})
        }
        return existed
    }

    getRegisteredPlugins(): PluginInfo[] {
        return Array.from(this.registeredPlugins.values())
    }

    getPluginFunctions(pluginId: string): Record<string, Function> {
        const map = this.pluginFunctions.get(pluginId)
        if (!map) return {}
        const out: Record<string, Function> = {}
        for (const [name, fn] of map.entries()) out[name] = fn
        return out
    }

    // ------------- IndexedDB (private) -------------

    async callPluginFunction<T = any>(pluginId: string, functionName: string, ...args: any[]): Promise<T> {
        const map = this.pluginFunctions.get(pluginId)
        if (!map) throw new Error(`No functions registered for plugin ${pluginId}`)
        const fn = map.get(functionName)
        if (!fn) throw new Error(`Function '${functionName}' not found for plugin ${pluginId}`)
        const result = fn(...args)
        return result instanceof Promise ? await result : (result as T)
    }

    private openDB(): Promise<IDBDatabase> {
        if (this.dbPromise) return this.dbPromise
        if (!this.idbSupported) {
            this.dbPromise = Promise.reject(new Error('IndexedDB not supported'))
            return this.dbPromise
        }

        this.dbPromise = new Promise((resolve, reject) => {
            const request = window.indexedDB.open('PackbaseSDK', 1)
            request.onupgradeneeded = () => {
                const db = request.result
                if (!db.objectStoreNames.contains('plugins')) {
                    db.createObjectStore('plugins', {keyPath: 'id'})
                }
                if (!db.objectStoreNames.contains('functions')) {
                    const store = db.createObjectStore('functions', {keyPath: 'id'})
                    store.createIndex('by_plugin', 'pluginId', {unique: false})
                }
            }
            request.onsuccess = () => resolve(request.result)
            request.onerror = () => reject(request.error)
        })
        return this.dbPromise
    }

    private async savePluginToDB(id: string, info: PluginInfo): Promise<void> {
        const db = await this.openDB()
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(['plugins'], 'readwrite')
            tx.oncomplete = () => resolve()
            tx.onerror = () => reject(tx.error)
            const store = tx.objectStore('plugins')
            const record: StoredPluginRecord = {id, info}
            store.put(record)
        })
    }

    private async deletePluginFromDB(id: string): Promise<void> {
        const db = await this.openDB()
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(['plugins'], 'readwrite')
            tx.oncomplete = () => resolve()
            tx.onerror = () => reject(tx.error)
            tx.objectStore('plugins').delete(id)
        })
    }

    private async saveFunctionToDB(pluginId: string, name: string, fn: Function): Promise<void> {
        const db = await this.openDB()
        const id = `${pluginId}:${name}`
        const code = this.serializeFunction(fn)
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(['functions'], 'readwrite')
            tx.oncomplete = () => resolve()
            tx.onerror = () => reject(tx.error)
            const store = tx.objectStore('functions')
            const record: StoredFunctionRecord = {id, pluginId, name, code}
            store.put(record)
        })
    }

    private async deleteFunctionsForPluginFromDB(pluginId: string): Promise<void> {
        const db = await this.openDB()
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(['functions'], 'readwrite')
            tx.oncomplete = () => resolve()
            tx.onerror = () => reject(tx.error)
            const store = tx.objectStore('functions')
            const index = store.index('by_plugin')
            const range = IDBKeyRange.only(pluginId)
            index.openCursor(range).onsuccess = (ev) => {
                const cursor = (ev.target as IDBRequest<IDBCursorWithValue>).result
                if (cursor) {
                    store.delete(cursor.primaryKey as IDBValidKey)
                    cursor.continue()
                }
            }
        })
    }

    // ------------- Utils (private) -------------

    private async restoreFromDB(): Promise<void> {
        const db = await this.openDB()

        // Load plugins and functions concurrently
        const [plugins, functions] = await Promise.all([
            this.getAllFromStore<StoredPluginRecord>(db, 'plugins'),
            this.getAllFromStore<StoredFunctionRecord>(db, 'functions')
        ])

        // Create a Map of plugin records for O(1) lookups
        const pluginMap = new Map(
            plugins.map(rec => [rec.id, rec.info])
        )
        this.registeredPlugins = pluginMap

        // Process functions in a single pass
        this.pluginFunctions = functions.reduce((acc, fnRec) => {
            if (!pluginMap.has(fnRec.pluginId)) return acc

            if (!acc.has(fnRec.pluginId)) {
                acc.set(fnRec.pluginId, new Map())
            }

            const reconstructed = this.deserializeFunction(fnRec.code)
            if (reconstructed) {
                acc.get(fnRec.pluginId)!.set(fnRec.name, reconstructed)
            }

            return acc
        }, new Map<string, Map<string, Function>>())
    }

    private debugEvent(evt: PackbaseEventData) {
        // eslint-disable-next-line no-console
        this.log.debug('Event emitted:', evt.type, evt)
    }

    private generatePluginId(pluginInfo: PluginInfo): string {
        const base = pluginInfo.name.toLowerCase().replace(/\s+/g, '-')
        return `${base}-${Date.now()}`
    }

    private ensureFunctionMap(pluginId: string) {
        if (!this.pluginFunctions.has(pluginId)) {
            this.pluginFunctions.set(pluginId, new Map())
        }
    }

    private serializeFunction(fn: Function): string {
        // Store source code string
        return fn.toString()
    }

    private deserializeFunction(code: string): Function | null {
        // Attempt to reconstruct function from stored source
        try {
            // Wrap to evaluate as expression and return the function
            // eslint-disable-next-line no-new-func
            const factory = new Function(`return (${code})`)
            const result = factory()
            if (typeof result === 'function') return result
            return null
        } catch (e) {
            this.log.warn('Failed to deserialize function:', e)
            return null
        }
    }

    // Helper to read all rows from a store with runtime getAll detection
    private async getAllFromStore<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
        return new Promise<T[]>((resolve, reject) => {
            const tx = db.transaction([storeName], 'readonly')
            tx.onerror = () => reject(tx.error)
            const store = tx.objectStore(storeName)

            // Use any-cast to avoid TS narrowing 'else' branch to never
            const maybeGetAll = (store as any).getAll as undefined | (() => IDBRequest<T[]>)

            if (typeof maybeGetAll === 'function') {
                const req = maybeGetAll.call(store) as IDBRequest<T[]>
                req.onsuccess = () => resolve(req.result as T[])
                req.onerror = () => reject(req.error)
            } else {
                const results: T[] = []
                const req = store.openCursor() as IDBRequest<IDBCursorWithValue>
                req.onsuccess = () => {
                    const cursor = req.result
                    if (cursor) {
                        results.push(cursor.value as T)
                        cursor.continue()
                    } else {
                        resolve(results)
                    }
                }
                req.onerror = () => reject(req.error)
            }
        })
    }
}

// Create a singleton instance and attach to window
const PackbaseInstance = new Packbase()
if (typeof window !== 'undefined') {
    window.Packbase = PackbaseInstance
}

// Default export: instance
export default PackbaseInstance
