# Contextum

A local context-engineering learning platform for experimenting with, visualizing, and evaluating how different context layers change LLM outputs.

## Architecture

The application is structured as a monorepo containing three workspaces:

- `client`: Vite + React frontend dashboard.
- `server`: Express backend API and LLM proxy.
- `shared`: Shared TypeScript types used by both workspaces.

The system handles keys locally in your browser. When you unlock the vault, the AES-GCM encrypted keys stored in IndexedDB are decrypted. When generating a request, your key is passed to the local backend proxy, which negotiates the LLM API call directly and avoids exposing provider keys through frontend API calls.

## How to Run

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start the development servers:**

   ```bash
   npm run dev
   ```

3. **Open the dashboard:**

   Visit `http://localhost:5173` in your browser.

4. **Unlock and configure the vault:**

   Click the `Vault` button in the header. Enter a strong session passphrase, then add API keys for the providers you want to test.

   You can also skip the browser vault and set provider keys in `server/.env`:

   ```bash
   OPENAI_API_KEY=...
   GOOGLE_GENERATIVE_AI_API_KEY=...
   ANTHROPIC_API_KEY=...
   COHERE_API_KEY=...
   MISTRAL_API_KEY=...
   GROQ_API_KEY=...
   TOGETHER_API_KEY=...
   ```

5. **Run experiments:**

   Load a scenario preset or write your own prompt. Toggle context layers, run generations, and review LLM-as-judge scores.

## Useful Commands

```bash
npm run dev
npm run build
npm run lint --workspace=client
npm run build --workspace=server
```

On Windows PowerShell, if `npm` is blocked by execution policy, use `npm.cmd` instead:

```bash
npm.cmd run dev
npm.cmd run build
```
## Development Notes

- The root `dev` script starts both Vite and Express through a cross-platform Node runner.
- The Vite dev server proxies `/api/*` requests to `http://localhost:3001`, so frontend code can call relative API paths.
- The server uses AI SDK v6 streaming and exposes `/api/generate` and `/api/evaluate`.
- Provider keys are read from the browser vault first, then from server environment variables.
- Server builds clean `dist/` before compiling to avoid stale output.

## Features

- **7 provider support:** OpenAI, Google Gemini, Anthropic Claude, Cohere, Mistral, Groq, Together.
- **Dynamic context builder:** 6 configurable layers, including persona, base instructions, prompt enhancer, RAG context, history, and guardrails.
- **LLM-as-judge evaluation:** Rates relevance, coherence, completeness, hallucination risk, instruction adherence, and overall quality.
- **Persistent comparative analysis:** Keeps a local experiment history with response excerpts, scores, latency, token estimates, and cost estimates across page refreshes.
- **Local-first vault:** AES-GCM encrypted API key manager stored in the browser via `idb`.
## Development Notes

- The root `dev` script starts both Vite and Express through a cross-platform Node runner.
- The Vite dev server proxies `/api/*` requests to `http://localhost:3001`, so frontend code can call relative API paths.
- The server uses AI SDK v6 streaming and exposes `/api/generate` and `/api/evaluate`.
- Provider keys are read from the browser vault first, then from server environment variables.
- Server builds clean `dist/` before compiling to avoid stale output.

This is the Readme File