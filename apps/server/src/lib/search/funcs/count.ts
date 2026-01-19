import {z} from 'zod'
import {FunctionDefinition, ExecutionContext} from '../types'

/**
 * COUNT aggregation function.
 * Returns the count of items in the input results.
 */
export const countFunction: FunctionDefinition<Record<string, never>, any[], number[]> = {
    name: 'COUNT',
    namespace: 'agg',
    category: 'aggregation',
    argsSchema: z.object({}),
    inputType: 'any',
    outputType: 'count',
    description: 'Returns the count of items in the result set. Takes no arguments.',
    
    async execute(_args: Record<string, never>, context: ExecutionContext): Promise<number[]> {
        const count = context.inputResults.length
        return [count]
    }
}

export default countFunction
