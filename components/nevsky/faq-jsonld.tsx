import { dict, type Lang } from '@/lib/i18n'

/**
 * Микроразметка FAQPage (Schema.org) из уже существующего блока вопросов.
 * Серверный компонент — JSON-LD попадает в исходный HTML, поисковик читает его
 * и может показать раскрывающиеся вопросы прямо в выдаче (расширенный сниппет).
 * Контент берётся из того же словаря, что и видимый блок FAQ, — не расходится.
 */
export function FaqJsonLd({ lang }: { lang: Lang }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: dict[lang].faq.items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
