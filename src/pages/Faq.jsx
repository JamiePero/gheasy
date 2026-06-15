import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import Seo from '../components/Seo.jsx'
import { Link } from 'react-router-dom'
import { ArrowRightIcon } from '../components/icons.jsx'

const faqs = [
  {
    q: 'Do I need to create an account to buy data?',
    a: "No. GhEasy is completely login-free. Just pick your bundle, enter your number, pay via MoMo, and you're done.",
  },
  {
    q: 'How long does delivery take?',
    a: 'Most bundles are delivered within seconds of payment confirmation. In rare cases of network delays, delivery can take up to 10 minutes.',
  },
  {
    q: 'Which networks do you support?',
    a: 'We support MTN Ghana, Telecel Ghana, and AirtelTigo Ghana.',
  },
  {
    q: 'How do I pay?',
    a: 'Payment is via MTN Mobile Money (MoMo). We use a registered merchant account so your transaction is safe and you get a receipt.',
  },
  {
    q: 'What if I entered the wrong phone number?',
    a: "Contact us on WhatsApp immediately with your transaction reference. We'll do our best to resolve it quickly.",
  },
  {
    q: "What if my data doesn't arrive?",
    a: 'First, check your data balance by dialing *138# (MTN), *126# (Telecel), or *504# (AirtelTigo). If nothing shows, contact us via WhatsApp with your payment receipt.',
  },
  {
    q: 'Are your prices cheaper than buying directly from the network?',
    a: 'GhEasy offers competitive prices on data bundles, and our no-login process saves you time and airtime compared to USSD menus.',
  },
  {
    q: 'Do you offer bulk or reseller pricing?',
    a: 'Yes! We have an agent program for resellers. Visit our Agents page to learn more.',
  },
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
}

export default function Faq() {
  return (
    <Page>
      <Seo
        title="FAQs — Buying Data Bundles on GhEasy Ghana"
        description="Got questions about buying data on GhEasy? Find answers about delivery time, MoMo payment, refunds, supported networks, and more."
        jsonLd={faqJsonLd}
      />

      <section className="wrap max-w-3xl py-12 text-center md:py-16">
        <span className="chip">Help center</span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Frequently Asked Questions
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Everything you need to know about buying data bundles on GhEasy.
        </p>
      </section>

      <section className="wrap max-w-3xl pb-8">
        <div className="space-y-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-border bg-card p-5 shadow-card"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {f.q}
                <span className="text-brand transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {f.q.startsWith('Do you offer bulk') ? (
                  <>
                    Yes! We have an agent program for resellers. Visit our{' '}
                    <Link to="/agents" className="font-semibold text-brand underline">
                      Agents page
                    </Link>{' '}
                    to learn more.
                  </>
                ) : (
                  f.a
                )}
              </p>
            </details>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-muted">Still have a question?</p>
          <Button to="/buy-data" className="mt-4" iconRight={<ArrowRightIcon className="h-5 w-5" />}>
            Buy Data Now
          </Button>
        </div>
      </section>
    </Page>
  )
}
