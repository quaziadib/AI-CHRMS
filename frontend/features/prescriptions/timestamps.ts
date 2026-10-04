/** True when updated_at is at least a second after created_at. Insert defaults can differ by microseconds. */
export function prescriptionWasEdited(createdAt: string, updatedAt: string): boolean {
  const created = new Date(createdAt).getTime()
  const updated = new Date(updatedAt).getTime()
  if (Number.isNaN(created) || Number.isNaN(updated)) return createdAt !== updatedAt
  return updated - created >= 1000
}
