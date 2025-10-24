import Image from 'next/image'

import { ArtifactsSection } from '@/components/landing/artifacts'
import { FAQSection } from '@/components/landing/faq'
import { FeaturesSection } from '@/components/landing/features'
import { LandingFooter } from '@/components/landing/footer'
import { LandingHeader } from '@/components/landing/header'
import { HeroSection } from '@/components/landing/hero'
import { TargetAudienceSection } from '@/components/landing/target-audience'

export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="pointer-events-none absolute top-0 right-0 left-0 -z-10 h-96 overflow-hidden bg-gradient-to-b from-cyan-50/50 to-transparent">
        <Image src="/landing/header-decoration.svg" alt="" fill className="object-cover object-top opacity-40" />
      </div>
      <LandingHeader />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <ArtifactsSection />
        <TargetAudienceSection />
        <FAQSection />
      </main>
      <LandingFooter />
    </div>
  )
}
