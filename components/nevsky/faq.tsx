'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Reveal } from './reveal'

const faqs = [
  {
    q: 'How far in advance should I book?',
    a: 'For White Nights and weekend evenings we recommend booking two to three weeks ahead. For last-minute requests, reach out on Telegram or WhatsApp — we will always try to make it happen.',
  },
  {
    q: 'What is included in a private cruise?',
    a: 'Every cruise includes a professional licensed captain, fuel, and full use of the yacht. Champagne, flowers, catering, music and photography can be arranged as add-ons before your evening.',
  },
  {
    q: 'Can we bring our own food and drinks?',
    a: 'Absolutely. You are welcome to bring your own refreshments, or let our concierge arrange premium catering and a sommelier-selected wine list for you.',
  },
  {
    q: 'What happens if the weather is poor?',
    a: 'Your safety and comfort come first. If conditions are unsuitable, we will reschedule your cruise at no cost or offer a full refund.',
  },
  {
    q: 'Are the bridge openings guaranteed?',
    a: 'Bridge openings follow the official city schedule during the navigation season. Our captains time the route precisely so you are in the perfect spot as the bridges rise.',
  },
]

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="border-t border-border">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-14 px-6 py-28 lg:grid-cols-[0.8fr_1.2fr] lg:px-10 lg:py-40">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.4em] text-primary">Good to know</p>
          <h2 className="mt-5 text-balance text-4xl font-medium leading-tight tracking-tight text-foreground sm:text-5xl">
            Frequently asked
          </h2>
          <p className="mt-6 max-w-sm text-pretty leading-relaxed text-muted-foreground">
            Still have a question? Message us any time — we reply within minutes
            during the season.
          </p>
        </Reveal>

        <Reveal className="flex flex-col gap-4">
          {faqs.map((faq, i) => {
            const isOpen = open === i
            return (
              <div
                key={faq.q}
                className={cn(
                  'rounded-3xl border border-border bg-card transition-colors duration-300',
                  isOpen && 'bg-card',
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-7 py-6 text-left"
                >
                  <span className="text-pretty text-lg font-medium text-foreground">
                    {faq.q}
                  </span>
                  <Plus
                    className={cn(
                      'size-5 shrink-0 text-primary transition-transform duration-300',
                      isOpen && 'rotate-45',
                    )}
                  />
                </button>
                <div
                  className={cn(
                    'grid overflow-hidden transition-all duration-500 ease-out',
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-7 pb-7 text-pretty leading-relaxed text-muted-foreground">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </Reveal>
      </div>
    </section>
  )
}
