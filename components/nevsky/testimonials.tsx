import { Star } from 'lucide-react'
import { Reveal } from './reveal'

const reviews = [
  {
    quote:
      'I proposed on the Aurora at sunset with the bridges rising behind us. Nevsky arranged every detail — it was the most perfect night of our lives.',
    name: 'Anastasia K.',
    context: 'Romantic evening',
    photo: '/images/person-1.png',
  },
  {
    quote:
      'We hosted 25 clients for a White Nights cruise. Flawless service, an incredible captain and a view of the city no restaurant could ever match.',
    name: 'Daniel R.',
    context: 'Corporate event',
    photo: '/images/person-2.png',
  },
  {
    quote:
      'My birthday on the Lumière felt like something out of a film. Champagne, music, the open bridges — my friends still talk about it months later.',
    name: 'Sofia M.',
    context: 'Birthday celebration',
    photo: '/images/person-3.png',
  },
]

export function Testimonials() {
  return (
    <section id="reviews" className="mx-auto max-w-7xl px-6 py-28 lg:px-10 lg:py-40">
      <Reveal className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.4em] text-primary">In their words</p>
        <h2 className="mt-5 text-balance text-4xl font-medium leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Evenings they never forgot
        </h2>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
        {reviews.map((review, i) => (
          <Reveal
            key={review.name}
            delay={i * 90}
            className="flex flex-col justify-between gap-8 rounded-3xl border border-border bg-card p-8 lg:p-10"
          >
            <div>
              <div className="flex gap-1" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="size-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="mt-6 text-pretty text-lg leading-relaxed text-foreground/90">
                “{review.quote}”
              </p>
            </div>
            <div className="flex items-center gap-4">
              <img
                src={review.photo || '/placeholder.svg'}
                alt={review.name}
                loading="lazy"
                className="size-14 rounded-full object-cover"
              />
              <div>
                <p className="font-medium text-foreground">{review.name}</p>
                <p className="text-sm text-muted-foreground">{review.context}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
