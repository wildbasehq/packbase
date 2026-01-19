import {z} from 'zod'
import {FunctionDefinition, ExecutionContext} from '../types'

/**
 * FIRST aggregation function.
 * Returns the first item from the input results.
 */
export const firstFunction: FunctionDefinition<Record<string, never>, any[], any[]> = {
    name: 'FIRST',
    namespace: 'agg',
    category: 'aggregation',
    argsSchema: z.object({}),
    inputType: 'any',
    outputType: 'values',
    description: 'Returns only the first item from the result set. Takes no arguments.',
    
    async execute(_args: Record<string, never>, context: ExecutionContext): Promise<any[]> {
        if (context.inputResults.length === 0) {
            return []
        }
        return [context.inputResults[0]]
    }
}

export default firstFunction
