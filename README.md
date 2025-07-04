# Skill Matrix Assessment System (SM-ARGO)

## Overview

SM-ARGO is a comprehensive full-stack skill assessment and management system designed for organizations to track, assess, and improve employee skills. The system provides role-based workflows for HR, Team Leads, and Employees with automated assessment cycles, audit trails, and scheduling capabilities.

## Features

### 🎯 Core Functionality
- **Role-based access control** (HR, Team Lead, Employee)
- **Skill matrix management** with assessment criteria
- **Automated assessment workflows** with multiple review cycles
- **Audit trails and history tracking** for all assessment activities
- **Automated scheduling** with cron-based task management
- **OAuth2 and legacy authentication** support

### 📊 Assessment Workflow

#### For HR Users
- **Initiate assessments** for employees or team leads
- **Bulk assessment creation** for teams or departments
- **HR review and final approval** of assessments
- **Assessment cycle management** with automated scheduling
- **Comprehensive audit tracking** and reporting
- **Team and user management** capabilities

#### For Team Leads
- **Write assessments** for team members
- **Team assessment overview** with statistics and filtering
- **Assessment history management** and review cycles
- **Skill gap analysis** and team performance tracking
- **Assessment scheduling** and progress monitoring

#### For Employees
- **Review and respond** to assessments from team leads
- **Approve or reject** assessments with comments
- **Assessment history tracking** and personal skill progress
- **Skill upgrade recommendations** and learning paths
- **Performance dashboard** with skill progress visualization

### 🔄 Assessment Cycle Process

1. **Initiation** - HR initiates assessment for employee
2. **Team Lead Assessment** - Lead writes detailed skill assessments
3. **Employee Review** - Employee reviews, approves/rejects with feedback
4. **HR Final Review** - HR makes final approval decision
5. **Audit & History** - Complete trail of all actions and decisions
6. **Automated Scheduling** - Cron-based recurring assessments

## Technology Stack

### Backend
- **Node.js** with **TypeScript**
- **Hapi.js** web framework
- **TypeORM** for database management
- **PostgreSQL** database
- **OAuth2** authentication with Microsoft Azure AD
- **Cron scheduling** for automated tasks
- **Comprehensive audit logging**

### Frontend
- **React 18** with **TypeScript**
- **Vite** build tool
- **Redux Toolkit** for state management
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Shadcn/ui** component library
- **Responsive design** with mobile support

## Project Structure

```
SM-ARGO/
├── backend/
│   ├── controllers/          # API request handlers
│   ├── services/            # Business logic layer
│   ├── entities/            # Database entity definitions
│   ├── routes/              # API route definitions
│   ├── middlewares/         # Authentication & authorization
│   ├── config/              # Database and app configuration
│   ├── data/                # Seed data and fixtures
│   ├── types/               # TypeScript type definitions
│   └── enum/                # Enumeration constants
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── assessment/  # Assessment-related components
│   │   │   ├── auth/        # Authentication components
│   │   │   ├── dashboard/   # Role-based dashboards
│   │   │   ├── layout/      # Layout and navigation
│   │   │   ├── team/        # Team management
│   │   │   └── ui/          # Reusable UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API service layer
│   │   ├── store/           # Redux store configuration
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   └── dist/                # Built production files
└── README.md
```

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn package manager

### Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment:**
   - Copy `.env.example` to `.env`
   - Configure database connection
   - Set up OAuth2 credentials (optional)

