import {useEffect, useMemo, useState} from "react";
import {
    Combobox,
    ComboboxInput,
    ComboboxOption,
    ComboboxOptions,
    Dialog,
    DialogBackdrop,
    DialogPanel
} from "@headlessui/react";
import {
    ExclamationTriangleIcon,
    LifebuoyIcon,
    MagnifyingGlassIcon,
    RectangleStackIcon,
    UserCircleIcon,
    UserGroupIcon
} from "@heroicons/react/20/solid";
import {vg} from "@/lib";
import PackHeader from "@/components/shared/pack/header";
import {LoadingSpinner, UserHoverCard} from "@/src/components";
import UserInfoCol from "@/components/shared/user/info-col.tsx";
import Markdown from "@/components/shared/markdown.tsx";
import PackbaseInstance from "@/lib/workers/global-event-emit.ts";
import {AnimatePresence, motion} from "motion/react";

// Simple classNames helper with basic typing
function classNames(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

// Custom hook for debounced value
function useDebouncedValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

// Helper to normalize API response
const normalizeSearchData = (data) => {
    if (!data) return {profiles: [], packs: [], posts: []};

    return {
        profiles: data.profiles || [],
        packs: data.packs || [],
        posts: data.posts || [],
    };
};

// Central helper to determine item type from shape
const getItemType = (item: any): "profile" | "pack" | "post" | null => {
    if (!item) return null;
    if (item.body && item.user) return "post";
    if (item.username || item.about) return "profile";
    if (item.display_name && item.slug) return "pack";
    return null;
};

// Navigation helper kept minimal so it can later be wired to a router
function navigateFromResult(item: any) {
    if (!item) return;
    const type = getItemType(item);

    if (type === "pack" && item.slug) {
        window.location.href = `/${item.slug}`;
        return;
    }

    if (type === "post" && item.id) {
        window.location.href = `/p/${item.pack?.slug}/all/${item.id}`;
        return;
    }

    if (type === "profile" && (item.username || item.slug)) {
        const handle = item.slug || item.username;
        window.location.href = `/@${handle}`;
    }
}

// Build query string from raw input, not using whskrd
function queryBuildFromRaw(query: string): string {
    if (!query) return "";

    const parts: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < query.length; i++) {
        const ch = query[i];

        if (ch === '"') {
            if (!inQuotes) {
                // starting a quoted segment
                if (current.trim()) {
                    // flush any word before the quote
                    current
                        .trim()
                        .split(/\s+/)
                        .forEach((w) => {
                            if (w.length > 0) parts.push(`"${w}"`);
                        });
                }
                current = '"';
                inQuotes = true;
            } else {
                // ending a quoted segment
                current += '"';
                if (current.trim().length > 0) {
                    parts.push(current.trim());
                }
                current = "";
                inQuotes = false;
            }
        } else if (/\s/.test(ch) && !inQuotes) {
            // whitespace outside quotes -> word boundary
            if (current.trim()) {
                current
                    .trim()
                    .split(/\s+/)
                    .forEach((w) => {
                        if (w.length > 0) parts.push(`"${w}"`);
                    });
                current = "";
            }
        } else {
            current += ch;
        }
    }

    // flush remaining buffer
    if (current.trim()) {
        if (inQuotes) {
            // unterminated quote, keep as\-is
            parts.push(current.trim());
        } else {
            current
                .trim()
                .split(/\s+/)
                .forEach((w) => {
                    if (w.length > 0) parts.push(`"${w}"`);
                });
        }
    }

    return parts.join(" ");
}

