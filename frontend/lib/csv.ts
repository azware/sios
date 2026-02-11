export type CsvRow = Record<string, string>

const escapeCsvValue = (value: string) => {
  if (value.includes('"') || value.includes(',') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export const toCsv = (headers: string[], rows: string[][]) => {
  const headerLine = headers.map((item) => escapeCsvValue(item)).join(',')
  const dataLines = rows.map((row) => row.map((cell) => escapeCsvValue(cell ?? '')).join(','))
  return [headerLine, ...dataLines].join('\n')
}

export const downloadCsv = (filename: string, csvText: string) => {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const splitCsvLine = (line: string) => {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    const next = line[i + 1]

    if (ch === '"' && inQuotes && next === '"') {
      current += '"'
      i += 1
      continue
    }

    if (ch === '"') {
      inQuotes = !inQuotes
      continue
    }

    if (ch === ',' && !inQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }

    current += ch
  }

  cells.push(current.trim())
  return cells
}

export const parseCsv = (csvText: string): CsvRow[] => {
  const normalized = csvText.replace(/^\uFEFF/, '')
  const lines = normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length < 2) return []

  const headers = splitCsvLine(lines[0]).map((item) => item.trim().toLowerCase())
  const rows: CsvRow[] = []

  for (let i = 1; i < lines.length; i += 1) {
    const values = splitCsvLine(lines[i])
    const row: CsvRow = {}

    headers.forEach((header, index) => {
      row[header] = values[index] ?? ''
    })

    rows.push(row)
  }

  return rows
}
