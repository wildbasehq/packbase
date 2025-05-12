// Type definitions for search functionality

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  url: string;
  category?: string;
  timestamp?: string;
}

export interface SearchRequestParams {
  query: string;
}
