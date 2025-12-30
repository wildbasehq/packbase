
export type Chapter = {
    id: string;
    title: string;
    content: any; // content is a JSON object for Tiptap
};

export type Book = {
    id: string;
    title: string;
    author: string;
    summary: string;
    coverUrl?: string; // Optional cover image URL
    chapters: Chapter[];
};

const MOCK_BOOKS: Book[] = [
    {
        id: '1',
        title: 'The Great Adventure',
        author: 'Jane Doe',
        summary: 'An epic tale of discovery and danger.',
        coverUrl: 'https://placehold.co/400x600/png',
        chapters: [
            {
                id: 'c1',
                title: 'Chapter 1: The Beginning',
                content: {
                    type: 'doc',
                    content: [
                        {
                            type: 'heading',
                            attrs: { level: 2 },
                            content: [{ type: 'text', text: 'The Beginning' }],
                        },
                        {
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'It was a dark and stormy night...' }],
                        },
                    ],
                },
            },
            {
                id: 'c2',
                title: 'Chapter 2: The Middle',
                content: {
                    type: 'doc',
                    content: [
                        {
                            type: 'heading',
                            attrs: { level: 2 },
                            content: [{ type: 'text', text: 'The Middle' }],
                        },
                        {
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'Things got complicated.' }],
                        },
                    ],
                },
            },
        ],
    },
    {
        id: '2',
        title: 'Coding for Dummies',
        author: 'John Smith',
        summary: 'Learn to code in 24 hours!',
        chapters: [],
    },
];

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getBooks(): Promise<Book[]> {
    await delay(500);
    return MOCK_BOOKS;
}

export async function getBook(id: string): Promise<Book | undefined> {
    await delay(500);
    return MOCK_BOOKS.find((b) => b.id === id);
}

export async function saveBook(book: Book): Promise<Book> {
    await delay(800);
    console.log('API: Saving book...', book);
    // In a real app, we would update the backend here.
    // For now, we'll just return the book as if it was saved.
    const index = MOCK_BOOKS.findIndex(b => b.id === book.id);
    if (index !== -1) {
        MOCK_BOOKS[index] = book;
    } else {
        MOCK_BOOKS.push(book);
    }
    return book;
}

export async function createBook(partialBook: Partial<Book>): Promise<Book> {
    await delay(800);
    const newBook: Book = {
        id: Math.random().toString(36).substring(7),
        title: partialBook.title || 'Untitled',
        author: partialBook.author || 'Unknown',
        summary: partialBook.summary || '',
        coverUrl: partialBook.coverUrl,
        chapters: partialBook.chapters || [{
            id: Math.random().toString(36).substring(7),
            title: 'Chapter 1',
            content: { type: 'doc', content: [] } // Empty content
        }],
    };
    MOCK_BOOKS.push(newBook);
    return newBook;
}
