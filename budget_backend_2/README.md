# Budget Backend 2 (Node.js)

This service is a like-for-like Node.js implementation of the existing Flask backend. It exposes the same REST API surface so the current frontend can switch between implementations without any changes.

## Prerequisites

- Node.js 18+
- MySQL instance that already contains the `BudgetAndExpense` schema/tables

## Setup

1. `cd budget_backend_2`
2. Copy `.env.example` to `.env` and update credentials/port as needed.
3. Install dependencies: `npm install`

## Running

- `npm start` – run the API once (production style)
- `npm run dev` – run with `nodemon` for auto-reloads

The server listens on `PORT` (defaults to `5000`) and serves the same `/api/...` routes as the Flask backend, including authentication, accounts, categories, transactions, budgets, goals, savings accounts, tags, and payment methods.


