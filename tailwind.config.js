export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', surface: 'var(--surface)', raised: 'var(--raised)',
        line: 'var(--line)', ink: 'var(--ink)', muted: 'var(--muted)', accent: 'var(--accent)'
      },
      fontFamily: { display: ['Fraunces', 'Georgia', 'serif'], sans: ['Inter', 'system-ui', 'sans-serif'] }
    }
  }
}
