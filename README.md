# My Journal - Frontend

A modern, secure journaling application built with React, TypeScript, and Vite. Features end-to-end encryption, autosave, draft management, and full-text search.

## 🚀 Tech Stack

- **React 19** - UI framework
- **TypeScript 5.9** - Type safety with strict mode
- **Vite 7** - Build tool and dev server
- **TanStack Query** - Server state management and caching
- **React Router 7** - Client-side routing
- **Tailwind CSS v4** - Utility-first styling
- **shadcn/ui** - Accessible UI components
- **Sonner** - Toast notifications
- **Lucide React** - Icon library
- **Zod** - Schema validation

## 📁 Project Structure

```
src/
├── auth/                    # Authentication module
│   ├── AuthContext.tsx      # Auth state provider
│   ├── hooks.ts             # useAuth hook
│   └── index.ts
├── components/
│   ├── layout/              # Shared layout components
│   │   └── AppHeader.tsx    # Global header with search
│   ├── ui/                  # shadcn/ui components
│   │   ├── alert.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   └── spinner.tsx
│   └── RouteGuards.tsx      # Auth route protection
├── features/
│   ├── journal/             # Journal feature module
│   │   ├── api.ts           # API service
│   │   ├── types.ts         # TypeScript types
│   │   ├── components/
│   │   │   ├── EntryList.tsx
│   │   │   ├── EntryStatus.tsx
│   │   │   ├── EntryToolbar.tsx
│   │   │   └── JournalEditor.tsx
│   │   ├── hooks/
│   │   │   ├── useAutosave.ts
│   │   │   └── useJournal.ts
│   │   └── pages/
│   │       ├── DraftsPage.tsx
│   │       ├── JournalEditorPage.tsx
│   │       └── JournalListPage.tsx
│   └── search/              # Search feature module
│       ├── api.ts           # Search API service
│       ├── types.ts         # Search types
│       ├── components/
│       │   ├── SearchInput.tsx
│       │   ├── SearchResultItem.tsx
│       │   ├── SearchResultsList.tsx
│       │   └── SearchSuggestions.tsx
│       ├── hooks/
│       │   └── useSearch.ts
│       └── pages/
│           └── SearchPage.tsx
├── lib/
│   ├── api.ts               # Fetch wrapper with auth
│   └── utils.ts             # Utility functions
├── pages/
│   ├── LoginPage.tsx
│   └── RegisterPage.tsx
├── styles/
│   └── globals.css          # Tailwind imports
├── App.tsx                  # Root component
├── main.tsx                 # Entry point
└── router.tsx               # Route configuration
```

## ✨ Features

### Authentication
- **Login/Register** - Secure authentication with JWT tokens
- **Token Refresh** - Automatic token refresh on 401 errors
- **Protected Routes** - Auth guards with proper redirects
- **Flash Prevention** - No flash of login page when authenticated

### Journal
- **Create/Edit Entries** - Rich text editing with title and content
- **Publish/Unpublish** - Toggle between draft and published states
- **Delete Entries** - Soft delete with confirmation
- **Entry List** - View all published entries with counts

### Drafts
- **Draft Management** - Separate drafts page
- **Autosave** - Automatic saving for drafts (2s debounce)
- **Manual Save** - Published entries require manual save
- **Draft Counter** - Badge showing draft count in navigation

### Search
- **Global Search Bar** - Always available in header
- **Keyboard Shortcut** - `⌘K` / `Ctrl+K` to focus search
- **Live Suggestions** - Real-time results as you type
- **Debounced Input** - 300ms debounce to reduce API calls
- **Race Condition Prevention** - AbortController + request ID tracking

### UX Polish
- **Optimistic Updates** - Instant UI feedback
- **Loading States** - Spinners and skeleton loaders
- **Error Handling** - User-friendly error messages
- **Responsive Design** - Mobile-first approach
- **Status Indicators** - Visual feedback for save state

## 🛠️ Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend API running on `http://localhost:3000`

### Installation

```bash
# Clone repository
git clone <repo-url>
cd my-journal-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment

The API base URL is configured in `src/lib/api.ts`:
```typescript
const API_BASE = 'http://localhost:3000/api';
```

## 📜 Available Scripts

```bash
# Development server with HMR
npm run dev

# Type checking
npm run build

# Production build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🔗 API Integration

The frontend communicates with the backend through these endpoints:

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout user |

### Journal
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/journal` | List published entries |
| GET | `/journal/:id` | Get single entry |
| POST | `/journal` | Create entry |
| PUT | `/journal/:id` | Update entry |
| DELETE | `/journal/:id` | Delete entry |
| GET | `/journal/counts` | Get entry counts |

### Drafts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/journal/drafts` | List drafts |
| POST | `/journal/drafts` | Create/update draft |
| DELETE | `/journal/drafts/:id` | Delete draft |
| POST | `/journal/drafts/:id/publish` | Publish draft |

### Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/journal/search?q=term` | Search entries |
| POST | `/journal/search/rebuild` | Rebuild search index |
| GET | `/journal/search/stats` | Search statistics |

## 🏗️ Architecture Decisions

### Feature-Based Structure
Code is organized by feature (journal, search) rather than by type (components, hooks). This improves cohesion and makes features easier to maintain.

### TanStack Query
Used for server state management instead of Redux/Context. Provides:
- Automatic caching and invalidation
- Background refetching
- Optimistic updates
- Request deduplication

### Autosave Strategy
- **Drafts**: Autosave enabled with 2-second debounce
- **Published**: Manual save only (prevents accidental changes)
- **Race Condition Prevention**: Uses ref-based lock to prevent duplicate saves

### Search Implementation
- Debounced input (300ms) to reduce API calls
- AbortController to cancel pending requests
- Request ID tracking to ignore stale responses
- Suggestions dropdown with keyboard navigation

## 🐛 Known Issues & Solutions

### Flash of Login Page
**Problem**: Brief flash of login form when authenticated user loads app.
**Solution**: `AuthRedirect` component waits for auth state before redirecting.

### Duplicate Draft Creation
**Problem**: Multiple drafts created when typing fast.
**Solution**: Added `isSavingRef` lock to prevent concurrent saves.

### Stale Content on Navigation
**Problem**: Old content shown when clicking different entries.
**Solution**: Proper React Query cache invalidation and key management.

## 📝 License

MIT
