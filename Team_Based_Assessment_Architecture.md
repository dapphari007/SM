# Team-Based Assessment System Architecture

## Overview
The updated assessment system now supports:
- **HR creates assessments for all users** (bulk creation)
- **Team leads manage assessments only for their team members**
- **Team-based grouping and filtering**

## New Workflow Architecture

### 1. **Assessment Cycles**
- HR initiates assessment cycles (not individual assessments)
- Each cycle can include all teams or specific teams
- Cycles have titles, scheduled dates, and skill sets

### 2. **Team-Based Access Control**
- Team leads can only see their team members' assessments
- Team leads cannot access other teams' data
- HR has access to all teams and assessments

### 3. **Bulk Assessment Creation**
- HR creates assessments for multiple users at once
- Assessments are automatically assigned to appropriate team leads
- System prevents duplicate assessments for active cycles

## New API Endpoints Needed

### HR Endpoints
```typescript
// Create assessment cycle for all/specific teams
POST /assessment/initiate-bulk
{
  "skillIds": [1, 2, 3],
  "scheduledDate": "2025-07-15T10:00:00Z",
  "comments": "Q3 Performance Review",
  "assessmentTitle": "Q3 Performance Review",
  "includeTeams": ["all"] | [1, 2, 3], // "all" or specific team IDs
  "excludeUsers": ["user456"] // Optional: exclude specific users
}

// Get all assessment cycles
GET /assessment/cycles

// Get specific assessment cycle details
GET /assessment/cycles/{cycleId}

// Get team summary for specific team
GET /assessment/team-summary/{teamId}

// Cancel entire assessment cycle
DELETE /assessment/cycles/{cycleId}/cancel
```

### Team Lead Endpoints
```typescript
// Get assessments for team lead's team only
GET /assessment/my-team

// Get team members under this lead
GET /assessment/team-members

// Get team assessment statistics
GET /assessment/team-statistics

// Get assessments for specific team member (if in same team)
GET /assessment/team-member/{userId}

// Get pending assessments for team
GET /assessment/team-pending
```

## Required Backend Changes

### 1. **New Controller Methods**

```typescript
// In AssessmentController.new.ts

// HR Bulk Assessment Creation
initiateBulkAssessment: async (req: AuthRequest, h: ResponseToolkit) => {
  try {
    const { skillIds, scheduledDate, comments, assessmentTitle, includeTeams, excludeUsers } = req.payload;
    const hrId = req.auth.credentials.user.id;
    
    const assessmentCycle = await AssessmentService.initiateBulkAssessment(
      hrId,
      skillIds,
      scheduledDate,
      comments,
      assessmentTitle,
      includeTeams,
      excludeUsers
    );
    
    return h.response({
      success: true,
      message: "Bulk assessment initiated successfully",
      data: assessmentCycle,
    }).code(201);
  } catch (error) {
    // Error handling
  }
},

// Team Lead - Get My Team Assessments
getMyTeamAssessments: async (req: AuthRequest, h: ResponseToolkit) => {
  try {
    const leadId = req.auth.credentials.user.id;
    const assessments = await AssessmentService.getTeamAssessments(leadId);
    
    return h.response({
      success: true,
      data: assessments,
    }).code(200);
  } catch (error) {
    // Error handling
  }
},

// Team Lead - Get Team Members
getTeamMembers: async (req: AuthRequest, h: ResponseToolkit) => {
  try {
    const leadId = req.auth.credentials.user.id;
    const teamMembers = await AssessmentService.getTeamMembers(leadId);
    
    return h.response({
      success: true,
      data: teamMembers,
    }).code(200);
  } catch (error) {
    // Error handling
  }
},
```

### 2. **New Service Methods**

