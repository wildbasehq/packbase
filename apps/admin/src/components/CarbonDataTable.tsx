import React, { ChangeEvent, ReactNode } from 'react'
import {
    Button,
    DataTable,
    Table,
    TableBatchAction,
    TableBatchActions,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableHeader,
    TableRow,
    TableSelectAll,
    TableSelectRow,
    TableToolbar,
    TableToolbarContent,
    TableToolbarSearch,
} from '@carbon/react'

export type Column<RowType extends object> = {
    header: string
    key: keyof RowType & string
    decorator?: ReactNode
}

export type BatchAction<RowType extends object> = {
    label: string
    id: string
    icon?: React.ComponentType<{ size?: number }>
    onClick: (selectedRows: RowType[]) => void
}

export type CarbonDataTableProps<RowType extends { id: string }> = {
    title?: string
    rows: ReadonlyArray<RowType>
    columns: ReadonlyArray<Column<RowType>>
    batchActions?: ReadonlyArray<BatchAction<RowType>>
    searchable?: boolean
}

export function CarbonDataTable<RowType extends { id: string }>(props: CarbonDataTableProps<RowType>) {
    const { title, rows, columns, batchActions = [], searchable = true } = props

    return (
        <DataTable experimentalAutoAlign overflowMenuOnHover isSortable locale="en" headers={columns as any} rows={rows as any} size="lg">
            {({
                rows: carbonRows,
                headers,
                selectedRows,
                onInputChange,
                getTableProps,
                getTableContainerProps,
                getToolbarProps,
                getHeaderProps,
                getRowProps,
                getCellProps,
                getBatchActionProps,
                getSelectionProps,
            }) => {
                const batchActionProps = getBatchActionProps()
                const idToRow = new Map((rows as any[]).map(r => [r.id, r]))
                const selectedOriginalRows = (selectedRows as any[]).map(r => idToRow.get(r.id)).filter(Boolean) as RowType[]

                return (
                    <TableContainer title={title} {...getTableContainerProps()}>
                        <TableToolbar {...getToolbarProps()} aria-label="data table toolbar">
                            {!!batchActions.length && (
                                <TableBatchActions {...batchActionProps}>
                                    {batchActions.map(action => (
                                        <TableBatchAction
                                            key={action.id}
                                            tabIndex={batchActionProps.shouldShowBatchActions ? 0 : -1}
                                            renderIcon={action.icon as any}
                                            onClick={() => action.onClick(selectedOriginalRows)}
                                        >
                                            {action.label}
                                        </TableBatchAction>
                                    ))}
                                </TableBatchActions>
                            )}
                            <TableToolbarContent aria-hidden={batchActionProps.shouldShowBatchActions}>
                                {searchable && (
                                    <TableToolbarSearch
                                        tabIndex={batchActionProps.shouldShowBatchActions ? -1 : 0}
                                        onChange={evt => {
                                            onInputChange(evt as ChangeEvent<HTMLInputElement>)
                                        }}
                                    />
                                )}
                                <Button>Primary Button</Button>
                            </TableToolbarContent>
                        </TableToolbar>
                        <Table {...getTableProps()} aria-label="table" className="h-full">
                            <TableHead>
                                <TableRow>
                                    <TableSelectAll {...getSelectionProps()} />
                                    {headers.map((header: any) => (
                                        <TableHeader {...getHeaderProps({ header })} key={header.key}>
                                            {header.header}
                                        </TableHeader>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {carbonRows.map((row: any) => (
                                    <TableRow {...getRowProps({ row })} key={row.id}>
                                        <TableSelectRow {...getSelectionProps({ row })} onChange={() => {}} />
                                        {row.cells.map((cell: any) => (
                                            <TableCell {...getCellProps({ cell })} key={cell.id}>
                                                {JSON.stringify(cell.value)}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )
            }}
        </DataTable>
    )
}

export default CarbonDataTable
