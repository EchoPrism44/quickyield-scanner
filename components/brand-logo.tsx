import Link from 'next/link'

export function BrandLogo({
  href,
  className = '',
  label = 'QuickYield',
}: {
  href?: string
  className?: string
  label?: string
}) {
  const content = (
    <>
      <span className="qy-logo-mark" aria-hidden="true">
        <img src="/brand/qy-mark.svg" alt="" />
      </span>
      <span className="qy-logo-text">
        <span>Quick</span>
        <span>Yield</span>
      </span>
    </>
  )

  if (href) {
    return (
      <Link href={href} className={`qy-logo ${className}`.trim()} aria-label={label}>
        {content}
      </Link>
    )
  }

  return (
    <div className={`qy-logo ${className}`.trim()} aria-label={label}>
      {content}
    </div>
  )
}
