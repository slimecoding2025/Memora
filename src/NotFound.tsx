export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <p className="font-display text-6xl text-accent">404</p>
      <h1 className="mt-2 font-display text-2xl">This page does not exist</h1>
      <p className="mt-2 text-muted">The link may be old or mistyped. Your memories are safe.</p>
      <a href="#/" className="btn-primary mt-6 inline-block text-center">Back to MEMORA</a>
    </main>
  )
}
