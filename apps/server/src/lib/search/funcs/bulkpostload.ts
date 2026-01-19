import {z} from 'zod'
import {BulkPostLoader} from '@/lib/BulkPostLoader'
import {FunctionDefinition, ExecutionContext} from '../types'

/** Arguments schema for BULKPOSTLOAD function */
const bulkPostLoadArgsSchema = z.object({})

type BulkPostLoadArgs = z.infer<typeof bulkPostLoadArgsSchema>

/**
 * BULKPOSTLOAD loader function.
 * Enriches post IDs with full post data including user profiles, reactions, etc.
 */
export const bulkPostLoadFunction: FunctionDefinition<BulkPostLoadArgs, any[], any[]> = {
    name: 'BULKPOSTLOAD',
    namespace: 'loader',
    category: 'loader',
    argsSchema: bulkPostLoadArgsSchema,
    inputType: 'values',  // Expects array of post IDs
    outputType: 'posts',  // Returns enriched post objects
    description: 'Enriches post IDs with full post data including user profiles, reactions, and comments. Optional userId argument provides context for user-specific data.',
    
    async execute(args: BulkPostLoadArgs, context: ExecutionContext): Promise<any[]> {
        // Extract post IDs from input
        let postIds: string[] = context.inputResults
            .map(item => {
                // Handle both raw IDs and objects with id property
                if (typeof item === 'string') return item
                if (typeof item === 'object' && item !== null && 'id' in item) return item.id
                return null
            })
            .filter((id): id is string => id !== null)
        
        if (postIds.length === 0) {
            return []
        }
        
        // Resolve userId from args or context
        let currentUserId = context.userId
        
        // Use BulkPostLoader to enrich the posts
        const loader = new BulkPostLoader()
        const postsMap = await loader.loadPosts(postIds, currentUserId)
        
        // Convert map to array maintaining order
        const enrichedPosts = postIds
            .map(id => postsMap[id])
            .filter(Boolean)
        
        return enrichedPosts
    }
}

export default bulkPostLoadFunction
