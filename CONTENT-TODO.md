# Before launch: placeholders to replace

Almost everything the board edits is in `src/_data/`:
- `site.yml`: contact info, meeting details, calendar, Mailchimp, menu
- `committees.yml`: committees on the Get Involved page
- `past_events.yml`: past events and sponsors on the Events page
- `resources.yml`: the Resources page
- `places.yml`: parks and trails on the Neighborhood page
- `board.yml`: the board on the About page

Search the code for `TODO` to find each spot.

## Needs a board decision or access
- [ ] **Add events to the Google Calendar** (board owns this). The calendar is public and embeds correctly, but has *no events scheduled* through Sep 2027, not even the monthly meetings. Add the last-Monday meeting as a repeating event, plus any upcoming gatherings.
- [ ] **Google Calendar API key** (Kenneth will add when he has it). Goes in `site.yml` (`calendar.apiKey`). It lets the home page list upcoming events. Until then, it shows the "last Monday" schedule and a link to the calendar.
- [ ] **Web3Forms access key.** Sign up at web3forms.com with the association's email, then paste the key into `site.yml` (`forms.accessKey`). The endpoint is already set. It powers the Get Involved form and, later, the About page contact form. Until the key is in, the form tells people to email instead.
- [ ] **Mailchimp signup URL.** Goes in `site.yml` (`mailchimp.formAction`). Until then, the signup form tells people to email the association instead.
- [ ] **Current board list and committee chairs.** Chairs show "to be announced" (`committees.yml`).
- [ ] **Vector logo** (SVG, AI, EPS or PDF). `src/images/logo-mark*.png` are cut from a 447px JPEG by `tools/make_logo_mark.py`.
- [ ] **Twitter/X.** Only Facebook is linked until we know the account is active.

## Photos (no permission yet: placeholders only)
- [ ] `landmark-for-peace.jpg`: source unknown and low resolution
- [ ] `king-park-map.webp`: King Park Development Corporation graphic
- [ ] Community photos: the four block party photos aren't used because they show identifiable children. Only add event photos with the photographer's permission and, for any children, a parent's consent.

## Links and facts to confirm
- [ ] **indy.gov links** (Request Indy, Mayor's Action Center). Their site is a JavaScript app, so the exact addresses couldn't be checked automatically. Click each once.
- [ ] **Recycling weeks.** The Resources page says "every other Thursday" and points at the community calendar, so the dates need to go on that calendar.

## About page
- [ ] **Board members** (Kenneth will update before launch). All seven cards read "To be announced" with "Photo to come" (`board.yml`). Add names, roles, one or two sentences each, and photos (drop image files in `src/images` and name them in the file).
- [ ] Confirm the wording of "What the board does".

## History page
- [ ] The first video is a personal re-upload of the speech and could be taken down. An official channel's copy would be safer.
- [ ] Population and household figures came from the old About page. Check them against current census data.
- [ ] "More of our history" now says the board is gathering it and invites stories. Replace with the real history once it's written.

## Home page
- [ ] The gathering notice ("A neighborhood gathering is in the works") shows on the home page and above the calendar on Events. It lives in `src/_includes/partials/gathering-notice.njk`. Once the gathering has a date, put it on the Google Calendar and remove the two includes.

## Copy to review (drafts)
- [ ] Home: hero, get involved cards, history teaser, living here
- [ ] Get Involved: committee descriptions, volunteer roles, sponsor blurb, form dropdown choices
- [ ] Events: "What to expect" at monthly meetings
- [ ] Neighborhood: the "Living here" paragraphs
