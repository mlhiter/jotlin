'use client'

import Image from 'next/image'

interface ArtifactCardProps {
  imageSrc: string
  imageAlt: string
  title: string
  description: string
}

function ArtifactCard({ imageSrc, imageAlt, title, description }: ArtifactCardProps) {
  return (
    <div className="border-border bg-card flex flex-col overflow-hidden rounded-2xl border shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05),0_4px_6px_-2px_rgba(0,0,0,0.02)]">
      <div className="bg-muted relative h-48 overflow-hidden md:h-56">
        <Image src={imageSrc} alt={imageAlt} fill className="object-cover" />
      </div>
      <div className="flex flex-col gap-2 p-4 md:p-6">
        <h3 className="text-lg font-medium leading-7 md:text-xl">{title}</h3>
        <p className="text-muted-foreground text-sm leading-6 md:text-base">{description}</p>
      </div>
    </div>
  )
}

export function ArtifactsSection() {
  return (
    <section className="py-12 md:py-24">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        <div className="relative mb-10 md:mb-16">
          <h2 className="relative text-left text-2xl font-medium leading-[1.4] tracking-tight md:text-4xl md:leading-[1.5]">
            Real Artifacts, Not Just Chat Logs
            <Image
              src="/landing/title-decoration-icon.svg"
              alt=""
              width={22}
              height={21}
              className="absolute left-[180px] top-[-14px] md:left-[224px] md:top-[-12px]"
            />
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ArtifactCard
            imageSrc="/landing/card-prd-preview.svg"
            imageAlt="PRD document preview"
            title="PRD / MRD / BRD"
            description="Standards‑compliant, editable, exportable"
          />

          <ArtifactCard
            imageSrc="/landing/card-user-stories-preview.svg"
            imageAlt="User stories preview"
            title="User stories & backlog"
            description="Prioritized with acceptance criteria"
          />

          <ArtifactCard
            imageSrc="/landing/card-flows-preview.svg"
            imageAlt="Flows and diagrams preview"
            title="Flows & diagrams"
            description="High‑level interaction maps for clarity"
          />

          <ArtifactCard
            imageSrc="/landing/card-risk-preview.svg"
            imageAlt="Risk and assumptions preview"
            title="Risk & assumptions"
            description="Surfaced early to prevent rework"
          />
        </div>
      </div>
    </section>
  )
}