```typescript
// In AssessmentServices.new.ts

initiateBulkAssessment: async (
  hrId: string,
  skillIds: number[],
  scheduledDate: Date,
  comments: string,
  assessmentTitle: string,
  includeTeams: string[] | number[],
  excludeUsers: string[] = []
): Promise<AssessmentCycle> => {
  // 1. Validate HR user
  // 2. Get target users based on team selection
  // 3. Create assessment cycle
  // 4. Create individual assessments for each user
  // 5. Assign to appropriate team leads
  // 6. Return assessment cycle details
},

getTeamAssessments: async (leadId: string): Promise<Assessment[]> => {
  // 1. Get team members under this lead
  // 2. Get assessments for those team members only
  // 3. Return filtered assessments
},

getTeamMembers: async (leadId: string): Promise<User[]> => {
  // 1. Find users where leadId matches
  // 2. Return team members list
},
```

### 3. **New Database Schema**

```sql
-- Assessment Cycles Table
CREATE TABLE assessment_cycles (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  scheduled_date TIMESTAMP,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessment Cycle Skills (Many-to-Many)
CREATE TABLE assessment_cycle_skills (
  cycle_id INTEGER REFERENCES assessment_cycles(id),
  skill_id INTEGER REFERENCES skills(id),
  PRIMARY KEY (cycle_id, skill_id)
);

-- Update Assessment Requests to include cycle reference
ALTER TABLE assessment_requests 
ADD COLUMN cycle_id INTEGER REFERENCES assessment_cycles(id);
```

### 4. **Updated Route Configuration**

```typescript
// In AssessmentRoute.new.ts

// HR bulk operations
{
  method: "POST",
  path: "/initiate-bulk",
  handler: AssessmentController.initiateBulkAssessment,
  options: {
    auth: 'jwt',
    description: 'HR initiates bulk assessment for teams',
    tags: ['api', 'assessment', 'hr'],
  }
},

{
  method: "GET",
  path: "/cycles",
  handler: AssessmentController.getAssessmentCycles,
  options: {
    auth: 'jwt',
    description: 'Get all assessment cycles',
    tags: ['api', 'assessment', 'hr'],
  }
},

// Team lead operations
{
  method: "GET",
  path: "/my-team",
  handler: AssessmentController.getMyTeamAssessments,
  options: {
    auth: 'jwt',
    description: 'Get assessments for team lead\'s team',
    tags: ['api', 'assessment', 'lead'],
  }
},

{
  method: "GET",
  path: "/team-members",
  handler: AssessmentController.getTeamMembers,
  options: {
    auth: 'jwt',
    description: 'Get team members under this lead',
    tags: ['api', 'assessment', 'lead'],
  }
},
```

## New Assessment Workflow

### 1. **HR Initiates Bulk Assessment**
```
HR creates assessment cycle →
System identifies target users →
Creates individual assessments →
Assigns to respective team leads →
Notifications sent to team leads
```

### 2. **Team Lead Manages Team Assessments**
```
Team lead logs in →
Views only their team's assessments →
Writes assessments for team members →
Cannot access other teams' data
```

### 3. **Employee and HR Review (Unchanged)**
```
Employee reviews assessment →
HR performs final review →
Assessment completed
```

## Security Considerations

### **Team Lead Access Control**
- Verify team lead can only access their team members
- Prevent cross-team data access
- Validate team membership before allowing operations

### **HR Access Control**
- Only HR can create bulk assessments
- HR can view all teams and assessments
- HR can manage assessment cycles

### **Data Filtering**
- All team lead queries filtered by team membership
- Assessment visibility based on team hierarchy
- Audit logging for cross-team access attempts

## Testing Strategy

### **Unit Tests**
- Test bulk assessment creation
- Test team-based filtering
- Test access control validation

### **Integration Tests**
- Test complete workflow from HR to team lead
- Test team member assignment
- Test data isolation between teams

### **Security Tests**
- Test unauthorized cross-team access
- Test role-based permissions
- Test data leak prevention

This new architecture provides better scalability, proper team-based access control, and efficient bulk assessment management while maintaining the existing workflow integrity.
