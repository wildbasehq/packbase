export type CsvColumn<RowType extends object> = {
    header: string
    key: keyof RowType
}

export function escapeCsv(value: unknown): string {
    if (value === null || value === undefined) return ''
    const str = String(value).replace(/"/g, '""')
    return /[",\r\n]/.test(str) ? `"${str}"` : str
}

export function rowsToCsv<RowType extends object>(rows: RowType[], columns: ReadonlyArray<CsvColumn<RowType>>): string {
    console.log('rowsToCsv', rows, columns)
    const headerRow = columns.map(c => c.header).join(',')
    const dataRows = rows.map(row => columns.map(c => escapeCsv(row[c.key])).join(','))
    return [headerRow, ...dataRows].join('\r\n')
}

export async function saveCsv(csv: string, suggestedName: string): Promise<void> {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = suggestedName
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
}
