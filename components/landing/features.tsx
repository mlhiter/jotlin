'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useState, useEffect, useCallback } from 'react'

export function FeaturesSection() {
  const t = useTranslations('landing.features')
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
      <div className="absolute inset-0 -z-10 opacity-20">
        <Image src="/landing/features-bg.svg" alt="" fill className="object-cover" />
      </div>

      <div className="container mx-auto max-w-7xl px-6">
        <div className="mb-10 flex flex-col gap-10">
          <div className="relative inline-flex flex-col items-start self-center">
            <div className="flex items-center gap-11">
              <h2 className="w-[338px] text-4xl leading-[1.5] font-medium text-black dark:text-white">
                {t('title.prefix')} {t('title.suffix')}
              </h2>
              <p className="w-[412px] text-base leading-6 text-zinc-500">{t('conversation.description')}</p>
            </div>
            <Image
              src="/landing/title-decoration-icon.svg"
              alt=""
              width={47}
              height={37}
              className="absolute top-0 left-[41%]"
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

        <div className="relative mb-12 h-[480px] overflow-hidden" onWheel={handleWheel}>
          <div
            className="flex gap-8 transition-transform duration-700 ease-out"
            style={{
              transform:
                activeStep === 0
                  ? 'translateX(0)'
                  : activeStep === 1
                    ? 'translateX(calc(-80% - 32px + 10%))'
                    : 'translateX(calc(-160% - 64px + 20%))',
            }}>
            {/* Card 1 */}
            <div className="w-[80%] shrink-0">
              <div
                className={`relative h-full overflow-hidden rounded-2xl border bg-white transition-colors duration-500 dark:bg-zinc-900 ${
                  activeStep === 0 ? 'border-black dark:border-white' : 'border-zinc-200 dark:border-zinc-700'
                }`}>
                <div className="flex h-full flex-col">
                  <div className="relative h-[310px] overflow-hidden bg-zinc-50 px-[52px] pt-[38px] dark:bg-zinc-800">
                    <div className="mb-4 rounded-2xl bg-[#ececed] px-5 py-5 dark:bg-zinc-700">
                      <p className="text-lg leading-7 text-zinc-900 dark:text-zinc-100">
                        {t('conversation.example.user')}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                      <div className="h-[81px] px-5 pt-4">
                        <p className="text-lg leading-7 text-zinc-500">{t('conversation.placeholder')}</p>
                      </div>
                      <div className="flex justify-end px-3 pb-2.5">
                        <div className="flex items-center justify-center rounded-[10px] bg-zinc-800 p-2 opacity-40">
                          <Image
                            src="/landing/icon-arrow-up.svg"
                            alt=""
                            width={20}
                            height={20}
                            className="brightness-0 invert"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="absolute right-0 bottom-0 left-0 h-10">
                      <Image src="/landing/carousel-gradient-1.png" alt="" fill className="object-cover" />
                    </div>
                  </div>
                  <div className="flex h-[150px] flex-col gap-2 p-6">
                    <h3 className="text-xl leading-7 font-medium text-black dark:text-white">
                      {t('projects.steps.0.title')}
                    </h3>
                    <p className="text-base leading-6 text-zinc-500">{t('projects.steps.0.description')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="w-[80%] shrink-0">
              <div
                className={`relative h-full overflow-hidden rounded-2xl border bg-white transition-colors duration-500 dark:bg-zinc-900 ${
                  activeStep === 1 ? 'border-black dark:border-white' : 'border-zinc-200 dark:border-zinc-700'
                }`}>
                <div className="flex h-full flex-col">
                  <div className="relative h-[310px] overflow-hidden bg-zinc-50 px-8 pt-11 dark:bg-zinc-800">
                    <div className="mb-4 flex items-start gap-4">
                      <div className="flex size-14 items-center justify-center overflow-hidden rounded-[11px] border-[0.6px] border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                        <Image src="/landing/avatar-icon.svg" alt="" width={24} height={24} />
                      </div>
                      <p className="flex-1 pt-4 text-lg leading-7 text-zinc-900 dark:text-zinc-100">
                        {t('conversation.example.assistant')}
                      </p>
                    </div>
                    <div className="ml-[72px] space-y-3">
                      <div className="relative rounded-xl border-[0.5px] border-zinc-200 bg-white px-5 py-5 dark:border-zinc-700 dark:bg-zinc-900">
                        <p className="text-lg leading-7 text-zinc-500">A.</p>
                        <Image
                          src="/landing/icon-check.svg"
                          alt=""
                          width={20}
                          height={20}
                          className="absolute top-6 right-5"
                        />
                        <div className="mt-1 space-y-2">
                          <div className="h-2 w-[340px] max-w-full rounded-full bg-zinc-100 dark:bg-zinc-800" />
                          <div className="h-2 w-[157px] max-w-full rounded-full bg-zinc-100 dark:bg-zinc-800" />
                        </div>
                      </div>
                      <div className="rounded-xl border-[0.5px] border-zinc-200 bg-white px-5 py-5 dark:border-zinc-700 dark:bg-zinc-900">
                        <p className="text-lg leading-7 text-zinc-500">B.</p>
                        <div className="mt-1 space-y-2">
                          <div className="h-2 w-[340px] max-w-full rounded-full bg-zinc-100 dark:bg-zinc-800" />
                          <div className="h-2 w-[157px] max-w-full rounded-full bg-zinc-100 dark:bg-zinc-800" />
                        </div>
                      </div>
                      <div className="rounded-xl border border-zinc-200 bg-white px-5 py-5 dark:border-zinc-700 dark:bg-zinc-900">
                        <p className="text-lg leading-7 text-zinc-900 dark:text-zinc-100">C.</p>
                      </div>
                    </div>
                    <div className="absolute top-[64px] right-[33px]">
                      <div className="flex items-center gap-2 rounded-full border-[0.5px] border-zinc-200 bg-white px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900">
                        <Image src="/landing/icon-book.svg" alt="" width={20} height={20} />
                        <span className="text-base text-zinc-900 dark:text-zinc-100">
                          {t('conversation.userStory')}
                        </span>
                      </div>
                    </div>
                    <div className="absolute top-[160px] left-[33px]">
                      <div className="flex items-center gap-2 rounded-full border-[0.5px] border-zinc-200 bg-white px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900">
                        <Image src="/landing/icon-image.svg" alt="" width={20} height={20} />
                        <span className="text-base text-zinc-900 dark:text-zinc-100">
                          {t('conversation.userScenarios')}
                        </span>
                      </div>
                    </div>
                    <div className="absolute right-[33px] bottom-[50px]">
                      <div className="flex items-center gap-2 rounded-full border-[0.5px] border-zinc-200 bg-white px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900">
                        <Image src="/landing/icon-brackets.svg" alt="" width={20} height={20} />
                        <span className="text-base text-zinc-900 dark:text-zinc-100">
                          {t('conversation.edgeCases')}
                        </span>
                      </div>
                    </div>
                    <div className="absolute right-0 bottom-0 left-0 h-10">
                      <Image src="/landing/carousel-gradient-1.png" alt="" fill className="object-cover" />
                    </div>
                  </div>
                  <div className="flex h-[150px] flex-col gap-2 p-6">
                    <h3 className="text-xl leading-7 font-medium text-black dark:text-white">
                      {t('projects.steps.1.title')}
                    </h3>
                    <p className="text-base leading-6 text-zinc-500">{t('projects.steps.1.description')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="w-[80%] shrink-0">
              <div
                className={`relative h-full overflow-hidden rounded-2xl border bg-white transition-colors duration-500 dark:bg-zinc-900 ${
                  activeStep === 2 ? 'border-black dark:border-white' : 'border-zinc-200 dark:border-zinc-700'
                }`}>
                <div className="flex h-full flex-col">
                  <div className="relative h-[310px] overflow-hidden bg-zinc-50 px-[52px] pt-[38px] dark:bg-zinc-800">
                    <div className="relative h-[220px]">
                      <div
                        className="absolute top-[158px] left-0 w-full origin-top-left rounded-xl border-[0.5px] border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900"
                        style={{ transform: 'rotate(14.564deg) skewX(-0.531deg)' }}>
                        <div className="flex items-center gap-2">
                          <p className="text-lg leading-7 text-zinc-900 dark:text-zinc-100">
                            {t('conversation.draft')}
                          </p>
                          <span className="rounded-full border-[0.5px] border-zinc-200 bg-zinc-50 px-1.5 py-0 text-sm leading-5 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800">
                            v1.0.0
                          </span>
                        </div>
                        <div className="mt-6 space-y-2">
                          <div className="h-2 w-[340px] max-w-full rounded-full bg-zinc-100 dark:bg-zinc-800" />
                          <div className="h-2 w-[157px] max-w-full rounded-full bg-zinc-100 dark:bg-zinc-800" />
                        </div>
                      </div>
                      <div
                        className="absolute top-[94px] left-[99px] w-full origin-top-left rounded-xl border-[0.5px] border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900"
                        style={{ transform: 'rotate(14.564deg) skewX(-0.531deg)' }}>
                        <div className="flex items-center gap-2">
                          <p className="text-lg leading-7 text-zinc-900 dark:text-zinc-100">
                            {t('conversation.draft')}
                          </p>
                          <span className="rounded-full border-[0.5px] border-zinc-200 bg-zinc-50 px-1.5 py-0 text-sm leading-5 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800">
                            v1.0.1
                          </span>
                        </div>
                        <div className="mt-6 space-y-2">
                          <div className="h-2 w-[340px] max-w-full rounded-full bg-zinc-100 dark:bg-zinc-800" />
                          <div className="h-2 w-[157px] max-w-full rounded-full bg-zinc-100 dark:bg-zinc-800" />
                        </div>
                      </div>
                      <div
                        className="absolute top-[36px] left-[225px] z-10 w-full origin-top-left rounded-xl border-2 border-teal-400 bg-white p-5 dark:bg-zinc-900"
                        style={{ transform: 'rotate(14.564deg) skewX(-0.531deg)' }}>
                        <p className="text-lg leading-7 font-bold text-zinc-900 dark:text-zinc-100">
                          {t('conversation.final')}
                        </p>
                        <div className="mt-6 space-y-3">
                          <div className="h-2 w-[556px] max-w-full rounded-full bg-zinc-100 dark:bg-zinc-800" />
                          <div className="h-2 w-[489px] max-w-full rounded-full bg-zinc-100 dark:bg-zinc-800" />
                          <div className="h-2 w-[437px] max-w-full rounded-full bg-zinc-100 dark:bg-zinc-800" />
                          <div className="h-2 w-[335px] max-w-full rounded-full bg-zinc-100 dark:bg-zinc-800" />
                        </div>
                      </div>
                    </div>
                    <div className="absolute right-0 bottom-0 left-0 h-10">
                      <Image src="/landing/carousel-gradient-2.png" alt="" fill className="object-cover" />
                    </div>
                  </div>
                  <div className="flex h-[150px] flex-col gap-2 p-6">
                    <h3 className="text-xl leading-7 font-medium text-black dark:text-white">
                      {t('projects.steps.2.title')}
                    </h3>
                    <p className="text-sm leading-5 text-zinc-500">{t('projects.steps.2.description')}</p>
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
