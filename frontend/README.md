# Frontend Application

This is the Vue.js frontend for the Railway Deploy Automation application, built with TypeScript and using Pinia for state management.

## Features

- **Task Management**: Create, monitor, and manage deployment tasks
- **Web Scraping**: Submit and track web scraping jobs
- **Real-time Updates**: WebSocket integration for live status updates
- **UI Preferences**: Theme switching, notifications, and layout customization
- **Responsive Design**: Mobile-friendly interface

## Technology Stack

- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe JavaScript
- **Pinia** - Vue state management
- **Vue Router** - Client-side routing
- **Vite** - Build tool and dev server
- **Vitest** - Unit testing framework

## Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/         # Vue components
│   │   ├── TaskManager.vue
│   │   └── ScrapeManager.vue
│   ├── composables/        # Reusable composition functions
│   │   ├── useApi.ts
│   │   └── useWebSocket.ts
│   ├── router/            # Vue Router configuration
│   │   └── index.ts
│   ├── services/          # API and WebSocket services
│   │   ├── api.ts
│   │   └── websocket.ts
│   ├── stores/            # Pinia stores
│   │   ├── index.ts
│   │   ├── taskStore.ts
│   │   ├── scrapeStore.ts
│   │   ├── uiStore.ts
│   │   ├── __tests__/
│   │   └── README.md
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts
│   ├── test/              # Test setup files
│   │   └── setup.ts
│   ├── App.vue            # Root component
│   └── main.ts            # Application entry point
├── index.html             # HTML template
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite configuration
└── vitest.config.ts       # Vitest configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev

# The application will be available at http://localhost:5173
```

### Building

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing

```bash
# Run unit tests
npm run test:unit

# Run tests with coverage
npm run test:coverage
```

## Pinia Stores

The application uses three main Pinia stores for state management:

### Task Store (`useTaskStore`)
Manages deployment tasks with real-time updates via WebSocket.

### Scrape Store (`useScrapeStore`)
Handles web scraping jobs and form state management.

### UI Store (`useUiStore`)
Controls UI preferences, theme, notifications, and global state.

For detailed documentation, see `src/stores/README.md`.

## API Integration

The frontend communicates with a backend API through:

- **REST API**: For CRUD operations on tasks and scrape jobs
- **WebSocket**: For real-time updates and notifications

The API service is configured to proxy requests to `http://localhost:3000/api` during development.

## Component Examples

### Using Stores in Components

```vue
<template>
  <div>
    <h2>Tasks ({{ taskStore.activeTasks.length }} active)</h2>
    <button @click="createTask" :disabled="isLoading">Create Task</button>
  </div>
</template>

<script setup lang="ts">
import { useTaskStore } from '@/stores/taskStore'
import { useUiStore } from '@/stores/uiStore'

const taskStore = useTaskStore()
const uiStore = useUiStore()

const isLoading = computed(() => taskStore.isLoading)

const createTask = async () => {
  try {
    await taskStore.createTask({
      name: 'New Task',
      type: 'deployment'
    })
    uiStore.showSuccess('Success', 'Task created')
  } catch (error) {
    uiStore.showError('Error', 'Failed to create task')
  }
}
</script>
```

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow Vue 3 Composition API patterns
- Use Pinia stores for state management
- Write unit tests for store functionality

### State Management

- Keep component state local when possible
- Use stores for shared application state
- Leverage computed properties for derived state
- Handle async operations in store actions

### Error Handling

- Use the UI store for user-facing notifications
- Implement proper error boundaries
- Provide loading states for async operations

## Environment Variables

Create a `.env` file in the frontend root:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000/ws
```

## Deployment

The frontend is built as a static application and can be deployed to any static hosting service. The build output is in the `dist/` directory.

For Railway deployment, the frontend can be served from the same service as the backend or as a separate frontend service.

## Contributing

1. Follow the existing code patterns and conventions
2. Write tests for new functionality
3. Update documentation for any API changes
4. Ensure TypeScript types are properly defined