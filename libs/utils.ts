import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getRandomLightColor = () => {
  const r = Math.floor(Math.random() * 128 + 127)
  const g = Math.floor(Math.random() * 128 + 127)
  const b = Math.floor(Math.random() * 128 + 127)

  const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`

  return color
}
