# Context Engineering Learning Platform

A local, single-page application and Express proxy built to help you experiment with, visualize, and evaluate the impact of various context layers on LLM outputs.
Name of this Project is Contextum

## Architecture 

The application is structured as a monorepo containing three workspaces:
- `client`: Vite + React frontend dashboard.
- `server`: Express backend API and LLM proxy.
- `shared`: Subdirectory holding shared types via path aliases.

The system handles keys locally in your browser. When you "unlock the vault", the AES-GCM encrypted keys stored in IndexedDB are decrypted. When generating a request, your key is securely passed to the local backend proxy, which negotiates the LLM API call directly over the wire preventing key leakage via browser network sniffing.

