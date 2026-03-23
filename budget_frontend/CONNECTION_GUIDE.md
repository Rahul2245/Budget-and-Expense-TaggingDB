# Frontend-Backend Connection Guide

## ✅ What's Been Connected

The frontend has been updated to connect to the Flask backend API. Here's what's been implemented:

### 1. API Service (`src/services/api.js`)
- Centralized API configuration
- Automatic authentication header injection
- All API endpoints defined

### 2. Authentication Pages
- ✅ **LoginPage**: Now connects to `/api/auth/login`
- ✅ **SignupPage**: Now connects to `/api/auth/signup`

### 3. Main Pages
- ✅ **DashboardPage**: Fetches dashboard data from `/api/users/{id}/dashboard`
- ✅ **AccountsPage**: Full CRUD operations for accounts
- ✅ **TransactionsPage**: Full CRUD operations for transactions

### 4. Pages Still Using Local State (Need Updates)
- ⚠️ **CategoriesPage**: Needs API integration
- ⚠️ **BudgetsPage**: Needs API integration
- ⚠️ **GoalsPage**: Needs API integration
- ⚠️ **SavingsAccountsPage**: Needs API integration
- ⚠️ **TagsPage**: Needs API integration

## How to Test the Connection

1. **Start the Backend**:
   ```bash
   cd budget_backend
   python app.py
   ```
   Backend runs on `http://localhost:5000`

2. **Start the Frontend**:
   ```bash
   cd budget_frontend
   npm run dev
   ```
   Frontend runs on `http://localhost:5173` (or similar)

3. **Test Login**:
   - Go to `/login`
   - Use existing user: `rahul@gmail.com` / `rahul123`
   - Or create a new account via `/signup`

4. **Test Features**:
   - Dashboard should show real data
   - Accounts page should load/create/delete accounts
   - Transactions page should load/create/delete transactions

## Next Steps

To complete the integration, update the remaining pages:
- CategoriesPage
- BudgetsPage
- GoalsPage
- SavingsAccountsPage
- TagsPage

Follow the same pattern as AccountsPage and TransactionsPage:
1. Import the API service
2. Use `useEffect` to fetch data on mount
3. Replace local state with API calls
4. Handle loading and error states




