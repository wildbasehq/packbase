import React, { useEffect, useMemo, useState } from 'react'
import { DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button, IconButton, Layer, Modal, TextInput, Tile } from '@carbon/react'
import { Add, Draggable as DragIcon, TrashCan } from '@carbon/icons-react'

import type { QueryColumn } from '@/lib/queryPages'

function SortableRow({ id, header, onRemove }: { id: string; header: string; onRemove: (id: string) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        border: '1px solid var(--cds-border-subtle-01)',
        borderRadius: 4,
        padding: 8,
        background: 'var(--cds-layer-01)',
        cursor: 'grab',
    }
    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <span style={{ display: 'inline-flex', alignItems: 'center', cursor: 'grab' }} {...listeners}>
                <DragIcon />
            </span>
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{header}</div>
                <div style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>{id}</div>
            </div>
            <IconButton
                kind="ghost"
                label="Remove"
                onClick={e => {
                    e.stopPropagation()
                    onRemove(id)
                }}
            >
                <TrashCan />
            </IconButton>
        </div>
    )
}

export type TableLayoutEditorProps = {
    columns: QueryColumn[]
    onChange: (cols: QueryColumn[]) => void
    availableKeys?: string[]
}

export default function TableLayoutEditor(props: TableLayoutEditorProps) {
    const { columns, onChange, availableKeys = [] } = props
    const [showAdd, setShowAdd] = useState(false)
    const [newKey, setNewKey] = useState('')
    const [newHeader, setNewHeader] = useState('')

    // If there are no columns yet but we have available keys, prefill all as columns
    useEffect(() => {
        if (columns.length === 0 && availableKeys.length > 0) {
            onChange(availableKeys.map(k => ({ key: k, header: k })))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [columns.length, availableKeys.join('|')])

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const ids = useMemo(() => columns.map(c => c.key), [columns])

    function onDragEnd(event: DragEndEvent) {
        const { active, over } = event
        if (!over || active.id === over.id) return
        const oldIndex = ids.indexOf(String(active.id))
        const newIndex = ids.indexOf(String(over.id))
        const next = arrayMove(columns, oldIndex, newIndex)
        onChange(next)
    }

    function addColumn() {
        if (!newKey || !newHeader) return
        if (columns.some(c => c.key === newKey)) return
        onChange([...columns, { key: newKey, header: newHeader }])
        setNewKey('')
        setNewHeader('')
        setShowAdd(false)
    }

    function removeColumn(id: string) {
        console.log('removeColumn', id)
        onChange(columns.filter(c => c.key !== id))
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontWeight: 600 }}>Result Table Columns</div>
                <Button size="sm" kind="secondary" onClick={() => setShowAdd(true)} renderIcon={Add}>
                    Add column
                </Button>
            </div>

            <DndContext sensors={sensors} onDragEnd={onDragEnd}>
                <SortableContext items={ids} strategy={rectSortingStrategy}>
                    <Tile style={{ display: 'grid', gap: 8 }}>
                        {columns.map(col => (
                            <SortableRow key={col.key} id={col.key} header={col.header} onRemove={removeColumn} />
                        ))}
                    </Tile>
                </SortableContext>
            </DndContext>

            <Modal
                open={showAdd}
                onRequestClose={() => setShowAdd(false)}
                modalHeading="Add column"
                primaryButtonText="Add"
                secondaryButtonText="Cancel"
                onRequestSubmit={addColumn}
            >
                <div style={{ display: 'grid', gap: 12 }}>
                    <TextInput
                        id="newKey"
                        labelText="Result key (from SQL row)"
                        placeholder="e.g. id"
                        value={newKey}
                        onChange={e => setNewKey(e.currentTarget.value)}
                        list="available-keys"
                    />
                    <datalist id="available-keys">
                        {availableKeys.map(k => (
                            <option key={k} value={k} />
                        ))}
                    </datalist>
                    <TextInput
                        id="newHeader"
                        labelText="Column header"
                        placeholder="e.g. ID"
                        value={newHeader}
                        onChange={e => setNewHeader(e.currentTarget.value)}
                    />
                </div>
            </Modal>
        </div>
    )
}
