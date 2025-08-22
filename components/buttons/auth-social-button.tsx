import { LucideIcon, MoveRight } from 'lucide-react'

interface AuthSocialButtonProps {
  icon: LucideIcon
  onClick: () => void
  platform: string
}

const AuthSocialButton = ({ icon: Icon, onClick, platform }: AuthSocialButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        group
        inline-flex
        w-full
        items-center
        justify-start
        space-x-6
        rounded-md
        bg-white
        px-6
        py-2
        ring-1
        ring-gray-200
        hover:bg-gray-50
        focus:outline-offset-0">
      <Icon />
      <span className="antialiased">Continue with {platform}</span>
      <MoveRight className="invisible text-slate-500 transition duration-150 group-hover:visible group-hover:translate-x-0.5" />
    </button>
  )
}

export default AuthSocialButton
