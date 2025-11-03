'use client'

import Image from 'next/image'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export function FAQSection() {
  const faqs = [
    {
      question: 'How is Jotlin different from ChatGPT?',
      answer:
        'Jotlin is specifically designed for product requirements. While ChatGPT is a general-purpose assistant, Jotlin asks clarifying questions, helps you think through edge cases, and produces structured documentation optimized for software teams.',
    },
    {
      question: 'What is the format of documents and artifacts Jotlin generates?',
      answer:
        'Jotlin produces industry-standard formats including PRDs, user stories, flow diagrams, and technical specifications. All outputs are designed to integrate with your existing workflow.',
    },
    {
      question: 'Is my data and project info private?',
      answer:
        'Yes, all your conversations and documents are private by default. We use enterprise-grade encryption and never share your data with third parties.',
    },
    {
      question: 'How do I get started with Jotlin?',
      answer:
        'Simply sign up for free and start a conversation. Describe your project idea in plain language and Jotlin will guide you through the process.',
    },
    {
      question: 'Can multiple team members collaborate?',
      answer:
        'Yes! Team collaboration features allow multiple stakeholders to contribute to requirements gathering and review generated documentation together.',
    },
    {
      question: 'What if I need to make changes later?',
      answer:
        'All documents support versioning. You can continue the conversation to refine requirements, and Jotlin will update your specs accordingly while maintaining a history of changes.',
    },
  ]

  return (
    <section id="faq" className="py-24">
      <div className="container relative mx-auto grid max-w-7xl grid-cols-1 gap-[30px] px-6 lg:grid-cols-[592px_610px]">
        <div className="relative pt-[44px]">
          <h2 className="text-[36px] font-medium leading-[1.5] text-black">Frequently Asked Questions</h2>
          <Image src="/landing/faq.svg" alt="" width={75} height={62} className="absolute right-[50px] top-0" />
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-b border-dashed border-black">
              <AccordionTrigger className="py-8 text-left text-[18px] font-normal leading-[28px] text-black hover:no-underline [&[data-state=open]>svg]:rotate-180">
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
