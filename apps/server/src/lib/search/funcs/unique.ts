import {z} from 'zod'
import {FunctionDefinition, ExecutionContext} from '../types'

/**
 * UNIQUE aggregation function.
 * Returns unique values from the input results.
 */
export const uniqueFunction: FunctionDefinition<Record<string, never>, any[], any[]> = {
    name: 'UNIQUE',
    namespace: 'agg',
    category: 'aggregation',
    argsSchema: z.object({}),
    inputType: 'any',
    outputType: 'values',
    description: 'Returns unique values from the result set, removing duplicates. Takes no arguments.',
    
    async execute(_args: Record<string, never>, context: ExecutionContext): Promise<any[]> {
        const seen = new Set<string>()
        const unique: any[] = []
        
        for (const item of context.inputResults) {
            // Create a stable key for deduplication
            const key = typeof item === 'object' && item !== null
                ? JSON.stringify(item)
                : String(item)
            
            if (!seen.has(key)) {
                seen.add(key)
                unique.push(item)
            }
        }
        
        return unique
    }
}

export default uniqueFunction
