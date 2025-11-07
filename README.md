# Task Monitor Dashboard

A real-time task monitoring dashboard built with Vue 3, Pinia, and WebSocket for live updates of Instagram scraping tasks.

## Features

- **Real-time Updates**: WebSocket integration for live task status updates
- **Task Management**: View, cancel, and download task results
- **Filtering & Pagination**: Filter by status and time range with pagination support
- **Toast Notifications**: Real-time notifications for task status changes
- **Responsive Design**: Mobile-friendly interface
- **Comprehensive Testing**: Unit and component tests with mocked WebSocket and API

## Tech Stack

- **Frontend**: Vue 3 + Vite + Pinia
- **Backend**: Node.js with WebSocket server
- **Testing**: Vitest + Vue Test Utils + Happy DOM
- **Styling**: Vanilla CSS with modern design

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── TaskMonitor.vue    # Main dashboard component
│   │   └── TaskItem.vue       # Individual task component
│   ├── stores/
│   │   └── taskStore.js       # Pinia store for task management
│   ├── test/
│   │   ├── setup.js           # Test setup and mocks
│   │   ├── taskStore.test.js  # Store tests
│   │   ├── TaskItem.test.js   # TaskItem component tests
│   │   └── TaskMonitor.test.js # TaskMonitor component tests
│   ├── App.vue                # Root component
│   └── main.js                # App entry point
├── index.html                 # HTML template
├── vite.config.js            # Vite configuration
├── vitest.config.js          # Test configuration
└── package.json              # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the backend server:
```bash
npm start
```

3. In a new terminal, start the frontend development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm start` - Start the backend server (port 3000)
- `npm run dev` - Start frontend development server (port 5173)
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run test:ui` - Run tests with UI

## API Endpoints

The backend server provides the following endpoints:

- `GET /healthz` - Health check
- `GET /api/v1/tasks` - Get tasks with pagination and filtering
- `POST /api/v1/tasks` - Create new task
- `POST /api/v1/tasks/{id}/cancel` - Cancel a task
- `GET /api/v1/tasks/{id}/download` - Download task results
- `WS ws://localhost:8080` - WebSocket for real-time updates

### Query Parameters for Tasks Endpoint

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `status` - Filter by status (pending, running, completed, failed, cancelled, challenge_required)
- `timeRange` - Filter by time range (1h, 24h, 7d, 30d)

## WebSocket Events

The WebSocket server emits the following events:

- `TASK_STATUS_UPDATE` - Task status or progress changed
- `TASK_CREATED` - New task created
- `TASK_COMPLETED` - Task completed successfully
- `TASK_FAILED` - Task failed with error
- `TASK_CANCELLED` - Task was cancelled
- `CHALLENGE_REQUIRED` - Task requires user attention

## Task Statuses

- `pending` - Task is queued and waiting to start
- `running` - Task is currently executing
- `completed` - Task finished successfully
- `failed` - Task failed with an error
- `cancelled` - Task was cancelled by user
- `cancelling` - Task is in the process of being cancelled
- `challenge_required` - Task requires user interaction (e.g., email verification)

## Testing

The application includes comprehensive test coverage:

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run tests with coverage
npm run test -- --coverage

# Run tests with UI
npm run test:ui
```

### Test Structure

- **Unit Tests**: Test individual functions and business logic
- **Component Tests**: Test Vue components with mocked dependencies
- **Integration Tests**: Test component interactions and data flow

### Mocking

- **WebSocket**: Mocked WebSocket implementation for tests
- **API Calls**: Axios is mocked to avoid actual HTTP requests
- **DOM APIs**: Browser APIs are mocked using Happy DOM

## Features in Detail

### Real-time Updates

The dashboard connects to a WebSocket server to receive live updates about task status changes. When a task's status changes, all connected clients receive immediate updates without needing to refresh.

### Filtering and Pagination

- **Status Filtering**: Filter tasks by their current status
- **Time Range Filtering**: Filter tasks by creation time (last hour, 24 hours, 7 days, 30 days)
- **Pagination**: Navigate through large sets of tasks with configurable page size

### Task Actions

- **Cancel**: Stop running or pending tasks
- **Download**: Download results from completed tasks
- **View Details**: Expand to see more information about a task

### Toast Notifications

The application displays toast notifications for:
- Task completion
- Task failures
- Task cancellations
- Challenge requirements

## Development

### Adding New Features

1. **Store Updates**: Add new state and actions to `src/stores/taskStore.js`
2. **Component Updates**: Modify Vue components as needed
3. **API Updates**: Update backend endpoints if required
4. **Tests**: Add corresponding tests for new functionality

### Code Style

- Use Vue 3 Composition API
- Follow Pinia store patterns
- Write descriptive test cases
- Maintain consistent naming conventions

### WebSocket Integration

The WebSocket connection is automatically managed by the Pinia store:
- Automatic reconnection on disconnection
- Graceful error handling
- Cleanup on component unmount

## Production Deployment

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

### Environment Variables

- `PORT` - Backend server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**: Ensure backend server is running on port 8080
2. **CORS Errors**: Check that backend has proper CORS headers
3. **Tests Failing**: Verify all dependencies are installed and mocks are working

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=true npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

MIT License