export function monthRange(offset: number, reference = new Date()) {
  const start = new Date(reference.getFullYear(), reference.getMonth() + offset, 1)
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0)
  const key = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return { start: key(start), end: key(end), startDate: start, endDate: end }
}
