'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export function FAQSection() {
  const t = useTranslations('landing.faq')

  const faqs = Array.from({ length: 6 }, (_, i) => ({
    question: t(`items.${i}.question`),
    answer: t(`items.${i}.answer`),
  }))

  return (
    <section id="faq" className="py-24">
      <div className="relative mx-auto grid max-w-[1308px] grid-cols-1 gap-[50px] px-4 lg:grid-cols-[592px_666px]">
        <div className="relative pt-[44px]">
          <h2 className="text-[36px] leading-[1.5] font-medium text-black">{t('title')}</h2>
          <Image src="/landing/faq.svg" alt="" width={75} height={62} className="absolute top-0 right-[50px]" />
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-b border-dashed border-black">
              <AccordionTrigger className="py-8 text-left text-[18px] leading-[28px] font-normal text-black hover:no-underline [&[data-state=open]>svg]:rotate-180">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="pb-8 text-[14px] leading-none text-[#52525b]">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
