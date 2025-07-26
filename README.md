# sv

Everything you need to get started on Fly.io

Prerequisites (you probably won't need these):

- `nvm install 20.19.0`
- `nvm use 20.19.0`

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project
npx sv create socketphysics # you won't need this
```

## Developing

Installed dependencies with `pnpm install`, start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Connecting to Fly.io

Log into your fly.io account using Github, and connect to your account repo.

Locate your repo from the cli and `fly launch --no-deploy`.

Locate your repo from the cli and `fly deploy`, will build your `Dockerfile` and serve it to [Mixed Reality Pong](https://mixedrealitypong.fly.dev/).

## Warning about using WASM/Rapier

> NOTE THESE COMMENTED LINES, YOU CAN'T USE `WASM` WITHOUT A `Dockerfile`

```bash
pnpm uninstall vite-plugin-wasm
```

Check that no Rapier code is left behind, such as: `src/routes/obman`.

```typescript
// vite.config.ts
// import wasm from 'vite-plugin-wasm'; // Rust is a statically typed language that compiles Rapier to WASM

  plugins: [
    // wasm(), // for dependencies built Rust’s wasm-pack
  ]
});

// see: perplexity.ai/search/does-rapier-physics-work-with-VQ3x7r5sQtWXKH_mdqg76A
```
