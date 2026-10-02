/** One shared lockup keeps the navigation and homepage intro in sync. */
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
      <img
        className="jiely-brand__wordmark"
        data-site-wordmark
        src="/brand/jiely-rounded-wordmark-v1.webp"
        alt=""
        width={768}
        height={320}
        decoding="async"
        draggable={false}
      />
    </span>
  )
}
