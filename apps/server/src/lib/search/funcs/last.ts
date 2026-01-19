import {z} from 'zod'
import {FunctionDefinition, ExecutionContext} from '../types'

/**
 * LAST aggregation function.
 * Returns the last item from the input results.
 */
export const lastFunction: FunctionDefinition<Record<string, never>, any[], any[]> = {
    name: 'LAST',
    namespace: 'agg',
    category: 'aggregation',
    argsSchema: z.object({}),
    inputType: 'any',
    outputType: 'values',
    description: 'Returns only the last item from the result set. Takes no arguments.',
    
    async execute(_args: Record<string, never>, context: ExecutionContext): Promise<any[]> {
        if (context.inputResults.length === 0) {
            return []
        }
        return [context.inputResults[context.inputResults.length - 1]]
    }
}

export default lastFunction
