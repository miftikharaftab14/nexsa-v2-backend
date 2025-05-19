# Nexsa API

A NestJS-based REST API for the Nexsa platform.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm

## Environment Setup

1. Create a `.env` file in the root directory with the following variables:

```env
# Application
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_DATABASE=nexsa_db

# JWT
JWT_SECRET=your_jwt_secret_key
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Run database migrations:
```bash
npm run migration:run
```

## Running the Application

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

## API Documentation

Once the application is running, you can access the Swagger documentation at:
```
http://localhost:3000/
```

## Available Scripts

- `npm run start:dev` - Start the application in development mode
- `npm run build` - Build the application
- `npm run start:prod` - Start the application in production mode
- `npm run migration:generate` - Generate a new migration
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert the last migration
- `npm run test` - Run tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Run linting
- `npm run format` - Format code using Prettier

## Project Structure

```
src/
├── auth/                 # Authentication related code
│   ├── decorators/      # Custom decorators (roles, etc.)
│   ├── guards/          # Authentication guards
│   ├── strategies/      # JWT strategy
│   └── auth.service.ts  # Authentication service
├── common/              # Common utilities and shared code
│   ├── decorators/      # Common decorators
│   ├── enums/          # Enum definitions
│   ├── filters/        # Exception filters
│   ├── guards/         # Common guards
│   ├── interfaces/     # TypeScript interfaces
│   ├── pipes/          # Custom pipes
│   └── validation/     # Validation schemas
├── config/              # Configuration files
│   ├── dbConfiguration.ts
│   └── jwtConfiguration.ts
├── users/               # User management
│   ├── controllers/    # User controllers
│   ├── dto/           # Data transfer objects
│   ├── entities/      # User entity
│   └── services/      # User services
├── migrations/         # Database migrations
├── app.module.ts       # Root application module
└── main.ts            # Application entry point
```

## Features

- User authentication with JWT
- Role-based access control (ADMIN, SELLER, CUSTOMER)
- User management
- Swagger API documentation
- TypeORM for database operations
- Environment configuration
- Request validation
- Error handling
- Logging

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

This project is licensed under the MIT License.
