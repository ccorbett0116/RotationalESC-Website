## Rotational Equipment Services

Industrial equipment maintenance, repair, and optimization platform. This codebase powers the marketing site & customer portal for services covering pumps, compressors, turbines, motors and related rotating assets.

### Tech Stack
React (Vite + SWC)  | TypeScript | Tailwind CSS | shadcn/ui | Radix Primitives | React Router | React Hook Form + Zod | TanStack Query | Recharts

### Getting Started
1. Ensure Node 18+ is installed (recommend using nvm).
2. Install dependencies:
	npm install
3. Start development server:
	npm run dev
4. Open http://localhost:5173 (or shown port).

### Scripts
- dev: Run local dev server
- build: Production build
- preview: Preview production build
- lint: Run ESLint

### Project Structure (simplified)
- src/pages: Route-level pages
- src/components: Reusable UI + layout primitives
- src/components/ui: shadcn/ui component implementations
- src/lib: Utility helpers
- src/data: Mock/test data

### Deployment

#### Docker Deployment (Recommended)

**Production (using pre-built images):**
```bash
# Pull latest images and start services
make pull
make up
```

**Development (local builds):**
```bash
# Build and start development environment
make up-dev
```

**Available Docker commands:**
- `make up` - Start production environment (uses pre-built images from GitHub)
- `make up-dev` - Start development environment (builds images locally)
- `make down` - Stop production environment
- `make down-dev` - Stop development environment
- `make build` - Build development images
- `make pull` - Pull latest production images
- `make rebuild` - Rebuild and restart development environment

#### Static Build Deployment
Build a static bundle (dist/) with:
  npm run build
Then deploy the dist directory to any static host (Netlify, Vercel, S3, etc.).

#### CI/CD
The project uses GitHub Actions to automatically build and push Docker images to GitHub Container Registry when code is pushed to the `main` branch. Images are available at:
- `ghcr.io/ccorbett0116/rotationalesc-website/frontend:latest`
- `ghcr.io/ccorbett0116/rotationalesc-website/backend:latest`

### Customization Notes
- Update branding (colors, favicon) in tailwind.config and public assets.
- Adjust SEO/meta tags in index.html.
- Add analytics / monitoring snippets in index.html before closing head tag.