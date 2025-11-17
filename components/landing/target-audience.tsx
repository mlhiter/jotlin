'use client'

import { Clock, MapPin, HeartCrack, MessageCircleMore, CircleUser, Users, Tag, GitCompare } from 'lucide-react'
import Image from 'next/image'

export function TargetAudienceSection() {
  const scenarios = [
    {
      icon: HeartCrack,
      text: "You've experienced the pain of rework caused by vague requirements.",
      position: 'top-[46px] right-0',
    },
    {
      icon: MapPin,
      text: 'You want to turn your next great idea into a tangible plan, today.',
      position: 'top-[145px] right-[296px]',
    },
    {
      icon: MessageCircleMore,
      text: 'You believe clear communication is the foundation of a great product.',
      position: 'top-[244px] right-[2px]',
    },
    {
      icon: Clock,
      text: "You'd rather spend your time on code than on clerical work.",
      position: 'top-[273px] right-[637px]',
    },
  ]

  const roadmapFeatures = [
    [
      { icon: CircleUser, text: 'Role-based agents: product / PM / UI' },
      { icon: Users, text: 'Multi-user chat' },
    ],
    [
      { icon: Tag, text: 'Versioning' },
      { icon: GitCompare, text: 'approvals & workflow' },
    ],
  ]

  return (
    <section className="flex w-full justify-center py-8 md:py-12 lg:py-24">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        <div className="relative overflow-visible rounded-t-[24px] border border-zinc-950 bg-zinc-950 shadow-lg md:rounded-t-[32px]">
          <div className="relative z-10 min-h-[320px] px-4 pb-0 pt-8 md:min-h-[400px] md:px-8 md:pt-12 lg:px-[57px] lg:pt-[92px]">
            <h2 className="text-xl font-medium leading-none text-white md:text-2xl lg:text-4xl">
              Jotlin is for you if…
            </h2>
            <p className="font-edu mt-3 text-lg font-medium leading-[1.5] text-teal-400 md:ml-8 md:mt-4 md:text-xl lg:ml-12 lg:text-2xl">
              Built for the Builder&apos;s Mindset
            </p>

            <div className="hidden lg:block">
              {scenarios.map((scenario, index) => (
                <div
                  key={index}
                  className={`absolute ${scenario.position} flex items-center gap-2.5 rounded-full border border-white/10 bg-gradient-to-l from-transparent to-[#414147] px-4 py-3 backdrop-blur-[20px]`}>
                  <scenario.icon className="h-6 w-6 shrink-0 text-zinc-400" />
                  <p className="text-base leading-6 text-zinc-300">{scenario.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-2.5 md:mt-8 md:gap-3 lg:hidden">
              {scenarios.map((scenario, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-2xl border border-white/10 bg-gradient-to-l from-transparent to-[#414147] px-3 py-2.5 backdrop-blur-[20px] md:gap-2.5 md:rounded-full md:px-4 md:py-3">
                  <scenario.icon className="h-5 w-5 shrink-0 text-zinc-400 md:h-6 md:w-6" />
                  <p className="text-sm leading-6 text-zinc-300 md:text-base">{scenario.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-b-[24px] border border-t-0 border-zinc-950 bg-[#f6f6f7] px-4 py-5 shadow-lg md:rounded-b-[32px] md:px-8 md:py-6 lg:px-[56px] lg:py-[41px]">
          <div className="flex flex-col items-start justify-between gap-5 md:gap-6 lg:flex-row lg:items-center">
            <div className="w-full lg:w-auto">
              <h3 className="text-lg font-medium leading-8 text-zinc-900 md:text-xl lg:text-2xl">Ready from day one</h3>
              <div className="mt-1.5 flex items-center gap-2 md:mt-2">
                <p className="font-edu text-lg font-medium leading-[1.5] text-teal-500 md:text-xl lg:text-2xl">
                  roadmap
                </p>
                <Image src="/landing/roadmap-arrow.svg" alt="" width={16} height={20} className="md:h-6 md:w-[18px]" />
              </div>
            </div>

            <div className="flex w-full flex-col gap-2.5 md:gap-3 lg:w-auto lg:max-w-[772px] lg:gap-4">
              {roadmapFeatures.map((row, rowIndex) => (
                <div key={rowIndex} className="flex flex-col gap-2.5 md:flex-row md:gap-3">
                  {row.map((feature, featureIndex) => (
                    <div
                      key={featureIndex}
                      className="flex flex-1 items-center gap-2 rounded-2xl border-[0.5px] border-zinc-200 bg-white px-3 py-2.5 md:gap-2.5 md:rounded-full md:px-4 md:py-3">
                      <feature.icon className="h-5 w-5 shrink-0 text-zinc-400 md:h-6 md:w-6" />
                      <p className="text-sm leading-7 text-black md:text-base lg:text-lg">{feature.text}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
