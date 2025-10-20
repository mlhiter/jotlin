'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'

export function ArtifactsSection() {
  const t = useTranslations('landing.artifacts')

  return (
    <section className="py-24">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="relative mb-16">
          <h2 className="relative text-left text-4xl leading-[1.5] font-medium tracking-tight">
            {t('title')}
            <Image
              src="/landing/title-decoration-icon.svg"
              alt=""
              width={22}
              height={21}
              className="absolute top-[-12px] left-[224px]"
            />
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
            <div className="relative h-56 overflow-hidden bg-muted">
              <Image src="/landing/card-prd-preview.svg" alt="PRD document preview" fill className="object-cover" />
            </div>
            <div className="flex flex-col gap-2 p-6">
              <h3 className="text-xl leading-7 font-medium">{t('types.prd.title')}</h3>
              <p className="text-base leading-6 text-muted-foreground">{t('types.prd.description')}</p>
            </div>
          </div>

          <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
            <div className="relative h-56 overflow-hidden bg-muted">
              <Image
                src="/landing/card-user-stories-preview.svg"
                alt="User stories preview"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col gap-2 p-6">
              <h3 className="text-xl leading-7 font-medium">{t('types.stories.title')}</h3>
              <p className="text-base leading-6 text-muted-foreground">{t('types.stories.description')}</p>
            </div>
          </div>

          <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
            <div className="relative h-56 overflow-hidden bg-muted">
              <Image
                src="/landing/card-flows-preview.svg"
                alt="Flows and diagrams preview"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col gap-2 p-6">
              <h3 className="text-xl leading-7 font-medium">{t('types.flows.title')}</h3>
              <p className="text-base leading-6 text-muted-foreground">{t('types.flows.description')}</p>
            </div>
          </div>

          <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
            <div className="relative h-56 overflow-hidden bg-muted">
              <Image
                src="/landing/card-risk-preview.svg"
                alt="Risk and assumptions preview"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col gap-2 p-6">
              <h3 className="text-xl leading-7 font-medium">{t('types.risk.title')}</h3>
              <p className="text-base leading-6 text-muted-foreground">{t('types.risk.description')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
