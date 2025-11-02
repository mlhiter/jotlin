import Image from 'next/image'

export function Showcase() {
  return (
    <section className="w-full py-20">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-center gap-7">
          {/* Left Column */}
          <div className="flex flex-col gap-8">
            {/* Title */}
            <div className="flex items-center gap-11">
              <h2 className="w-[460px] text-4xl font-medium leading-[1.5] text-black">
                Go Beyond Documentation. Build Better Products.
              </h2>
              <div className="relative h-[66px] w-[108px]">
                <Image src="/landing/3-title-decoration.svg" alt="" fill className="object-contain" />
              </div>
            </div>

            {/* Large Card */}
            <div className="h-[524px] w-[740px] overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              <div className="flex h-full flex-col">
                {/* Card Image Area */}
                <Image src="/landing/showcase-1.svg" alt="" width={740} height={363} />

                {/* Card Content */}
                <div className="flex flex-col gap-2 p-6">
                  <h3 className="text-xl font-medium leading-7 text-black">Achieve Unmistakable Clarity</h3>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 w-1 rotate-90 bg-teal-400" />
                      <p className="text-base leading-6 text-zinc-500">Detailed PRDs</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 w-1 rotate-90 bg-teal-400" />
                      <p className="text-base leading-6 text-zinc-500">Precise user stories</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 w-1 rotate-90 bg-teal-400" />
                      <p className="text-base leading-6 text-zinc-500">Explicit acceptance criteria</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-6">
            {/* Card 2 - Align Team */}
            <div className="h-[331px] w-[544px] overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              <div className="flex h-full flex-col">
                <Image src="/landing/showcase-2.svg" alt="" width={544} height={171} />

                {/* Card Content */}
                <div className="flex flex-col gap-2 p-6">
                  <div className="flex items-end gap-1">
                    <h3 className="text-xl font-medium leading-7 text-black">Align Your Entire Team Instantly</h3>
                    <p className="text-base leading-6 text-zinc-500">(🚧 coming)</p>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 w-1 rotate-90 bg-teal-400" />
                      <p className="text-base leading-6 text-zinc-500">A shared vision you can circulate</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 w-1 rotate-90 bg-teal-400" />
                      <p className="text-base leading-6 text-zinc-500">Visual flowcharts</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 w-1 rotate-90 bg-teal-400" />
                      <p className="text-base leading-6 text-zinc-500">Comment & version control</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3 - Reclaim Time */}
            <div className="h-[324px] w-[544px] overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              <div className="flex h-full flex-col">
                <Image src="/landing/showcase-3.svg" alt="" width={544} height={163} />

                {/* Card Content */}
                <div className="flex flex-col gap-2 p-6">
                  <h3 className="text-xl font-medium leading-7 text-black">Reclaim Time for What Matters: Code</h3>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 w-1 rotate-90 bg-teal-400" />
                      <p className="text-base leading-6 text-zinc-500">From idea to spec in minutes</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 w-1 rotate-90 bg-teal-400" />
                      <p className="text-base leading-6 text-zinc-500">Kickstart development faster</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 w-1 rotate-90 bg-teal-400" />
                      <p className="text-base leading-6 text-zinc-500">Plug into your AI coding tool</p>
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
