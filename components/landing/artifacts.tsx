'use client'

import Image from 'next/image'

export function ArtifactsSection() {

  return (
    <section className="py-24">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="relative mb-16">
          <h2 className="relative text-left text-4xl leading-[1.5] font-medium tracking-tight">
            Real Artifacts, Not Just Chat Logs
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
              <h3 className="text-xl leading-7 font-medium">PRD / MRD / BRD</h3>
              <p className="text-base leading-6 text-muted-foreground">Standards‑compliant, editable, exportable</p>
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
              <h3 className="text-xl leading-7 font-medium">User stories & backlog</h3>
              <p className="text-base leading-6 text-muted-foreground">Prioritized with acceptance criteria</p>
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
              <h3 className="text-xl leading-7 font-medium">Flows & diagrams</h3>
              <p className="text-base leading-6 text-muted-foreground">High‑level interaction maps for clarity</p>
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
              <h3 className="text-xl leading-7 font-medium">Risk & assumptions</h3>
              <p className="text-base leading-6 text-muted-foreground">Surfaced early to prevent rework</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
