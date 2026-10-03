import { CONTACT_EMAIL } from './config'

type Section = [string, string]
const PRIVACY: Section[] = [
  ['What we collect', 'Your email address and password (passwords are handled by our authentication provider and stored hashed), the memories you create (titles, text, links, tags, collections), and the files you attach. Our hosting providers also see technical data such as IP addresses in their server logs.'],
  ['Where it is stored', 'Your data is stored with Supabase (database and file storage) and served through Vercel. Each row is locked to your account by database security rules, and attached files are private and opened only through short-lived links.'],
  ['What we do not do', 'We do not sell your data, show ads, or use tracking or analytics tools. Your memories are not sent to any AI service.'],
  ['On your device', 'MEMORA stores your sign-in session, theme choice, notifications and any memories saved while offline in your browser storage. Clearing your browser data removes them.'],
  ['Your control', 'You can edit or delete any memory and download all of them from the Account page. To delete your account and all its data, email us and we will do it.'],
  ['Contact', `Questions about privacy: ${CONTACT_EMAIL}`]
]
const TERMS: Section[] = [
  ['Using MEMORA', 'MEMORA is a personal space for your notes, links and files. You must be able to form a binding agreement where you live, and you are responsible for your account and password.'],
  ['Your content', 'You own what you save. You give us only the permission needed to store it and show it back to you. Do not upload anything illegal or that you do not have the right to store.'],
  ['Backups', 'We work to keep your data safe, but no service is perfect. Use Export on the Account page to keep your own copy of anything important.'],
  ['The service', 'MEMORA is provided as is, without warranties. We may change, pause or end the service, and we may suspend accounts that abuse it. We are not liable for indirect losses to the extent the law allows.'],
  ['Changes and contact', `We may update these terms and will change the date below when we do. Questions: ${CONTACT_EMAIL}`]
]

export default function Legal({ kind }: { kind: 'privacy' | 'terms' }) {
  const sections = kind === 'privacy' ? PRIVACY : TERMS
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <a href="#/" className="font-display text-2xl">MEMORA</a>
      <h1 className="mt-8 font-display text-4xl">{kind === 'privacy' ? 'Privacy Policy' : 'Terms of Use'}</h1>
      <p className="mt-1 text-sm text-muted">Last updated: October 2026</p>
      {sections.map(([h, p]) => (
        <section key={h} className="mt-6">
          <h2 className="font-medium text-accent">{h}</h2>
          <p className="mt-1 leading-relaxed text-muted">{p}</p>
        </section>
      ))}
      <p className="mt-10 text-sm"><a className="underline" href="#/">Back to MEMORA</a></p>
    </main>
  )
}