// Hook that owns all search + filtering logic so the component tree stays presentational
function useCommandPaletteSearch() {
    const [rawQuery, setRawQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [apiResults, setApiResults] = useState<{
        profiles: any[];
        packs: any[];
        posts: any[];
    }>({profiles: [], packs: [], posts: []});

    const debouncedRawQuery = useDebouncedValue(rawQuery, 300);
    const query = debouncedRawQuery.toLowerCase().replace(/^[#@]/, "");

    useEffect(() => {
        const fetchResults = async () => {
            if (!debouncedRawQuery || debouncedRawQuery.trim() === "" || debouncedRawQuery === "?") {
                setApiResults({profiles: [], packs: [], posts: []});
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);

                let allowedTables: ("profiles" | "packs" | "posts")[] = ["profiles", "packs", "posts"];
                if (debouncedRawQuery.startsWith("@")) {
                    allowedTables = ["profiles"];
                } else if (debouncedRawQuery.startsWith("#")) {
                    allowedTables = ["packs"];
                }

                let finalQuery = query.trim();
                if (!finalQuery.startsWith('[') && !finalQuery.startsWith('$')) {
                    finalQuery = `
                    ${allowedTables.includes("posts") &&
                    `
                    $posts = [Where posts (${queryBuildFromRaw(query)})] AS *;
                    $posts:user = [Where profiles ($posts:user_id->ONE)] AS *;
                    $posts:pack = [Where packs ($posts:tenant_id->ONE)] AS *;
                    `
                    }
                    ${allowedTables.includes("profiles") && `$profiles = [Where profiles (${queryBuildFromRaw(query)})] AS *;`}
                    ${allowedTables.includes("packs") && `$packs = [Where packs (${queryBuildFromRaw(query)})] AS *;`}
                    `.trim().replaceAll('                    ', '')
                }

                const searchResults = await vg.search.get({
                    query: {
                        q: finalQuery
                    },
                });

                if (searchResults.error) {
                    console.error("Search error:", searchResults.error);
                    setApiResults({profiles: [], packs: [], posts: []});
                } else {
                    const normalizedData = normalizeSearchData(searchResults.data);
                    setApiResults(normalizedData);
                }
            } catch (err) {
                console.error("Error fetching search results:", err);
                setApiResults({profiles: [], packs: [], posts: []});
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [debouncedRawQuery, query]);

    const filteredProfiles = useMemo(() => {
        if (debouncedRawQuery.startsWith("#")) return [];
        if (query === "") return apiResults.profiles.slice(0, 5);
        return apiResults.profiles.slice(0, 5);
    }, [query, debouncedRawQuery, apiResults.profiles]);

    const filteredPacks = useMemo(() => {
        if (debouncedRawQuery.startsWith("@")) return [];
        if (query === "") return apiResults.packs.slice(0, 5);
        return apiResults.packs.slice(0, 5);
    }, [query, debouncedRawQuery, apiResults.packs]);

    const filteredPosts = useMemo(() => {
        if (debouncedRawQuery.startsWith("#") || debouncedRawQuery.startsWith("@")) return [];
        if (query === "") return apiResults.posts.slice(0, 3);
        return apiResults.posts.slice(0, 3);
    }, [query, debouncedRawQuery, apiResults.posts]);

    const hasResults =
        filteredProfiles.length > 0 || filteredPacks.length > 0 || filteredPosts.length > 0;

    return {
        rawQuery,
        setRawQuery,
        debouncedRawQuery,
        query,
        isLoading,
        filteredProfiles,
        filteredPacks,
        filteredPosts,
        hasResults,
    };
}

// Presentational: header + input
function CommandPaletteInput({
                                 rawQuery,
                                 setRawQuery,
                             }: {
    rawQuery: string;
    setRawQuery: (value: string) => void;
}) {
    return (
        <div className="grid grid-cols-1">
            <label htmlFor="command-palette-input" className="sr-only">
                Search
            </label>
            <ComboboxInput
                id="command-palette-input"
                autoFocus
                className="col-start-1 row-start-1 h-11 w-full rounded-t-xl border-b border-border bg-sidebar pr-4 pl-11 text-sm text-foreground outline-hidden placeholder:text-muted-foreground focus-visible:ring-offset-background sm:h-12 sm:text-base"
                placeholder="Search profiles, packs, and posts..."
                onChange={(event) => setRawQuery(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === "Escape") {
                        event.preventDefault();
                        // Clear the query; dialog-level handler will close if needed
                        setRawQuery("");
                    }
                }}
                value={rawQuery}
            />
            <MagnifyingGlassIcon
                className="pointer-events-none col-start-1 row-start-1 ml-4 size-5 self-center text-muted-foreground"
                aria-hidden="true"
            />
        </div>
    );
}

// Individual result sections (Profiles / Packs / Posts)
function CommandPaletteSection({
                                   title,
                                   children,
                               }: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1">
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {title}
            </h2>
            <div className="space-y-1.5">{children}</div>
        </div>
    );
}

// Right-hand side preview area
function CommandPalettePreview({activeOption}: { activeOption: any }) {
    const type = getItemType(activeOption);

    if (!activeOption || !type) return null;

    return (
        <div
            className="hidden h-96 w-1/2 flex-none flex-col divide-y divide-border overflow-y-auto bg-muted/40 sm:flex">
            {type === "profile" && (
                <div className="p-6">
                    <UserHoverCard user={activeOption}/>
                </div>
            )}
            {type === "pack" && (
                <div className="p-6">
                    <PackHeader pack={activeOption}/>
                </div>
            )}
            {type === "post" && (
                <div className="p-6 space-y-4">
                    <UserInfoCol user={activeOption.user}/>
                    <div className="mt-2 text-sm text-foreground">
                        <Markdown>{activeOption.body}</Markdown>
                    </div>
                </div>
            )}
        </div>
    );
}

// Results, loading, help, and empty states
function CommandPaletteResultsList({
                                       isLoading,
                                       hasResults,
                                       rawQuery,
                                       query,
                                       filteredProfiles,
                                       filteredPacks,
                                       filteredPosts,
                                   }: {
    isLoading: boolean;
    hasResults: boolean;
    rawQuery: string;
    query: string;
    filteredProfiles: any[];
    filteredPacks: any[];
    filteredPosts: any[];
}) {
    const showStateShell = isLoading || hasResults || rawQuery === "?" || (query !== "" && !hasResults);

    if (!showStateShell) return null;

    return (
        <ComboboxOptions
            as="div"
            static
            hold
            className="flex w-full transform-gpu divide-x divide-border"
        >
            <div
                className={classNames(
                    "max-h-96 min-w-0 flex-auto scroll-py-4 overflow-y-auto px-6 py-4",
                    "text-sm",
                )}
            >
                {isLoading && (
                    <div className="px-6 py-14 text-center text-sm" role="status" aria-live="polite">
                        <LoadingSpinner className="mx-auto size-6"/>
                        <p className="mt-4 text-muted-foreground">Searching the universe...</p>
                    </div>
                )}

                {!isLoading && hasResults && (
                    <div className="-mx-2 space-y-4 text-sm text-foreground">
                        {filteredProfiles.length > 0 && (
                            <CommandPaletteSection title="Profiles">
                                {filteredProfiles.map((profile) => (
                                    <ComboboxOption
                                        as="div"
                                        key={profile.id}
                                        value={profile}
                                        className="group flex cursor-default items-center gap-3 rounded-md px-2 py-2.5 select-none data-focus:bg-indigo-600 data-focus:text-white data-focus:outline-hidden"
                                    >
                                        {profile.images?.avatar ? (
                                            <img
                                                src={profile.images.avatar}
                                                alt=""
                                                className="size-7 flex-none rounded-full"
                                            />
                                        ) : (
                                            <UserCircleIcon
                                                className="size-7 flex-none text-muted-foreground group-data-focus:text-white"
                                                aria-hidden="true"
                                            />
                                        )}
                                        <div className="min-w-0 flex-auto">
                                            <p className="truncate text-sm font-medium">{profile.display_name}</p>
                                            {profile.description && (
                                                <p className="truncate text-xs text-muted-foreground group-data-focus:text-indigo-100">
                                                    {profile.description}
                                                </p>
                                            )}
                                        </div>
                                    </ComboboxOption>
                                ))}
                            </CommandPaletteSection>
                        )}

                        {filteredPacks.length > 0 && (
                            <CommandPaletteSection title="Packs">
                                {filteredPacks.map((pack) => (
                                    <ComboboxOption
                                        as="div"
                                        key={pack.id}
                                        value={pack}
                                        className="group flex cursor-default items-center gap-3 rounded-md px-2 py-2.5 select-none data-focus:bg-indigo-600 data-focus:text-white data-focus:outline-hidden"
                                    >
                                        {pack.images?.avatar ? (
                                            <img
                                                src={pack.images.avatar}
                                                alt=""
                                                className="size-7 flex-none rounded-full"
                                            />
                                        ) : (
                                            <UserGroupIcon
                                                className="size-7 flex-none text-muted-foreground group-data-focus:text-white"
                                                aria-hidden="true"
                                            />
                                        )}
                                        <div className="min-w-0 flex-auto">
                                            <p className="truncate text-sm font-medium">{pack.display_name}</p>
                                            {pack.description && (
                                                <p className="truncate text-xs text-muted-foreground group-data-focus:text-indigo-100">
                                                    {pack.description}
                                                </p>
                                            )}
                                        </div>
                                    </ComboboxOption>
                                ))}
                            </CommandPaletteSection>
                        )}

                        {filteredPosts.length > 0 && (
                            <CommandPaletteSection title="Posts">
                                {filteredPosts.map((post) => (
                                    <ComboboxOption
                                        as="div"
                                        key={post.id}
                                        value={post}
                                        className="group flex cursor-default items-center gap-3 rounded-md px-2 py-2.5 select-none data-focus:bg-indigo-600 data-focus:text-white data-focus:outline-hidden"
                                    >
                                        <RectangleStackIcon
                                            className="size-6 flex-none text-muted-foreground group-data-focus:text-white"
                                            aria-hidden="true"
                                        />
                                        <div className="min-w-0 flex-auto">
                                            {post.user && (
                                                <p className="text-xs text-muted-foreground group-data-focus:text-indigo-100">
                                                    {post.user.display_name}
                                                </p>
                                            )}
                                            <p className="truncate text-sm">
                                                {post.body?.substring(0, 80)}
                                                {post.body && post.body.length > 80 ? "…" : ""}
                                            </p>
                                        </div>
                                    </ComboboxOption>
                                ))}
                            </CommandPaletteSection>
                        )}
                    </div>
                )}

                {rawQuery === "?" && !isLoading && (
                    <div
                        className="px-6 py-14 text-center text-sm sm:px-14"
                        role="status"
                        aria-live="polite"
                    >
                        <LifebuoyIcon
                            className="mx-auto size-6 text-muted-foreground"
                            aria-hidden="true"
                        />
                        <p className="mt-4 text-sm font-semibold text-foreground">
                            Help with searching
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Use the command palette to quickly jump to profiles, packs, and posts across
                            Packbase.
                        </p>
                        <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
                            <li>
                                <kbd className="rounded border border-border bg-card px-1 py-0.5 text-[11px] font-mono">
                                    @
                                </kbd>{" "}
                                Search profiles only
                            </li>
                            <li>
                                <kbd className="rounded border border-border bg-card px-1 py-0.5 text-[11px] font-mono">
                                    #
                                </kbd>{" "}
                                Search packs only
                            </li>
                            <li>
                                Type anything else to search across everything.
                            </li>
                        </ul>
                        <p className="mt-4 text-xs text-muted-foreground">
                            Pro tip: Hit <span className="font-mono">Ctrl</span>/<span className="font-mono">⌘</span>
                            <span className="font-mono">+K</span> from anywhere to open this.
                        </p>
                    </div>
                )}

                {!isLoading && query !== "" && rawQuery !== "?" && !hasResults && (
                    <div
                        className="px-6 py-14 text-center text-sm sm:px-14"
                        role="status"
                        aria-live="polite"
                    >
                        <ExclamationTriangleIcon
                            className="mx-auto size-6 text-muted-foreground"
                            aria-hidden="true"
                        />
                        <p className="mt-4 font-semibold text-foreground">No results found</p>
                        <p className="mt-2 text-muted-foreground">
                            We couldn't find anything that matches that term. Try a different keyword or
                            use <span className="font-mono">@name</span> or <span className="font-mono">#pack</span>.
                        </p>
                    </div>
                )}
            </div>

            {/* Preview panel rendered from parent via render prop */}
            <ComboboxOptionsPreviewSlot/>
        </ComboboxOptions>
    );
}

// Placeholder component that will be swapped at render time
// (Headless UI doesn't support direct composition for the split pane,
//  so we'll render the preview separately in the main component.)
function ComboboxOptionsPreviewSlot() {
    return null;
}

// Footer helper with mode hints and shortcut reminder
function CommandPaletteFooter({rawQuery}: { rawQuery: string }) {
    return (
        <div
            className="flex flex-wrap items-center justify-between gap-2 bg-muted px-4 py-2.5 text-[11px] text-foreground sm:text-xs">
            <div className="flex flex-wrap items-center gap-2">
                <span className="hidden sm:inline">Type</span>
                <kbd
                    className={classNames(
                        "flex h-5 w-5 items-center justify-center rounded-sm border bg-card font-mono text-[11px] font-semibold",
                        rawQuery.startsWith("@")
                            ? "border-indigo-600 text-indigo-600"
                            : "border-border text-foreground",
                    )}
                >
                    @
                </kbd>
                <span className="hidden sm:inline">for profiles,</span>
                <span className="sm:hidden">profiles,</span>
                <kbd
                    className={classNames(
                        "flex h-5 w-5 items-center justify-center rounded-sm border bg-card font-mono text-[11px] font-semibold",
                        rawQuery.startsWith("#")
                            ? "border-indigo-600 text-indigo-600"
                            : "border-border text-foreground",
                    )}
                >
                    #
                </kbd>
                <span>for packs,</span>
                <kbd
                    className={classNames(
                        "flex h-5 w-5 items-center justify-center rounded-sm border bg-card font-mono text-[11px] font-semibold",
                        rawQuery === "?"
                            ? "border-indigo-600 text-indigo-600"
                            : "border-border text-foreground",
                    )}
                >
                    ?
                </kbd>
                <span>for help.</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground sm:text-[11px]">
                <span className="hidden sm:inline">Shortcut</span>
                <kbd
                    className="flex items-center gap-0.5 rounded border border-border bg-card px-1 py-0.5 font-mono text-[10px]">
                    Ctrl
                </kbd>
                <span>/</span>
                <kbd
                    className="flex items-center gap-0.5 rounded border border-border bg-card px-1 py-0.5 font-mono text-[10px]">
                    ⌘
                </kbd>
                <span>+</span>
                <kbd
                    className="flex items-center gap-0.5 rounded border border-border bg-card px-1 py-0.5 font-mono text-[10px]">
                    K
                </kbd>
            </div>
        </div>
    );
}

export default function CommandPalette() {
    const [open, setOpen] = useState(false);

    const {
        rawQuery,
        setRawQuery,
        debouncedRawQuery,
        query,
        isLoading,
        filteredProfiles,
        filteredPacks,
        filteredPosts,
        hasResults,
    } = useCommandPaletteSearch();

    // Keyboard shortcut handler for Ctrl/CMD + K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
            if (e.key === "Escape") {
                setOpen(false);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Listen for global Packbase event to open search
    useEffect(() => {
        const cancelInstance = PackbaseInstance.on("search-open", () => {
            setOpen(true);
        });

        return () => {
            cancelInstance();
        };
    }, []);

    return (
        <Dialog
            className="relative z-50"
            open={open}
            onClose={() => {
                setOpen(false);
                setRawQuery("");
            }}
            aria-label="Command palette search"
        >
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-black/40 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
            />

            {/* Shimmer overlay that sweeps down when the palette opens */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        key="command-palette-shimmer"
                        aria-hidden="true"
                        role="presentation"
                        className="pointer-events-none h-full w-full fixed inset-0 -z-[1] overflow-hidden"
                        initial={{y: "-100%"}}
                        animate={{y: "100%"}}
                        transition={{duration: 2, ease: "circOut"}}
                    >
                        <div
                            className="absolute inset-x-0 top-0 h-full w-full bg-white/5 backdrop-blur-[1px] mask-middle"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="fixed inset-0 z-50 w-screen overflow-y-auto p-4 sm:p-6 md:p-20">
                <DialogPanel
                    transition
                    className="mx-auto max-w-4xl transform overflow-hidden rounded-2xl bg-card shadow-2xl ring-1 ring-default transition-all data-closed:-rotate-1 data-closed:-translate-y-full data-closed:opacity-0 data-enter:duration-300 data-enter:ease-snapper data-leave:duration-200 data-leave:ease-in"
                >
                    <Combobox
                        onChange={(item: any) => {
                            if (item) {
                                navigateFromResult(item);
                                setOpen(false);
                                setRawQuery("");
                            }
                        }}
                    >
                        {({activeOption}) => (
                            <>
                                <CommandPaletteInput rawQuery={rawQuery} setRawQuery={setRawQuery}/>

                                <div className="flex flex-col sm:flex-row">
                                    <CommandPaletteResultsList
                                        isLoading={isLoading}
                                        hasResults={hasResults}
                                        rawQuery={rawQuery}
                                        query={query}
                                        filteredProfiles={filteredProfiles}
                                        filteredPacks={filteredPacks}
                                        filteredPosts={filteredPosts}
                                    />

                                    {/* Preview pane */}
                                    {activeOption && <CommandPalettePreview activeOption={activeOption}/>}
                                </div>

                                <CommandPaletteFooter rawQuery={rawQuery}/>
                            </>
                        )}
                    </Combobox>
                </DialogPanel>
            </div>
        </Dialog>
    );
}

// Tailwind arbitrary keyframes for the shimmer effect
// This relies on Tailwind's JIT engine picking up the class name above.
// keyframes command-shimmer {
//   0% { transform: translateY(-100%); opacity: 0; }
//   15% { opacity: 1; }
//   85% { opacity: 1; }
//   100% { transform: translateY(100%); opacity: 0; }
// }
