import {z} from 'zod'
import {FunctionDefinition, ExecutionContext} from '../types'

/** Arguments schema for PAGE function */
const pageArgsSchema = z.object({
    skip: z.number().int().min(0).default(0),
    take: z.number().int().min(1).max(100).default(20)
})

type PageArgs = z.infer<typeof pageArgsSchema>

/**
 * PAGE transform function.
 * Applies pagination (skip/take) to the input results.
 */
export const pageFunction: FunctionDefinition<PageArgs, any[], any[]> = {
    name: 'PAGE',
    category: 'transform',
    argsSchema: pageArgsSchema,
    inputType: 'any',
    outputType: 'rows',
    description: 'Applies pagination to the result set. Arguments: skip (number of items to skip), take (number of items to return).',
    
    async execute(args: PageArgs, context: ExecutionContext): Promise<any[]> {
        const {skip, take} = args
        const results = context.inputResults
        
        // Calculate if there are more results
        const totalAvailable = results.length
        const endIdx = skip + take
        context.hasMore = endIdx < totalAvailable
        
        // Apply pagination
        return results.slice(skip, endIdx)
    }
}

export default pageFunction
