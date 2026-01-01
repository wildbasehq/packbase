import Modal from '@/components/modal'
import {Editor} from '@/components/novel'
import {Resizable} from '@/components/ui/resizable-panel'
import {Book, Chapter, getBook, saveBook} from '@/lib/api/books'
import getCroppedImg from '@/lib/cropImage'
import {BookSidebarPortal} from '@/pages/books/layout'
import {Button, Field, Heading, Input, Label, LogoSpinner, Text, Textarea} from '@/src/components'
import PaperTextureDark from '@/src/images/png/paper-texture-dark.png'
import PaperTextureLight from '@/src/images/png/paper-texture.png'
import {Bars3Icon, PhotoIcon, PlusIcon, TrashIcon} from '@heroicons/react/24/outline'

import {Color} from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import {TaskItem} from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'

import {Reorder} from 'motion/react'
import {MouseEvent, useCallback, useEffect, useState} from 'react'
import {useDropzone} from 'react-dropzone'
import Cropper, {Area} from 'react-easy-crop'
import {toast} from 'sonner'
import {useDebouncedCallback} from 'use-debounce'
import {useDarkMode} from 'usehooks-ts'
import {useParams} from 'wouter'

export default function BookEditor() {
    const {id} = useParams<{ id: string }>()
    const [book, setBook] = useState<Book | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const {isDarkMode} = useDarkMode({
        defaultValue: true
    })

    // Cropping state
    const [cropModalOpen, setCropModalOpen] = useState(false)
    const [tempImageSrc, setTempImageSrc] = useState<string | null>(null)
    const [crop, setCrop] = useState({x: 0, y: 0})
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

    // Load book
    useEffect(() => {
        if (!id) return
        setLoading(true)
        getBook(id).then((b) => {
            setBook(b || null)
            if (b && b.chapters.length > 0) {
                setSelectedChapterId(b.chapters[0].id)
            }
            setLoading(false)
        })
    }, [id])

    // Auto-save debounced
    const debouncedSave = useDebouncedCallback(async (currentBook: Book) => {
        setSaving(true)
        try {
            await saveBook(currentBook)
        } catch (e) {
            toast.error('Failed to save book')
        } finally {
            setSaving(false)
        }
    }, 2000)

    const updateBook = useCallback((updates: Partial<Book>) => {
        setBook((prev) => {
            if (!prev) return null
            const newBook = {...prev, ...updates}
            debouncedSave(newBook)
            return newBook
        })
    }, [debouncedSave])

    const updateChapter = useCallback((chapterId: string, updates: Partial<Chapter>) => {
        setBook((prev) => {
            if (!prev) return null
            const newChapters = prev.chapters.map((c) =>
                c.id === chapterId ? {...c, ...updates} : c
            )
            const newBook = {...prev, chapters: newChapters}
            debouncedSave(newBook)
            return newBook
        })
    }, [debouncedSave])

    const addChapter = () => {
        if (!book) return
        const newChapter: Chapter = {
            id: Math.random().toString(36).substring(7),
            title: 'New Chapter',
            content: {type: 'doc', content: []},
        }
        const newChapters = [...book.chapters, newChapter]
        updateBook({chapters: newChapters})
        setSelectedChapterId(newChapter.id)
    }

    const removeChapter = (chapterId: string, e: MouseEvent) => {
        e.stopPropagation()
        if (!book) return
        // Shift + Click skips confirmation. Got annoying
        if (!e.shiftKey && !confirm('Are you sure you want to delete this chapter?\n\nHold shift to delete without confirming.')) return

        const newChapters = book.chapters.filter((c) => c.id !== chapterId)
        updateBook({chapters: newChapters})
        if (selectedChapterId === chapterId) {
            setSelectedChapterId(newChapters[0]?.id || null)
        }
    }

    const onReorderChapters = (newOrder: Chapter[]) => {
        // Optimistically update
        setBook(prev => prev ? {...prev, chapters: newOrder} : null)
        // Then trigger save
        if (book) debouncedSave({...book, chapters: newOrder})
    }

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string
            setTempImageSrc(dataUrl)
            setCropModalOpen(true)
        }
        reader.readAsDataURL(file)
    }, [])

    const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const saveCroppedImage = useCallback(async () => {
        if (!tempImageSrc || !croppedAreaPixels) return

        try {
            const croppedImage = await getCroppedImg(
                tempImageSrc,
                croppedAreaPixels,
                0 // rotation
            )
            if (croppedImage) {
                updateBook({coverUrl: croppedImage})
                setCropModalOpen(false)
                setTempImageSrc(null)
            }
        } catch (e) {
            console.error(e)
            toast.error('Failed to crop image')
        }
    }, [tempImageSrc, croppedAreaPixels, updateBook])

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <LogoSpinner/>
            </div>
        )
    }

    if (!book) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-bold">Book not found</h2>
                    <p className="text-gray-500">The book you are looking for does not exist.</p>
                </div>
            </div>
        )
    }

    const selectedChapter = book.chapters.find((c) => c.id === selectedChapterId)

    return (
        <>
            <div className="flex md:hidden h-full items-center justify-center">
                <div className="text-center">
                    <Heading size="lg">
                        Editor Unavailable on Small Screens
                    </Heading>
                    <Text>
                        Please use a tablet or desktop to access the book editor. Sorry!
                    </Text>
                </div>
            </div>

            {/* Here so inputs dont reset if just resized too small */}
            <div className="hidden md:flex h-full w-full overflow-hidden bg-background">
                {/* Sidebar */}
                <BookEditorSidebar
                    book={book}
                    updateBook={updateBook}
                    addChapter={addChapter}
                    removeChapter={removeChapter}
                    onReorderChapters={onReorderChapters}
                    selectedChapterId={selectedChapterId}
                    setSelectedChapterId={setSelectedChapterId}
                    onDrop={onDrop}
                    saving={saving}
                />

                {/* Editor Area */}
                <div className="relative grow bg-background overflow-y-auto"
                     style={{
                         backgroundImage: `url(${isDarkMode ? PaperTextureDark : PaperTextureLight})`,
                         backgroundRepeat: 'repeat',
                         backgroundSize: '24rem',
                         backgroundAttachment: 'local'
                     }}
                >

                    {selectedChapter ? (
                        <div className="max-w-4xl mx-auto py-12 px-8">
                            <input
                                type="text"
                                value={selectedChapter.title}
                                onChange={(e) => updateChapter(selectedChapter.id, {title: e.target.value})}
                                className="w-full text-4xl font-bold border-none focus:ring-0 placeholder:text-muted-foreground/30 bg-transparent mb-8"
                                placeholder="Chapter Title"
                            />
                            <div className="min-h-[500px]">
                                <Editor
                                    key={selectedChapter.id} // Force remount on chapter switch to reset content safely
                                    defaultValue={selectedChapter.content}
                                    onDebouncedUpdate={(editor) => {
                                        updateChapter(selectedChapter.id, {content: editor?.getJSON()})
                                    }}
                                    disableLocalStorage={true} // We manage state ourselves
                                    showBubble
                                    className="relative w-full"
                                    extensions={[
                                        Link.configure({
                                            HTMLAttributes: {
                                                class: 'text-stone-400 underline underline-offset-[3px] hover:text-stone-600 transition-colors cursor-pointer',
                                            },
                                        }),
                                        Color,
                                        Highlight.configure({
                                            multicolor: true,
                                        }),
                                        TaskList.configure({
                                            HTMLAttributes: {
                                                class: 'not-prose pl-2',
                                            },
                                        }),
                                        TaskItem.configure({
                                            HTMLAttributes: {
                                                class: 'flex items-start my-4',
                                            },
                                            nested: true,
                                        }),
                                    ]}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            Select or create a chapter to start writing.
                        </div>
                    )}
                </div>
                {/* Crop Modal */}
                <Modal showModal={cropModalOpen} setShowModal={setCropModalOpen}>
                    <div className="p-6 pb-42 bg-card min-w-sm sm:pb-6">
                        <h3 className="text-lg font-bold mb-4">Crop Cover Image</h3>
                        <div className="relative h-80 min-w-full rounded overflow-hidden mb-4">
                            {tempImageSrc && (
                                <Cropper
                                    image={tempImageSrc}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={400 / 600}
                                    onCropChange={setCrop}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoom}
                                />
                            )}
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                plain
                                onClick={() => setCropModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button onClick={saveCroppedImage}>
                                Save Cover
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </>
    )
}

