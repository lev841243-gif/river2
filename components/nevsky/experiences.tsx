import { Reveal } from './reveal'

const experiences = [
  {
    title: 'Romantic Evening',
    caption: 'Just the two of you',
    image: '/images/exp-romantic.png',
    span: 'lg:col-span-2 lg:row-span-2',
  },
  {
    title: 'White Nights & Bridge Opening',
    caption: 'The city that never sleeps',
    image: '/images/exp-white-nights.png',
    span: 'lg:col-span-2',
  },
  {
    title: 'Birthday Celebration',
    caption: 'A night to remember',
    image: '/images/exp-birthday.png',
    span: '',
  },
  {
    title: 'Corporate Event',
    caption: 'Impress every guest',
    image: '/images/exp-corporate.png',
    span: '',
  },
  {
    title: 'Photo Session',
    caption: 'Golden-hour on the water',
    image: '/images/exp-photo.png',
    span: '',
  },
  {
    title: 'Family Cruise',
    caption: 'Together, unhurried',
    image: '/images/exp-family.png',
    span: '',
  },
]

export function Experiences() {
  return (
    <section id="experiences" className="mx-auto max-w-7xl px-6 py-28 lg:px-10 lg:py-40">
      <Reveal className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.4em] text-primary">The experience</p>
        <h2 className="mt-5 text-balance text-4xl font-medium leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          What experience are you looking for?
        </h2>
        <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
          You are not booking a boat. You are choosing a feeling — and we will
          craft the entire evening around it.
        </p>
      </Reveal>

      <div className="mt-14 grid auto-rows-[220px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {experiences.map((exp, i) => (
          <Reveal
            key={exp.title}
            delay={i * 70}
            className={`group relative overflow-hidden rounded-3xl ${exp.span}`}
          >
            <img
              src={exp.image || '/placeholder.svg'}
              alt={exp.title}
              loading="lazy"
              className="size-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent transition-opacity duration-500 group-hover:from-background/95" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <p className="text-[11px] uppercase tracking-[0.25em] text-primary opacity-0 transition-all duration-500 group-hover:opacity-100">
                {exp.caption}
              </p>
              <h3 className="mt-1 text-pretty text-xl font-medium leading-snug text-foreground lg:text-2xl">
                {exp.title}
              </h3>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
