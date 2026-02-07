import {TableExtension} from '../schema'

/**
 * Posts table extension.
 * Configures search weights to favor title matches over body matches.
 */
export const postsExtension: TableExtension = {
    tableName: 'posts',

    searchWeights: {
        title: 2.0,      // Title matches weighted 2x
        body: 1.0,       // Body matches at baseline
        tags: 1.5,       // Tags slightly weighted
        warning: 0.5     // Warning text less important
    },

    aliases: {
        text: 'body',           // "text" aliases to "body"
        content: 'body',        // "content" aliases to "body"
        author: 'user_id',      // "author" aliases to "user_id"
        created: 'created_at',  // "created" aliases to "created_at"
        type: 'content_type'    // "type" aliases to "content_type"
    },

    defaultSort: {
        column: 'created_at',
        direction: 'desc'
    },

    excludeFromSelect: [
        // Don't include these in SELECT * by default
    ],

    columnTypes: {
        tags: 'string_array'  // Override: tags is a String[] array field
    }
}

export default postsExtension