function BookEditorSidebar({book, updateBook, addChapter, removeChapter, onReorderChapters, selectedChapterId, setSelectedChapterId, onDrop, saving}: {
    book: Book
    updateBook: (updates: Partial<Book>) => void
    addChapter: () => void
    removeChapter: (chapterId: string, e: MouseEvent) => void
    onReorderChapters: (newOrder: Chapter[]) => void
    selectedChapterId: string | null
    setSelectedChapterId: (id: string) => void
    onDrop: (acceptedFiles: File[]) => void
    saving: boolean
}) {
    const {getRootProps, getInputProps, isDragActive} = useDropzone({
        onDrop,
        accept: {'image/*': []},
        maxFiles: 1
    })

    return (
        <BookSidebarPortal>
            <div className="flex flex-col h-full w-full">
                <Resizable direction="vertical" initialSize={50} minSize={20} maxSize={80}>
                    {/* Info Section */}
                    <div className="p-4 space-y-4 overflow-y-auto h-full">
                        <div>
                            <div
                                {...getRootProps()}
                                className={`border-2 aspect-2/3 overflow-hidden p-1 border-dashed rounded cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                }`}
                            >
                                <input {...getInputProps()} />
                                {book.coverUrl ? (
                                    <img
                                        src={book.coverUrl}
                                        alt="Cover"
                                        className="h-full object-cover rounded-sm w-full"
                                    />
                                ) : (
                                    <div className="py-4 text-muted-foreground">
                                        <PhotoIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50"/>
                                        <p className="text-xs">Drag & drop or click to upload</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Field>
                            <Label>Book Title</Label>
                            <Input
                                type="text"
                                value={book.title}
                                onChange={(e) => updateBook({title: e.target.value})}
                                placeholder="Untitled Book"
                            />
                        </Field>
                        <Field>
                            <Label>Author</Label>
                            <Input
                                type="text"
                                value={book.author}
                                onChange={(e) => updateBook({author: e.target.value})}
                                placeholder="Author Name"
                            />
                        </Field>

                        <Field>
                            <Label>Summary</Label>
                            <Textarea
                                value={book.summary}
                                onChange={(e) => updateBook({summary: e.target.value})}
                                placeholder="Book summary..."
                            />
                        </Field>
                    </div>

                    {/* Chapters Section */}
                    <div className="flex-1 flex flex-col border-t min-h-0 h-full bg-background/50">
                        <div className="p-4 pb-2 flex items-center justify-between shrink-0">
                            <Heading size="xs" alt className="uppercase">Chapters</Heading>
                            <button
                                onClick={addChapter}
                                className="text-muted-foreground hover:text-primary transition-colors p-1"
                                title="Add Chapter"
                            >
                                <PlusIcon className="w-4 h-4"/>
                            </button>
                        </div>

                        {book.chapters.length > 25 && (
                            <div className="px-4 pb-2 shrink-0">
                                <Text size="xs" className="text-yellow-600">
                                    WOAH!! This book has a lot of chapters. Was this intentional?
                                </Text>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto px-2 pb-2">
                            <Reorder.Group axis="y" values={book.chapters} onReorder={onReorderChapters}
                                           className="space-y-1 mt-1">
                                {book.chapters.map((chapter) => (
                                    <Reorder.Item key={chapter.id} value={chapter}>
                                        <div
                                            onClick={() => setSelectedChapterId(chapter.id)}
                                            className={`group flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer transition-colors ${selectedChapterId === chapter.id
                                                ? 'bg-sidebar ring-1 ring-default shadow-sm font-medium'
                                                : 'hover:bg-sidebar-accent/50 hover:text-foreground text-muted-foreground'
                                            }`}
                                        >
                                            <Bars3Icon
                                                className="w-4 h-4 text-muted-foreground cursor-move shrink-0"/>
                                            <div className="flex-1 truncate">
                                                {chapter.title || 'Untitled Chapter'}
                                            </div>
                                            <button
                                                onClick={(e) => removeChapter(chapter.id, e)}
                                                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity p-1"
                                            >
                                                <TrashIcon className="w-3.5 h-3.5"/>
                                            </button>
                                        </div>
                                    </Reorder.Item>
                                ))}
                            </Reorder.Group>
                            {book.chapters.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    No chapters yet.
                                </div>
                            )}
                        </div>

                        <div className="p-2 border-t border-border text-xs text-center text-muted-foreground shrink-0">
                            {saving ? 'Saving...' : 'Saved'}
                        </div>
                    </div>
                </Resizable>
            </div>
        </BookSidebarPortal>
    )
}
