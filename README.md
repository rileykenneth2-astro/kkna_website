# Kennedy-King Neighborhood Association website

The website for the Kennedy-King Neighborhood Association, Indianapolis.
Built with [Eleventy](https://www.11ty.dev/), hosted on Cloudflare Pages.

## Editing content

Almost everything the board changes lives in `src/_data/`, as plain text files:

| File | What it controls |
|---|---|
| `site.yml` | Contact details, meeting time and place, calendar, signup, the menu |
| `board.yml` | Board members on the About page |
| `committees.yml` | Committees on the Get Involved page |
| `resources.yml` | The Resources page |
| `places.yml` | Parks and trails on the Neighborhood page |
| `past_events.yml` | Past events and sponsors on the Events page |

**Events don't live here at all.** They come from the association's Google
Calendar, so adding an event there puts it on the website automatically.

See [CONTENT-TODO.md](CONTENT-TODO.md) for what still needs filling in.

## Running it locally

Requires [Node.js](https://nodejs.org/) 20 or newer.

```bash
npm install
npm start
```

That serves the site at http://localhost:8420 and reloads when a file is saved.

## Publishing

Cloudflare Pages builds the site on every push to `main`:

- Build command: `npm run build`
- Output directory: `_site`

## How it's put together

- `src/_includes/layouts/base.njk` — the page shell every page uses
- `src/_includes/partials/` — header, footer, meeting card, signup band, contact form
- `src/css/tokens.css` — colors, fonts and spacing, all in one place
- `src/css/styles.css` — the rest of the styling, grouped by component
- `src/js/main.js` — mobile menu, next-meeting date, calendar, forms
- `src/js/site-config.njk` — passes settings from `site.yml` to the browser
- `tools/make_logo_mark.py` — cuts the logo mark out of the JPEG, until a vector logo exists

The site works without JavaScript: the menu stays open, the meeting schedule
still shows, and forms explain how to reach the association by email.
