# Nexsa V2

A modern NestJS-based REST API platform with PostgreSQL integration.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Running the Application](#running-the-application)
- [Docker Setup](#docker-setup)
- [Project Structure](#project-structure)
- [Features](#features)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm
- Docker and Docker Compose (for containerized deployment)

## Getting Started

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

## Running the Application

### Local Development
Create a `.env` file in the root directory:
```env
# Application
PORT=3000
NODE_ENV=local

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=nexsa_db

# JWT
JWT_SECRET=your_jwt_secret_key
```

Then run:
```bash
# Run database migrations
npm run migration:run

# Start the application
npm run start:dev
```

### Available Scripts
```bash
npm run build          # Build the application
npm run start:prod     # Start in production mode
npm run migration:generate  # Generate new migration
npm run migration:run      # Run pending migrations
npm run migration:revert   # Revert last migration
npm run test           # Run unit tests
npm run test:e2e       # Run end-to-end tests
npm run lint           # Run linting
npm run format         # Format code using Prettier
```

## Docker Setup

### Development Mode
Create a `.env.development` file in the root directory:
```env
# Application
PORT=3000
NODE_ENV=development

# Database
DB_HOST=db
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=nexsa_db

# JWT
JWT_SECRET=your_jwt_secret_key
```

Then run:
```bash
# Start all services
NODE_ENV=development docker-compose up --build

# Start specific services
docker-compose up app db

# Run in detached mode
docker-compose up -d
```

### Production Mode
Create a `.env.production` file in the root directory:
```env
# Application
PORT=3000
NODE_ENV=production

# Database
DB_HOST=your_production_db_host
DB_PORT=5432
DB_USERNAME=your_production_username
DB_PASSWORD=your_production_password
DB_DATABASE=your_production_db

# JWT
JWT_SECRET=your_production_jwt_secret
```

Then run:
```bash
NODE_ENV=production docker-compose up --build
```

### External Database Configuration
For external databases (e.g., AWS RDS):
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
DB_HOST=your-db-host
DB_PORT=5432
DB_USERNAME=your-user
DB_PASSWORD=your-password
DB_DATABASE=your-db-name
```

### Docker Commands
```bash
docker-compose build           # Build images
docker-compose logs -f         # View logs
docker-compose down           # Stop services
docker-compose down -v        # Remove volumes
docker-compose up --build     # Rebuild and start
```

## Project Structure
```
src/
├── auth/                 # Authentication
│   ├── decorators/      # Custom decorators
│   ├── guards/          # Auth guards
│   ├── strategies/      # JWT strategy
│   └── auth.service.ts  # Auth service
├── common/              # Shared utilities
│   ├── decorators/      # Common decorators
│   ├── enums/          # Enums
│   ├── filters/        # Exception filters
│   ├── guards/         # Common guards
│   ├── interfaces/     # TypeScript interfaces
│   ├── pipes/          # Custom pipes
│   └── validation/     # Validation schemas
├── config/              # Configuration
├── users/               # User management
├── migrations/          # Database migrations
├── app.module.ts        # Root module
└── main.ts             # Entry point
```

## Features

- 🔐 JWT Authentication
- 👥 Role-based access control (ADMIN, SELLER, CUSTOMER)
- 👤 User management
- 📚 Swagger API documentation
- 🗄️ TypeORM database integration
- ⚙️ Environment configuration
- ✅ Request validation
- 🚨 Error handling
- 📝 Logging
- 🐳 Docker support
- 🏥 Health checks

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

This project is licensed under the MIT License.
