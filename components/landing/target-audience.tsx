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
    <section className="flex w-full justify-center py-12 md:py-24">
      <div className="w-full max-w-[1310px] px-4 md:px-6">
        <div className="relative overflow-visible rounded-t-[32px] border border-zinc-950 bg-zinc-950 shadow-lg">
          <div className="relative z-10 min-h-[400px] px-4 pb-0 pt-12 md:px-8 md:pt-[92px] lg:px-[57px]">
            <h2 className="text-2xl font-medium leading-none text-white md:text-4xl">Jotlin is for you if…</h2>
            <p className="font-edu mt-4 text-xl font-medium leading-[1.5] text-teal-400 md:ml-12 md:text-2xl">
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

            <div className="mt-8 flex flex-col gap-3 lg:hidden">
              {scenarios.map((scenario, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2.5 rounded-full border border-white/10 bg-gradient-to-l from-transparent to-[#414147] px-4 py-3 backdrop-blur-[20px]">
                  <scenario.icon className="h-6 w-6 shrink-0 text-zinc-400" />
                  <p className="text-base leading-6 text-zinc-300">{scenario.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-b-[32px] border border-t-0 border-zinc-950 bg-[#f6f6f7] px-4 py-6 shadow-lg md:px-8 md:py-[41px] lg:px-[56px]">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div className="w-full lg:w-auto">
              <h3 className="text-xl font-medium leading-8 text-zinc-900 md:text-2xl">Ready from day one</h3>
              <div className="mt-2 flex items-center gap-2">
                <p className="font-edu text-xl font-medium leading-[1.5] text-teal-500 md:text-2xl">roadmap</p>
                <Image src="/landing/roadmap-arrow.svg" alt="" width={18} height={24} />
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 md:gap-4 lg:w-auto lg:max-w-[772px]">
              {roadmapFeatures.map((row, rowIndex) => (
                <div key={rowIndex} className="flex flex-col gap-3 md:flex-row">
                  {row.map((feature, featureIndex) => (
                    <div
                      key={featureIndex}
                      className="flex flex-1 items-center gap-2.5 rounded-full border-[0.5px] border-zinc-200 bg-white px-4 py-3">
                      <feature.icon className="h-6 w-6 shrink-0 text-zinc-400" />
                      <p className="text-base leading-7 text-black md:text-lg">{feature.text}</p>
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
