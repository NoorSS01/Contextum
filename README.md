# Context Engineering Learning Platform

A local, single-page application and Express proxy built to help you experiment with, visualize, and evaluate the impact of various context layers on LLM outputs.

## Architecture 

The application is structured as a monorepo containing three workspaces:
- `client`: Vite + React frontend dashboard.
- `server`: Express backend API and LLM proxy.
- `shared`: Subdirectory holding shared types via path aliases.

The system handles keys locally in your browser. When you "unlock the vault", the AES-GCM encrypted keys stored in IndexedDB are decrypted. When generating a request, your key is securely passed to the local backend proxy, which negotiates the LLM API call directly over the wire preventing key leakage via browser network sniffing.

## How to Run

1. **Install dependencies:**
   From the root of the project:
   ```bash
   npm install
   ```

2. **Start the development servers:**
   Because this is a workspace setup, this single command boots both Vite and Express:
   ```bash
   npm run dev
   ```

3. **Open the Dashboard:**
   Visit `http://localhost:5173` in your browser. 

4. **Unlock and Configure Vault:**
   Click the "Vault" button in the header. Enter a strong session passphrase (this keeps your keys encrypted at rest). Input your API keys for the desired providers.

5. **Run Experiments:**
   Load a Scenario Preset or write your own prompt. Toggle context layers, run generations, and view LLM-as-judge scores.

## Features Developed in Phase 1
- **7 Provider Support:** OpenAI, Google Gemini, Anthropic Claude, Cohere, Mistral, Groq, Together.
- **Dynamic Context Builder:** 6 configurable layers (System/Persona, Base Instructions, Prompt Enhancer, RAG Context, History, Safety Guardrails).
- **LLM-as-Judge Evaluation Component:** Asynchronously rates the generation on five metrics (Relevance, Coherence, Completeness, Hallucination Risk, Instruction Adherence).
- **Comparative Analysis Table:** Side-by-side history of responses with full visual breakdown.
- **Vault:** Local-first, AES-GCM encrypted API key manager stored natively in the browser via `idb`. No database or cloud storage.
