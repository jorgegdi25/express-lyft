/* eslint-disable @next/next/no-img-element */
// Official Express Lyft mark (brand guidelines): the gold "E" emblem with
// the spaced "EXPRESS LYFT" wordmark. Horizontal lockup for the header,
// vertical for the footer.
export default function Logo({ variant = 'horizontal', className = '' }: { variant?: 'horizontal' | 'vertical'; className?: string }) {
  if (variant === 'vertical') {
    return <img src="/brand/logo-vertical-gold.webp" alt="Express Lyft" width={160} height={125} className={`h-auto w-[150px] ${className}`} />
  }
  return (
    <span className={`inline-flex max-w-full items-center gap-2 md:gap-3 ${className}`}>
      <img src="/brand/icon-gold-192.webp" alt="" width={40} height={40} className="h-8 w-8 shrink-0 sm:h-9 sm:w-9 md:h-10 md:w-10" />
      <img src="/brand/wordmark-gold.webp" alt="Express Lyft" width={150} height={7} className="h-auto w-[128px] max-[359px]:w-[105px] md:w-[178px]" />
    </span>
  )
}
