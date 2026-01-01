import {Book, createBook, getBooks} from '@/lib/api/books'
import {Button, Heading, LoadingSpinner, LogoSpinner, Text} from '@/src/components'
import {BookOpenIcon, PlusIcon} from '@heroicons/react/24/outline'
import {useEffect, useState} from 'react'
import {Link, useLocation} from 'wouter'

export default function BookList() {
    const [books, setBooks] = useState<Book[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [, setLocation] = useLocation()

    useEffect(() => {
        setLoading(true)
        getBooks().then((data) => {
            setBooks(data)
            setLoading(false)
        })
    }, [])

    const handleCreateBook = async () => {
        setCreating(true)
        try {
            const newBook = await createBook({title: 'New Story'})
            setLocation(`~/books/${newBook.id}`)
        } catch (e) {
            console.error(e)
            setCreating(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <LogoSpinner/>
            </div>
        )
    }

    return (
        <div className="mx-auto px-6 py-12 max-w-6xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <Heading size="2xl">Your Books</Heading>
                    <Text alt>Manage your stories and publications.</Text>
                </div>
                <Button
                    color="indigo"
                    disabled={creating}
                    onClick={handleCreateBook}>
                    {creating ? <LoadingSpinner className="w-4 h-4"/> : <PlusIcon className="w-5 h-5"/>}
                    New Book
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {books.map((book) => (
                    <Link key={book.id} href={`~/books/${book.id}`}>
                        <div
                            className="group relative bg-card ring-1 ring-border rounded-xl overflow-hidden hover:ring-2 transition-all cursor-pointer h-full flex flex-col">
                            <div className="aspect-2/3 w-full bg-muted relative overflow-hidden">
                                {book.coverUrl ? (
                                    <img src={book.coverUrl} alt={book.title}
                                         className="w-full h-full object-cover"/>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                        <BookOpenIcon className="w-16 h-16"/>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"/>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <h3 className="text-lg font-bold mb-1 line-clamp-2">{book.title}</h3>
                                <p className="text-sm text-foreground/80 mb-2">{book.author}</p>
                                <p className="text-xs text-muted-foreground line-clamp-3 mb-4 flex-1">{book.summary || 'No summary'}</p>
                                <div className="text-xs text-muted-foreground/60 font-mono">
                                    {book.chapters.length} chapter{book.chapters.length !== 1 && 's'}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
