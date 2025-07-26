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

### Your JS needs to be copied manually to the `Dockerfile`:

```Dockerfile
# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app/build /app/build
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app

# Copy the custom server entrypoint and backend (inc. physics.js)
COPY --from=build /app/server.js /app/server.js
COPY --from=build /app/src/lib /app/src/lib

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD [ "node", "./build/index.js" ]

CMD [ "node", "server.js" ]
```

### Warning about using WASM/Rapier

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
