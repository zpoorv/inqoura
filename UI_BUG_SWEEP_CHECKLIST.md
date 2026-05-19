# UI Bug Sweep Checklist

Use this checklist before shipping UI changes on Android.

## Core Rules

- Respect safe areas at the top and bottom.
- Keep primary actions visible above the bottom navigation or sheet edge.
- Make every scroll surface actually scroll on smaller phones.
- Make keyboard flows work for forms and search fields.
- Provide loading, empty, error, and offline states.
- Check that long translated text does not clip or overlap.
- Keep primary routes free of confusing back arrows.

## Screen Pass

For each changed screen, verify:

- first paint looks stable
- long content scrolls fully
- buttons remain tappable near the bottom
- text inputs are not hidden by the keyboard
- text wraps cleanly in supported languages
- loading and empty states match the page style
- back navigation returns to the expected page

## Release Smoke Test

- guest launch -> scanner -> result -> history -> account
- login / signup / reset password
- premium open / close / restore / offline
- OCR gallery / quota / failure state
- support and legal pages scroll correctly
