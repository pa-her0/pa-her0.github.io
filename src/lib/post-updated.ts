/** Use the latest known update; never place an update before publication. */
export function resolvePostUpdatedDate(published: Date, updated?: Date | null, gitModified?: Date | null): Date {
  return new Date(Math.max(...[published, updated, gitModified]
    .filter((date): date is Date => date instanceof Date && Number.isFinite(date.getTime()))
    .map(date => date.getTime())))
}

/** Shared by list grouping and cards; older callers may only provide date. */
export function articleDisplayDate(article: { date: string; updated?: string }): string {
  return article.updated || article.date
}
