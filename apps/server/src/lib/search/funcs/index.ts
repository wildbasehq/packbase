/**
 * Search Function Plugins
 * 
 * This directory contains function definitions that can be used in search query pipelines.
 * Each function file exports a FunctionDefinition that is automatically loaded at startup.
 * 
 * To add a new function:
 * 1. Create a new .ts file in this directory
 * 2. Export a FunctionDefinition as the default export
 * 3. The function will be automatically registered on server startup
 * 
 * Function categories:
 * - aggregation: Functions that reduce result sets (COUNT, UNIQUE, FIRST, LAST)
 * - transform: Functions that transform/filter result sets (PAGE, SORT, FILTER)
 * - loader: Functions that enrich data (BULKPOSTLOAD)
 */

export {countFunction} from './count'
export {uniqueFunction} from './unique'
export {firstFunction} from './first'
export {lastFunction} from './last'
export {pageFunction} from './page'
export {bulkPostLoadFunction} from './bulkpostload'
