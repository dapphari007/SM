# SM-ARGO Backend

A TypeScript-based REST API backend for the Skill Management and Assessment Resource Governance & Optimization (SM-ARGO) system. This backend provides comprehensive skill management, user authentication, and assessment capabilities.

## 🚀 Features

- **User Management**: Complete user lifecycle management with role-based access control
- **Skill Management**: Create, update, and manage skills and skill criteria
- **Assessment System**: Skill assessment requests and evaluations
- **Upgrade Guides**: Skill improvement recommendations and guides
- **Authentication**: JWT-based authentication with OAuth integration
- **Role-Based Access**: Different access levels for HR, Team Leads, and Employees
- **Database**: PostgreSQL with TypeORM for robust data management

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Hapi.js
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT with @hapi/jwt, OAuth with @azure/msal-node
- **Password Hashing**: bcrypt
- **Environment**: dotenv

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn package manager

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SM-ARGO/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the backend root directory:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=your_db_username
   DB_PASSWORD=your_db_password
   DB_NAME=sm_argo_db

   # Server Configuration
   PORT=3000

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key

   # OAuth Configuration (if using)
   AZURE_CLIENT_ID=your_azure_client_id
   AZURE_CLIENT_SECRET=your_azure_client_secret
   AZURE_TENANT_ID=your_azure_tenant_id
   ```

4. **Database Setup**
   - Create a PostgreSQL database
   - Update the database configuration in your `.env` file
   - The application will automatically create tables on first run

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```
This starts the server with hot-reload using nodemon and ts-node.

### Production Build
```bash
npm run build
npm start
```

### Alternative Start Methods
```bash
# Start with TypeScript directly
npm run start:ts

# Start with JavaScript (after build)
npm run dev:js
```

## 📁 Project Structure

```
backend/
├── config/
│   └── dataSource.ts        # Database configuration
├── controllers/             # Request handlers
│   ├── AssessmentController.ts
│   ├── authController.ts
│   ├── SkillController.ts
│   ├── SkillUpdateRequestController.ts
│   ├── SkillUpgradeGuideController.ts
│   └── UserController.ts
├── entities/               # Database models
│   ├── AssessmentRequest.ts
│   ├── Audit.ts
│   ├── Auth.ts
│   ├── Position.ts
│   ├── Role.ts
│   ├── Score.ts
│   ├── Skill.ts
│   ├── SkillUpgradeGuide.ts
│   ├── Team.ts
│   └── User.ts
├── middlewares/            # Custom middleware
│   └── authorizeRole.js
├── routes/                 # API route definitions
│   ├── AssessmentRoute.ts
│   ├── AuthRoute.ts
│   ├── skillRoute.ts
│   ├── SkillUpdateRequestRoute.ts
│   ├── skillUpgradeGuideRoute.ts
│   └── UserRoute.ts
├── services/              # Business logic layer
│   ├── AssessmentService.ts
│   ├── SkillService.ts
│   ├── SkillUpgradeGuideService.ts
│   └── UserService.ts
├── types/                 # TypeScript type definitions
│   ├── entities.ts
│   ├── hapi.ts
│   └── services.ts
├── index.ts              # Application entry point
├── package.json
└── tsconfig.json
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/oauth` - OAuth authentication

### Users
- `GET /users` - Get all users
- `GET /users/{id}` - Get user by ID
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user

### Skills
- `GET /skills` - Get all skills
- `POST /skills` - Create new skill
- `PUT /skills/{id}` - Update skill
- `DELETE /skills/{id}` - Delete skill

### Assessments
- `GET /assessments` - Get all assessments
- `POST /assessments` - Create assessment request
- `PUT /assessments/{id}` - Update assessment
- `GET /assessments/pending` - Get pending assessments

### Skill Upgrade Guides
- `GET /guides` - Get all upgrade guides
- `POST /guides` - Create upgrade guide
- `PUT /guides/{id}` - Update guide

## 🔐 Authentication & Authorization

The application uses JWT-based authentication with role-based access control:

- **HR**: Full system access
- **Team Lead**: Team management and assessments
- **Employee**: Personal profile and skill requests

## 🗄️ Database Schema

The application uses the following main entities:
- **User**: User account information
- **Skill**: Skill definitions and criteria
- **AssessmentRequest**: Skill assessment requests
- **SkillUpgradeGuide**: Skill improvement guides
- **Role**: User roles and permissions
- **Team**: Team organization
- **Score**: Assessment scores
- **Audit**: System audit trails

## 🧪 Testing

```bash
npm test
```
*Note: Test implementation is currently pending.*

## 🔧 Development

### Adding New Features

1. **Create Entity**: Add new database models in `entities/`
2. **Create Service**: Implement business logic in `services/`
3. **Create Controller**: Add request handlers in `controllers/`
4. **Define Routes**: Add API endpoints in `routes/`
5. **Update Types**: Add TypeScript definitions in `types/`

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Implement proper error handling
- Add appropriate TypeORM decorators for entities

## 🚀 Deployment

1. **Environment Variables**: Ensure all production environment variables are set
2. **Build**: Run `npm run build` to compile TypeScript
3. **Database**: Ensure PostgreSQL is running and accessible
4. **Start**: Use `npm start` to run the compiled application

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DB_HOST` | Database host | Yes |
| `DB_PORT` | Database port | Yes |
| `DB_USERNAME` | Database username | Yes |
| `DB_PASSWORD` | Database password | Yes |
| `DB_NAME` | Database name | Yes |
| `PORT` | Server port | No (default: 3000) |
| `JWT_SECRET` | JWT secret key | Yes |
| `AZURE_CLIENT_ID` | Azure OAuth client ID | No |
| `AZURE_CLIENT_SECRET` | Azure OAuth client secret | No |
| `AZURE_TENANT_ID` | Azure tenant ID | No |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if necessary
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check database credentials in `.env`
   - Ensure database exists

2. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill existing processes on the port

3. **TypeORM Synchronization Issues**
   - Check entity definitions
   - Verify database permissions
   - Review migration logs

For more help, please create an issue in the repository.
