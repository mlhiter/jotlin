import { memo } from 'react'

type SvgProps = React.ComponentPropsWithoutRef<'svg'>

export const MermaidIcon = memo(({ className, ...props }: SvgProps) => {
  return (
    <svg
      width="24"
      height="24"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      {/* Top node */}
      <rect x="8" y="3" width="8" height="5" rx="1" stroke="currentColor" strokeWidth="2" />
      {/* Bottom left node */}
      <rect x="3" y="16" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="2" />
      {/* Bottom right node */}
      <rect x="14" y="16" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="2" />
      {/* Connecting lines */}
      <path
        d="M12 8V11M12 11L6.5 16M12 11L17.5 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
})

MermaidIcon.displayName = 'MermaidIcon'
