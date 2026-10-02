import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import Markdown from './Markdown'

const html = (t: string) => renderToStaticMarkup(<Markdown text={t} />)

describe('Markdown', () => {
  it('renders bold, italic and code', () => {
    const out = html('**a** *b* `c`')
    expect(out).toContain('<strong>a</strong>')
    expect(out).toContain('<em>b</em>')
    expect(out).toContain('<code')
  })
  it('never injects raw HTML', () => expect(html('<script>alert(1)</script>')).not.toContain('<script>'))
  it('does not create links for javascript: URLs', () => expect(html('[x](javascript:alert(1))')).not.toContain('href'))
  it('opens real links safely', () => expect(html('[x](https://a.com)')).toContain('rel="noopener noreferrer"'))
  it('renders lists', () => expect(html('- one\n- two')).toContain('<li>one</li>'))
})