3. **Database setup:**
   ```bash
   npm run reset-db    # Reset and seed database
   npm run seed        # Seed with sample data
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## User Guide

### HR Users

#### Initiating Assessments
1. Navigate to **HR Assessment Management**
2. Click **"Initiate New Assessment"**
3. Select target employee and skills
4. Set scheduling preferences
5. Add assessment comments
6. Submit to start the workflow

#### Managing Assessment Cycles
1. Use the **Assessment Cycles** tab
2. View all active and completed cycles
3. Perform HR reviews and final approvals
4. Track assessment progress and statistics

### Team Leads

#### Writing Team Assessments
1. Go to **Team Assessment** page
2. View team overview and statistics
3. Click **"Write Assessment"** for team members
4. Complete skill evaluations with scores and comments
5. Submit for employee review

#### Monitoring Team Progress
1. Use **All Assessments** tab for complete history
2. Filter by status, employee, or date range
3. View detailed assessment history and cycles
4. Track team skill development over time

### Employees

#### Reviewing Assessments
1. Access **My Assessments** page
2. View pending assessments requiring review
3. Read team lead evaluations and scores
4. Approve with agreement or reject with feedback
5. Track personal assessment history

#### Skill Development
1. Use **Skill Upgrade Guide** for learning recommendations
2. View personal skill matrix and progress
3. Access upgrade resources and learning paths
4. Set skill development goals

## API Endpoints

### Assessment Management
- `POST /api/assessments/initiate` - HR initiates assessment
- `POST /api/assessments/bulk-initiate` - Bulk assessment creation
- `POST /api/assessments/write` - Team lead writes assessment
- `POST /api/assessments/review` - Employee reviews assessment
- `POST /api/assessments/hr-review` - HR final review
- `GET /api/assessments/history` - Assessment history with audit trails
- `GET /api/assessments/user/{userId}` - User-specific assessments
- `GET /api/assessments/team/{teamId}` - Team assessments
- `GET /api/assessments/statistics` - Assessment statistics

### User Management
- `GET /api/users/profile` - User profile information
- `GET /api/users/team` - Team member listing
- `PUT /api/users/profile` - Update profile

### Skill Management
- `GET /api/skills` - Available skills
- `GET /api/skills/upgrade-guide` - Skill upgrade recommendations
- `GET /api/skills/matrix` - Skill matrix data

## Security & Authentication

### OAuth2 Integration
- Microsoft Azure AD integration
- Automatic user provisioning
- Role-based access control
- Secure token management

### Legacy Authentication
- Username/password fallback
- Session management
- Password security policies

### Authorization
- Role-based route protection
- API endpoint security
- Data access controls
- Audit logging for all actions

## Development Guidelines

### Code Standards
- TypeScript strict mode enabled
- ESLint and Prettier configuration
- Comprehensive error handling
- Detailed logging and monitoring

### Testing
- Component testing with React Testing Library
- API endpoint testing
- Type safety validation
- Error boundary testing

### Deployment
- Production build optimization
- Environment-specific configuration
- Database migration scripts
- Health check endpoints

## Contributing

1. **Fork the repository**
2. **Create feature branch:** `git checkout -b feature/your-feature`
3. **Commit changes:** `git commit -am 'Add your feature'`
4. **Push to branch:** `git push origin feature/your-feature`
5. **Submit pull request**

## Support & Documentation

### Troubleshooting
- Check browser console for frontend errors
- Review backend logs for API issues
- Verify database connectivity
- Confirm OAuth2 configuration

### Performance Optimization
- Enable database query optimization
- Use React lazy loading for large components
- Implement API response caching
- Optimize bundle size with code splitting

### Monitoring
- Application performance monitoring
- Error tracking and reporting
- User activity analytics
- System health monitoring

## License

This project is proprietary software developed for internal organizational use.

## Changelog

### Version 2.0.0 (Current)
- ✅ **Complete assessment workflow implementation**
- ✅ **Role-based navigation and access control**
- ✅ **Automated assessment scheduling with cron jobs**
- ✅ **Comprehensive audit trails and history tracking**
- ✅ **Team Lead assessment writing capabilities**
- ✅ **Employee assessment review and approval workflow**
- ✅ **HR assessment management and final approval**
- ✅ **Skill upgrade guide integration with proper error handling**
- ✅ **TypeScript type safety and build optimization**
- ✅ **Responsive UI with modern component design**
- ✅ **Assessment statistics and progress tracking**
- ✅ **Bulk assessment creation for teams**
- ✅ **Assessment cycle management**
- ✅ **Complete frontend-backend integration**

### Previous Features
- Basic skill matrix functionality
- User authentication and authorization
- Profile management
- Team overview capabilities
- Skill criteria management

---

**Built with ❤️ for modern skill assessment and team development**
