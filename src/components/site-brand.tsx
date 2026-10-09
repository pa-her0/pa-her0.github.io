/** The same orange-only home link across the blog. */
export function SiteBrand() {
  return (
    <span className="jiely-brand" data-site-brand="jiely-orange" aria-hidden="true">
      <img
        className="jiely-brand__orange"
        src="/favicon-orange.png"
        alt=""
        width={256}
        height={256}
        decoding="async"
        draggable={false}
      />
    </span>
  )
}
