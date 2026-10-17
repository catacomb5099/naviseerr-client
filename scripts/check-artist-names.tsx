/**
 * Self-check for the artist line: which names become links, and to where. Rendered to a string with
 * react-dom/server inside a MemoryRouter, so no browser is needed.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { ArtistNames } from '../src/components/ArtistNames'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`check failed: ${message}`)
}

function render(names: string[], ids?: (string | null)[]): string {
  return renderToStaticMarkup(<MemoryRouter><ArtistNames names={names} ids={ids} /></MemoryRouter>)
}

{
  const html = render(['Oasis', 'Blur'], ['UC1'])
  assert(html.includes('href="/artist/UC1"'), 'a name with an id links to its artist page')
  assert(html.includes('>Oasis</a>'), 'the link text is the name')
  assert((html.match(/<a /g) ?? []).length === 1, 'a name past the end of ids is plain text, not a dead link')
  assert(html.includes('</span><span>, Blur</span>'), 'names are separated by ", " and the plain one is text')
}
{
  const html = render(['Oasis', 'Someone'], ['UC1', null])
  assert((html.match(/<a /g) ?? []).length === 1, 'a null id is plain text')
  assert(html.includes(', Someone'), 'the plain name still shows')
}
assert(render(['Fan Made'], [null]) === '<span>Fan Made</span>', 'no id at all: just the name')
assert(render(['Fan Made']) === '<span>Fan Made</span>', 'ids are optional')
assert(render([]) === 'Unknown Artist', 'no names reads "Unknown Artist"')
assert(render(['A'], ['UC/odd id']).includes('href="/artist/UC%2Fodd%20id"'), 'ids are URL-encoded into the path')

console.log('check-artist-names: ok')
