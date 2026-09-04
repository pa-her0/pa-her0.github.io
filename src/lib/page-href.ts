/** Canonical directory URLs, including page one and URLs used by filters. */
export function getPageHref(pageNumber: number, basePath = "/") {
  const base = basePath.replace(/^\/+|\/+$/g, "")
  const root = base ? `/${base}/` : "/"
  return pageNumber === 1 ? root : `${root}${pageNumber}/`
}
