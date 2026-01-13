import { memo } from "react"

type SvgProps = React.ComponentPropsWithoutRef<"svg">

export const MermaidIcon = memo(({ className, ...props }: SvgProps) => {
  return (
    <svg
      width="24"
      height="24"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M7 4H11C11.5523 4 12 4.44772 12 5V7C12 7.55228 11.5523 8 11 8H7C6.44772 8 6 7.55228 6 7V5C6 4.44772 6.44772 4 7 4Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M13 10H17C17.5523 10 18 10.4477 18 11V13C18 13.5523 17.5523 14 17 14H13C12.4477 14 12 13.5523 12 13V11C12 10.4477 12.4477 10 13 10Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M7 16H11C11.5523 16 12 16.4477 12 17V19C12 19.5523 11.5523 20 11 20H7C6.44772 20 6 19.5523 6 19V17C6 16.4477 6.44772 16 7 16Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M9 8V10M15 14V16M9 16V14L15 14V10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
})

MermaidIcon.displayName = "MermaidIcon"
