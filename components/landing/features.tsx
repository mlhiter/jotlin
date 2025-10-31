'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'

export function FeaturesSection() {
  const [activeStep, setActiveStep] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  const handleStepChange = useCallback((step: number) => {
    setActiveStep(step)
  }, [])

  const handleWheel = (e: React.WheelEvent) => {
    if (isScrolling) return

    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault()

      setIsScrolling(true)
      setTimeout(() => setIsScrolling(false), 800)

      if (e.deltaX > 30 && activeStep < 2) {
        handleStepChange(activeStep + 1)
      } else if (e.deltaX < -30 && activeStep > 0) {
        handleStepChange(activeStep - 1)
      }
    }
  }

  return (
    <section id="features" className="relative overflow-hidden py-24">
      <div className="absolute inset-0 -left-80 top-5 -z-10">
        <Image src="/landing/features-bg.svg" alt="" fill className="object-cover" />
      </div>

      <div className="container mx-auto max-w-7xl px-6">
        <div className="mb-10 flex w-full flex-col gap-10">
          <div className="relative inline-flex w-full flex-col items-start self-center">
            <div className="flex items-center gap-11">
              <h2 className="w-[338px] text-4xl font-medium leading-[1.5] text-black dark:text-white">
                It&apos;s a Conversation, Not a Command.
              </h2>
              <p className="w-[412px] text-base leading-6 text-zinc-500">
                Unlike generic chatbots, Jotlin is purpose‑built for requirements analysis. It guides you with polls &
                follow‑ups to remove ambiguity and surface risks early.
              </p>
            </div>
            <Image
              src="/landing/conversation.svg"
              alt=""
              width={47}
              height={37}
              className="absolute -top-[20px] left-[26%]"
            />
          </div>

          <div className="relative mx-auto w-full max-w-[1312px]">
            <div className="absolute inset-0 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            <div className="relative h-1.5">
              <div
                className="absolute h-1.5 rounded-full bg-teal-400 transition-all duration-700 ease-out"
                style={{
                  width: `${100 / 3}%`,
                  left: `${(activeStep * 100) / 3}%`,
                }}
              />
              <div className="flex h-1.5">
                <button onClick={() => handleStepChange(0)} className="flex-1 cursor-pointer" aria-label="Step 1" />
                <button onClick={() => handleStepChange(1)} className="flex-1 cursor-pointer" aria-label="Step 2" />
                <button onClick={() => handleStepChange(2)} className="flex-1 cursor-pointer" aria-label="Step 3" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative mb-12 h-[510px] overflow-hidden" onWheel={handleWheel}>
          <div
            className="flex gap-8 transition-transform duration-700 ease-out"
            style={{
              transform:
                activeStep === 0
                  ? 'translateX(0)'
                  : activeStep === 1
                    ? 'translateX(calc(-40%))'
                    : 'translateX(calc(-85.5%))',
            }}>
            {/* Card 1 */}
            <div className="w-[60%] shrink-0">
              <div
                className={`relative h-full overflow-hidden rounded-2xl border bg-white shadow-lg transition-colors duration-500 dark:bg-zinc-900 ${
                  activeStep === 0 ? 'border-black dark:border-white' : 'border-zinc-200 dark:border-zinc-700'
                }`}>
                <div className="flex h-full flex-col">
                  <Image src="/landing/card-1.svg" alt="" width={788} height={310} />
                  <div className="flex h-[150px] flex-col gap-2 p-6">
                    <h3 className="text-xl font-medium leading-7 text-black dark:text-white">
                      Describe your idea in plain English
                    </h3>
                    <p className="w-[55%] text-base leading-6 text-zinc-500">
                      Drop a sentence or two. No prompts required. Jotlin infers intent and starts asking smart
                      questions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="w-[60%] shrink-0">
              <div
                className={`relative h-full overflow-hidden rounded-2xl border bg-white shadow-lg transition-colors duration-500 dark:bg-zinc-900 ${
                  activeStep === 1 ? 'border-black dark:border-white' : 'border-zinc-200 dark:border-zinc-700'
                }`}>
                <div className="flex h-full flex-col">
                  <Image src="/landing/card-2.svg" alt="" width={788} height={310} />
                  <div className="flex h-[150px] flex-col gap-2 p-6">
                    <h3 className="text-xl font-medium leading-7 text-black dark:text-white">
                      Answer clarifying questions
                    </h3>
                    <p className="w-[55%] text-base leading-6 text-zinc-500">
                      Through a short, natural conversation, Jotlin uncovers user stories, edge cases, and constraints
                      you might miss.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="w-[60%] shrink-0">
              <div
                className={`relative h-full overflow-hidden rounded-2xl border bg-white shadow-lg transition-colors duration-500 dark:bg-zinc-900 ${
                  activeStep === 2 ? 'border-black dark:border-white' : 'border-zinc-200 dark:border-zinc-700'
                }`}>
                <div className="flex h-full flex-col">
                  <Image src="/landing/card-3.svg" alt="" width={788} height={310} />
                  <div className="flex h-[150px] flex-col gap-2 p-6">
                    <h3 className="text-xl font-medium leading-7 text-black dark:text-white">
                      Get structured documentation
                    </h3>
                    <p className="text-sm leading-5 text-zinc-500">Receive well-organized specs ready to share</p>
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
