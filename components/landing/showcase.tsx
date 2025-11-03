import Image from 'next/image'

export function Showcase() {
  return (
    <section className="py-12 md:py-0">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex flex-col items-center justify-center gap-6 md:flex-row md:items-end md:gap-7">
          {/* Left Column */}
          <div className="flex w-full flex-col gap-6 md:gap-8">
            {/* Title */}
            <div className="flex items-center gap-4 md:gap-11">
              <h2 className="flex-1 text-2xl font-medium leading-[1.4] text-black md:w-[460px] md:flex-none md:text-4xl md:leading-[1.5]">
                Go Beyond Documentation. Build Better Products.
              </h2>
              <div className="relative h-[50px] w-[82px] shrink-0 md:h-[66px] md:w-[108px]">
                <Image src="/landing/3-title-decoration.svg" alt="" fill className="object-contain" />
              </div>
            </div>

            {/* Large Card */}
            <div className="h-auto w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white md:h-[524px] md:w-[700px]">
              <div className="flex h-full flex-col">
                <div className="relative aspect-[740/363] w-full">
                  <Image src="/landing/showcase-1.svg" alt="" fill className="object-cover" />
                </div>

                <div className="flex flex-col gap-2 p-4 md:p-6">
                  <h3 className="text-lg font-medium leading-7 text-black md:text-xl">Achieve Unmistakable Clarity</h3>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 w-1 rotate-90 bg-teal-400" />
                      <p className="text-sm leading-6 text-zinc-500 md:text-base">Detailed PRDs</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 w-1 rotate-90 bg-teal-400" />
                      <p className="text-sm leading-6 text-zinc-500 md:text-base">Precise user stories</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 w-1 rotate-90 bg-teal-400" />
                      <p className="text-sm leading-6 text-zinc-500 md:text-base">Explicit acceptance criteria</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex w-full flex-col gap-4 md:gap-6">
            {/* Card 2 - Align Team */}
            <div className="h-auto w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white md:h-[331px] md:w-[500px]">
              <div className="flex h-full flex-col">
                <div className="relative aspect-[544/171] w-full">
                  <Image src="/landing/showcase-2.svg" alt="" fill className="object-cover" />
                </div>

                <div className="flex flex-col gap-2 p-4 md:p-6">
                  <div className="flex items-end gap-1">
                    <h3 className="text-lg font-medium leading-7 text-black md:text-xl">
                      Align Your Entire Team Instantly
                    </h3>
                    <p className="text-sm leading-6 text-zinc-500 md:text-base">(🚧 coming)</p>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 w-1 rotate-90 bg-teal-400" />
                      <p className="text-sm leading-6 text-zinc-500 md:text-base">A shared vision you can circulate</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 w-1 rotate-90 bg-teal-400" />
                      <p className="text-sm leading-6 text-zinc-500 md:text-base">Visual flowcharts</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 w-1 rotate-90 bg-teal-400" />
                      <p className="text-sm leading-6 text-zinc-500 md:text-base">Comment & version control</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3 - Reclaim Time */}
            <div className="h-auto w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white md:h-[324px] md:w-[500px]">
              <div className="flex h-full flex-col">
                <div className="relative aspect-[544/163] w-full">
                  <Image src="/landing/showcase-3.svg" alt="" fill className="object-cover" />
                </div>

                <div className="flex flex-col gap-2 p-4 md:p-6">
                  <h3 className="text-lg font-medium leading-7 text-black md:text-xl">
                    Reclaim Time for What Matters: Code
                  </h3>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 w-1 rotate-90 bg-teal-400" />
                      <p className="text-sm leading-6 text-zinc-500 md:text-base">From idea to spec in minutes</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 w-1 rotate-90 bg-teal-400" />
                      <p className="text-sm leading-6 text-zinc-500 md:text-base">Kickstart development faster</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 w-1 rotate-90 bg-teal-400" />
                      <p className="text-sm leading-6 text-zinc-500 md:text-base">Plug into your AI coding tool</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
