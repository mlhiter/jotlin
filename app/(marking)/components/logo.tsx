import { Poppins } from 'next/font/google'
import Image from 'next/image'

import { cn } from '@/libs/utils'

const font = Poppins({
  subsets: ['latin'],
  weight: ['400', '600'],
})
const Logo = () => {
  return (
    <div className="hidden items-center gap-x-2 md:flex">
      <Image
        src="/logo.svg"
        height="40"
        width="40"
        alt="Logo"
        className="dark:hidden"
      />
      <Image
        src="/logo-dark.svg"
        height="40"
        width="40"
        alt="Logo"
        className="dark:block"
      />
      <p className={cn('font-semibold', font.className)}>Jotlin</p>
    </div>
  )
}

export default Logo
