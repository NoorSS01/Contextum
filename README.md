# Contextum

A local context-engineering learning platform for experimenting with, visualizing, and evaluating how different context layers change LLM outputs.

## Architecture

The application is structured as a monorepo containing three workspaces:

- `client`: Vite + React frontend dashboard.
- `server`: Express backend API and LLM proxy.
- `shared`: Shared TypeScript types used by both workspaces.

The system handles keys locally in your browser. When you unlock the vault, the AES-GCM encrypted keys stored in IndexedDB are decrypted. When generating a request, your key is passed to the local backend proxy, which negotiates the LLM API call directly and avoids exposing provider keys through frontend API calls.

