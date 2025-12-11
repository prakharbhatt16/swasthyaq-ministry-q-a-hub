# Parliament Question Studio
[![[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/prakharbhatt16/swasthyaq-ministry-q-a-hub)]](https://deploy.workers.cloudflare.com/?url=${repositoryUrl})
Parliament Question Studio is a visually polished, local-deployable Q&A management web application designed for parliamentary sessions. It enables users to create, categorize, and manage questions by house (Lok Sabha/Rajya Sabha) and division, attach hyperlinks to external folders (e.g., shared drives), update question statuses, and visualize metrics through interactive dashboards. Built on Cloudflare Workers with Durable Objects for persistent storage, the app provides a responsive, modern interface inspired by Azure DevOps workflows, complete with CRUD operations, real-time-like updates, and professional-grade UI polish.
## Features
- **Question Management**: Create, edit, view, and delete questions with rich text support, categorized by ministry divisions (e.g., AYUSH, Family Welfare).
- **House Filtering**: Filter questions by Lok Sabha or Rajya Sabha.
- **Attachments & Folders**: Hyperlink attachments to external folder paths (e.g., Google Drive or local shares), grouped by division for easy access.
- **Status Tracking**: Workflow statuses (Draft, Submitted, Answered, Closed) with admin controls to update and track progress.
- **Dashboards**: Overview metrics, charts (via Recharts) for questions by status and division, recent activity feeds, and filterable insights.
- **Search & Filtering**: Full-text search, division/status/house filters, pagination, and grid/list views for questions.
- **Admin Tools**: Mock authentication, bulk status changes, CSV exports, and seeded demo data for quick setup.
- **Responsive UI**: Mobile-first design with smooth animations, hover effects, and accessible interactions using shadcn/ui and Tailwind CSS.
- **Real-time UX**: Optimistic updates with React Query for seamless status changes and data syncing.
- **Secure & Scalable**: Server-side validation for attachments (HTTPS/drive URLs only), atomic operations via Durable Objects.
The app reproduces the structure of the Indian Parliament's Q&A page (sansad.in) while adding ministry-specific enhancements like division categorization and folder-linked attachments.
## Tech Stack
- **Frontend**: React 18, React Router 6, Tailwind CSS 3, shadcn/ui (component library), Framer Motion (animations), Recharts (charts), React Query (data fetching/caching), Sonner (toasts), Lucide React (icons).
- **Backend**: Cloudflare Workers, Hono (routing), Durable Objects (via custom IndexedEntity library for entities like Questions and Attachments).
- **State & Data**: Zustand (client state), Date-fns (formatting), Zod (validation), Immer (immutable updates).
- **Build & Dev**: Vite (bundler), TypeScript, ESLint, Bun (package manager).
- **Storage**: Single Global Durable Object for all entities, with indexing for efficient listing/pagination.
- **Other**: Radix UI primitives, clsx/tw-merge (utility), UUID (IDs).
## Quick Start
### Prerequisites
- Node.js 18+ (or Bun 1.0+ for faster installs).
- Cloudflare account (free tier sufficient for development).
- Wrangler CLI: Install via `npm i -g wrangler` or `bun add -g wrangler`.
### Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   cd parliament-question-studio
   ```
2. Install dependencies using Bun:
   ```
   bun install
   ```
3. (Optional) Generate TypeScript types from Wrangler:
   ```
   bun run cf-typegen
   ```
The project is pre-configured with mock data seeding for demo questions and attachments. No additional setup is needed for basic usage.
## Usage
### Local Development
Run the development server:
```
bun run dev
```
- Open [http://localhost:3000](http://localhost:3000) (or the port shown in the terminal).
- The app auto-seeds demo data on first API calls (e.g., visit Dashboard).
- Theme toggle is available in the top-right (light/dark mode).
- Navigation: Home (hero with CTAs), Dashboard (metrics/charts), Questions (list/editor), Attachments (folder links), Admin (mock login: use "admin" / "password").
### Key User Flows
1. **Create a Question**:
   - Navigate to Home > "Create Question" CTA.
   - Fill title, select house (Lok Sabha/Rajya Sabha), select division, add body, attach folder links.
   - Save: Question appears in list/dashboard with optimistic UI.
2. **Manage Status**:
   - In Question Detail: Use dropdown to change status (e.g., Draft → Answered).
   - Updates persist via API and reflect in dashboards.
3. **View Attachments**:
   - In Question Detail or Attachments view: Click hyperlinks to open external folders (e.g., `https://drive.google.com/folder/...`).
   - Grouped by division for organized access.
4. **Dashboard Insights**:
   - View pie/bar charts for status/division counts.
   - Filter questions by clicking chart segments; recent activity shows updates.
5. **Admin Actions**:
   - Access Admin panel (mock auth).
   - Seed more data, bulk-update statuses, export CSV.
All operations use JSON APIs (e.g., `POST /api/questions`) with error handling and loading states.
## Development
### Project Structure
- **Frontend (`src/`)**:
  - `pages/`: Route components (HomePage.tsx, Dashboard.tsx, etc.).
  - `components/ui/`: shadcn/ui primitives (Button, Card, etc.).
  - `lib/api-client.ts`: API fetch wrapper with React Query integration.
  - `hooks/`: Custom hooks (e.g., useTheme, useQuestionsQuery).
- **Backend (`worker/`)**:
  - `user-routes.ts`: Add API endpoints (e.g., for QuestionsEntity).
  - `entities.ts`: Define entities (extend IndexedEntity for Questions, Attachments).
  - `core-utils.ts`: DO library (do not modify).
- **Shared (`shared/`)**:
  - `types.ts`: API/data interfaces (e.g., Question, Attachment).
  - `mock-data.ts`: Seeding data.
### Adding Features
1. **New Entity** (e.g., Questions):
   - In `shared/types.ts`: Define `Question { id: string; title: string; division: string; house: 'Lok Sabha' | 'Rajya Sabha'; status: 'Draft' | ...; attachments: string[]; ... }`.
   - In `worker/entities.ts`: `export class QuestionEntity extends IndexedEntity<Question> { static entityName = 'question'; static seedData = [...]; }`.
   - In `worker/user-routes.ts`: Add routes (e.g., `app.post('/api/questions', async (c) => { ... await QuestionEntity.create(...); })`).
   - In frontend: Use `api<Question>('/api/questions')` with React Query.
2. **Frontend Pages**:
   - Add to `src/main.tsx` router: `{ path: '/dashboard', element: <Dashboard /> }`.
   - Use shadcn components: `import { Card, Button } from '@/components/ui/{card,button}'`.
   - API calls: `const { data } = useQuery({ queryKey: ['questions'], queryFn: () => api('/api/questions') });`.
3. **Styling**:
   - Follow UI non-negotiables: Root wrapper with `max-w-7xl mx-auto px-4...`.
   - Custom colors in `tailwind.config.js` (e.g., primary: #F38020).
   - Animations: Framer Motion for micro-interactions (e.g., `motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}`).
4. **Lint & Build**:
   ```
   bun run lint  # Check code quality
   bun run build # Production build
   bun run preview # Local preview
   ```
### Testing
- Manual: Use demo data; test CRUD, filters, status changes.
- API: Tools like Postman against `/api/questions` (seeded on GET).
- UI: Responsive testing (mobile-first); theme toggle.
## Deployment
Deploy to Cloudflare Workers for global, edge-hosted performance with zero-config scaling.
1. Authenticate Wrangler:
   ```
   wrangler login
   ```
2. Deploy:
   ```
   bun run deploy
   ```
- Your app will be live at `<project-name>.workers.dev` (e.g., swasthyaq-efput2jihksj3b2p9wzew.workers.dev).
- Durable Objects handle persistence across deploys.
- Custom domain: Use Wrangler or Cloudflare Dashboard.
[![[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/prakharbhatt16/swasthyaq-ministry-q-a-hub)]](https://deploy.workers.cloudflare.com/?url=${repositoryUrl})
For production:
- Set environment variables in `wrangler.jsonc` (e.g., for real auth).
- Monitor via Cloudflare Dashboard (logs, metrics).
- Updates: `bun run deploy` pushes changes instantly.
## License
This project is open-source and available under the MIT License. See the LICENSE file for details (if not present, contact the maintainers).