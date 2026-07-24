# Wordly — Dictionary SPA

A single-page dictionary app built for Flatiron’s Summative Lab. Search for a word, view definitions and synonyms, play pronunciation audio, and save favorites — all without refreshing the page.

## Features

- Search words with the [Free Dictionary API](https://dictionaryapi.dev/)
- Display pronunciation, part of speech, definitions, examples, and synonyms
- Play pronunciation audio when available
- Save and remove favorite words (stored in `localStorage`)
- Re-look up a favorite with one click
- Light / dark theme toggle
- Error handling for empty input, invalid words (404), and failed requests

## Getting Started

No install or build step required.

1. Clone or open this repo
2. Open `index.html` in your browser  
   — or use Live Server in VS Code / Cursor for a local server

## File Structure

```
├── index.html   # page structure and form
├── style.css    # layout, theme, and responsive styles
└── index.js     # fetch, DOM updates, favorites, and events
```

## How It Works

1. The user submits a word through the search form
2. JavaScript sanitizes the input and sends a `fetch` request to:
   `https://api.dictionaryapi.dev/api/v2/entries/en/{word}`
3. The response is parsed and rendered into the results section
4. Favorites and theme preference are saved in `localStorage`

## Technologies

- HTML5
- CSS3
- Vanilla JavaScript (`fetch`, DOM manipulation, event listeners)
- Free Dictionary API

## Credits

Dictionary data from the [Free Dictionary API](https://dictionaryapi.dev/).
