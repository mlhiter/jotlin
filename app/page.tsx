import Image from 'next/image'

import { ArtifactsSection } from '@/components/landing/artifacts'
import { FAQSection } from '@/components/landing/faq'
import { FeaturesSection } from '@/components/landing/features'
import { LandingFooter } from '@/components/landing/footer'
import { LandingHeader } from '@/components/landing/header'
import { HeroSection } from '@/components/landing/hero'
import { LandingWrapper } from '@/components/landing/landing-wrapper'
import { Showcase } from '@/components/landing/showcase'
import { TargetAudienceSection } from '@/components/landing/target-audience'

export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <LandingWrapper>
      <div className="relative flex min-h-screen flex-col">
        <div className="pointer-events-none absolute left-0 right-0 top-0 -z-10 h-96 overflow-hidden bg-gradient-to-b from-cyan-50/50 to-transparent">
          <Image
            src="/landing/header-decoration.svg"
            alt=""
            height={64}
            width={1000}
            className="absolute left-1/2 top-0 min-w-[200%] -translate-x-1/2 object-none"
          />
        </div>
        <LandingHeader />
        <main className="flex-1">
          <HeroSection />
          <FeaturesSection />
          <Showcase />
          <ArtifactsSection />
          <TargetAudienceSection />
          <FAQSection />
        </main>
        <LandingFooter />
      </div>
    </LandingWrapper>
  )
}
