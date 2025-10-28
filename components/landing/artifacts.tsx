'use client'

import Image from 'next/image'

export function ArtifactsSection() {
  return (
    <section className="py-24">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="relative mb-16">
          <h2 className="relative text-left text-4xl font-medium leading-[1.5] tracking-tight">
            Real Artifacts, Not Just Chat Logs
            <Image
              src="/landing/title-decoration-icon.svg"
              alt=""
              width={22}
              height={21}
              className="absolute left-[224px] top-[-12px]"
            />
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="border-border bg-card flex flex-col overflow-hidden rounded-2xl border">
            <div className="bg-muted relative h-56 overflow-hidden">
              <Image src="/landing/card-prd-preview.svg" alt="PRD document preview" fill className="object-cover" />
            </div>
            <div className="flex flex-col gap-2 p-6">
              <h3 className="text-xl font-medium leading-7">PRD / MRD / BRD</h3>
              <p className="text-muted-foreground text-base leading-6">Standards‑compliant, editable, exportable</p>
            </div>
          </div>

          <div className="border-border bg-card flex flex-col overflow-hidden rounded-2xl border">
            <div className="bg-muted relative h-56 overflow-hidden">
              <Image
                src="/landing/card-user-stories-preview.svg"
                alt="User stories preview"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col gap-2 p-6">
              <h3 className="text-xl font-medium leading-7">User stories & backlog</h3>
              <p className="text-muted-foreground text-base leading-6">Prioritized with acceptance criteria</p>
            </div>
          </div>

          <div className="border-border bg-card flex flex-col overflow-hidden rounded-2xl border">
            <div className="bg-muted relative h-56 overflow-hidden">
              <Image
                src="/landing/card-flows-preview.svg"
                alt="Flows and diagrams preview"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col gap-2 p-6">
              <h3 className="text-xl font-medium leading-7">Flows & diagrams</h3>
              <p className="text-muted-foreground text-base leading-6">High‑level interaction maps for clarity</p>
            </div>
          </div>

          <div className="border-border bg-card flex flex-col overflow-hidden rounded-2xl border">
            <div className="bg-muted relative h-56 overflow-hidden">
              <Image
                src="/landing/card-risk-preview.svg"
                alt="Risk and assumptions preview"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col gap-2 p-6">
              <h3 className="text-xl font-medium leading-7">Risk & assumptions</h3>
              <p className="text-muted-foreground text-base leading-6">Surfaced early to prevent rework</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
