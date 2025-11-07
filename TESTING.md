# Testing Documentation

This document outlines the comprehensive testing setup for the Railway Deployment Automation backend.

## Overview

The backend includes a robust testing suite with 85%+ coverage across all components, including unit tests, integration tests, and end-to-end testing capabilities.

## Test Structure

```
tests/
├── unit/                    # Unit tests for individual components
│   ├── controllers/         # Controller unit tests
│   ├── services/           # Service layer unit tests
│   ├── repositories/        # Repository layer unit tests
│   ├── models/            # Model unit tests
│   ├── middleware/         # Middleware unit tests
│   └── utils/             # Utility function unit tests
├── integration/            # Integration tests for API endpoints
│   └── controllers/        # Controller integration tests
├── fixtures/              # Test data fixtures
├── factories/            # Test data factories
├── mocks/               # Mock configurations
├── helpers/              # Test helper utilities
└── setup.js              # Global test setup
```

## Running Tests

### All Tests with Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

### CI Mode
```bash
npm run test:ci
```

## Coverage Requirements

The test suite enforces 85% coverage across all metrics:
- **Statements**: 85%
- **Branches**: 85%  
- **Functions**: 85%
- **Lines**: 85%

Coverage reports are generated in:
- `coverage/lcov.info` - For CI upload
- `coverage/lcov-report/index.html` - For local viewing

## Test Utilities

### Database Setup
- Uses in-memory SQLite for testing
- Automatic database initialization and cleanup
- Transaction rollback between tests

### Mocking
- **AWS SDK**: Mocked S3 services
- **Nodemailer**: Mocked email sending
- **Redis**: Mocked caching layer
- **WebSocket**: Mocked real-time communication

### Test Factories
- **UserFactory**: Creates test users with various configurations
- **DeploymentFactory**: Creates test deployments with different states
- Supports bulk creation and custom overrides

## Test Categories

### Unit Tests (75+ service tests, 25+ controller tests, 15+ repository tests)

#### Services
- **UserService**: Authentication, CRUD operations, validation
- **DeploymentService**: Deployment lifecycle, status management
- **AuditService**: Activity logging, reporting
- **EmailService**: Email notifications, templates
- **S3Service**: File storage, log management

#### Controllers  
- **UserController**: User endpoints, error handling
- **DeploymentController**: Deployment endpoints, status updates
- **AuditController**: Audit endpoints, reporting

#### Repositories
- **UserRepository**: Database operations, data integrity
- **DeploymentRepository**: Deployment persistence, queries
- **AuditLogRepository**: Audit trail, logging

#### Models
- **User**: Password hashing, data serialization
- **Deployment**: Status validation, configuration handling
- **AuditLog**: Log creation, data formatting

#### Middleware
- **ErrorHandler**: Error formatting, status codes
- **RequestLogger**: Request tracking, performance monitoring

### Integration Tests

#### API Endpoints
- **User CRUD**: Create, read, update, delete operations
- **Authentication**: Login, validation, error handling
- **Deployment Management**: Create, update, cancel, delete
- **Audit Trails**: Activity logging, reporting
- **Health Checks**: Service status, uptime monitoring

## Test Data

### Fixtures
- Sample user data with various roles
- Deployment configurations for different environments
- Audit log examples for testing

### Factories
- Dynamic test data generation
- Bulk creation capabilities
- Customizable attributes
- Valid and invalid data scenarios

## CI/CD Integration

### GitHub Actions
- Automated testing on pull requests and pushes
- Multi-node version testing (18.x, 20.x)
- Coverage reporting to Codecov
- Fail-fast on coverage threshold violations

### Coverage Enforcement
- Tests fail if coverage drops below 85%
- Branch coverage prioritized for complex logic
- Function coverage ensures all methods are tested
- Line coverage guarantees comprehensive testing

## Best Practices

### Test Organization
- Descriptive test names and descriptions
- Logical grouping by functionality
- Clear separation of concerns
- Reusable test utilities

### Error Testing
- Comprehensive error path coverage
- Invalid input validation
- Database constraint violations
- Network error simulation

### Performance Testing
- Response time validation
- Database query efficiency
- Memory usage monitoring
- Concurrent request handling

### Security Testing
- Input sanitization verification
- Authentication bypass attempts
- SQL injection prevention
- XSS protection validation

## Mock Strategy

### External Services
- **S3**: File upload/download simulation
- **Email**: Delivery confirmation without actual sending
- **Redis**: Cache behavior validation
- **WebSocket**: Real-time feature testing

### Database
- Transaction isolation
- Rollback on test failure
- Consistent state management
- Performance benchmarking

## Debugging

### Test Isolation
- Each test runs in clean environment
- No shared state between tests
- Deterministic test results
- Easy failure identification

### Logging
- Detailed test execution logs
- Error stack traces
- Performance metrics
- Coverage statistics

## Future Enhancements

### Planned Additions
- End-to-end test scenarios
- Performance benchmarking suite
- Security vulnerability scanning
- Load testing integration

### Continuous Improvement
- Coverage optimization
- Test execution performance
- CI/CD pipeline enhancement
- Documentation updates