# Blockr (React + Vite + CRXJS)

## First-time setup

```bash
npm install
npm install -D @crxjs/vite-plugin @types/chrome
npm install @fontsource/dm-sans
```

## Development (auto-reload)

1. `npm run dev`
2. Open `chrome://extensions`, turn on **Developer mode**
3. **Load unpacked** → select this folder's `dist/` directory
4. Edit files in `src/`: the popup hot-reloads and the service worker reloads on save

Keep `npm run dev` running while you work; the dev build in `dist/` needs the dev server.

## Production build

`npm run build` → load (or zip) `dist/`.

## Layout

- `manifest.config.ts` – the extension manifest (CRXJS turns it into `dist/manifest.json`)
- `index.html` + `src/main.tsx` + `src/App.tsx` – the popup
- `src/background.ts` – service worker (blocking logic goes here)
- `public/icons/` – extension icons
