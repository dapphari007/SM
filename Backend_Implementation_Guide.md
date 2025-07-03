# Backend Implementation Guide for Team-Based Assessment System

## Step 1: Update Controller Methods

Add these new methods to `AssessmentController.new.ts`:

```typescript
// HR Bulk Assessment Creation
initiateBulkAssessment: async (req: AuthRequest, h: ResponseToolkit) => {
  try {
    const { skillIds, scheduledDate, comments, assessmentTitle, includeTeams, excludeUsers } = req.payload as {
      skillIds: number[];
      scheduledDate?: string;
      comments?: string;
      assessmentTitle: string;
      includeTeams: string[] | number[];
      excludeUsers?: string[];
    };
    
    const hrId = req.auth.credentials.user.id;
    
    const assessmentCycle = await AssessmentService.initiateBulkAssessment(
      hrId,
      skillIds,
      scheduledDate ? new Date(scheduledDate) : undefined,
      comments || "",
      assessmentTitle,
      includeTeams,
      excludeUsers || []
    );

    return h.response({
      success: true,
      message: "Bulk assessment initiated successfully",
      data: assessmentCycle,
    }).code(201);
  } catch (error: any) {
    console.error("Error initiating bulk assessment:", error);
    
    if (error.message.includes("Only HR can initiate")) {
      return h.response({
        success: false,
        error: error.message,
      }).code(403);
    }
    
    return h.response({
      success: false,
      error: error.message,
    }).code(500);
  }
},

// Team Lead - Get My Team Assessments
getMyTeamAssessments: async (req: AuthRequest, h: ResponseToolkit) => {
  try {
    const leadId = req.auth.credentials.user.id;
    const userRole = req.auth.credentials.user.role;
    
    // Only team leads can access this endpoint
    if (userRole !== role.LEAD) {
      return h.response({
        success: false,
        error: "Only team leads can access team assessments",
      }).code(403);
    }
    
    const assessments = await AssessmentService.getTeamAssessments(leadId);
    
    return h.response({
      success: true,
      data: assessments,
    }).code(200);
  } catch (error: any) {
    console.error("Error getting team assessments:", error);
    
    return h.response({
      success: false,
      error: error.message,
    }).code(500);
  }
},

// Team Lead - Get Team Members
getTeamMembers: async (req: AuthRequest, h: ResponseToolkit) => {
  try {
    const leadId = req.auth.credentials.user.id;
    const userRole = req.auth.credentials.user.role;
    
    // Only team leads can access this endpoint
    if (userRole !== role.LEAD) {
      return h.response({
        success: false,
        error: "Only team leads can access team member data",
      }).code(403);
    }
    
    const teamMembers = await AssessmentService.getTeamMembers(leadId);
    
    return h.response({
      success: true,
      data: teamMembers,
    }).code(200);
  } catch (error: any) {
    console.error("Error getting team members:", error);
    
    return h.response({
      success: false,
      error: error.message,
    }).code(500);
  }
},

// Get Assessment Cycles
getAssessmentCycles: async (req: AuthRequest, h: ResponseToolkit) => {
  try {
    const userRole = req.auth.credentials.user.role;
    
    // Only HR can access all cycles
    if (userRole !== role.HR) {
      return h.response({
        success: false,
        error: "Only HR can access assessment cycles",
      }).code(403);
    }
    
    const cycles = await AssessmentService.getAssessmentCycles();
    
    return h.response({
      success: true,
      data: cycles,
    }).code(200);
  } catch (error: any) {
    console.error("Error getting assessment cycles:", error);
    
    return h.response({
      success: false,
      error: error.message,
    }).code(500);
  }
},
```

## Step 2: Update Service Methods

Add these new methods to `AssessmentServices.new.ts`:

```typescript
// Bulk Assessment Creation
initiateBulkAssessment: async (
  hrId: string,
  skillIds: number[],
  scheduledDate?: Date,
  comments: string = "",
  assessmentTitle: string,
  includeTeams: string[] | number[],
  excludeUsers: string[] = []
): Promise<AssessmentCycle> => {
  try {
    // Validate HR user
    const hrUser = await userRepo.findOne({ 
      where: { id: hrId },
      relations: ["role"]
    });
    if (!hrUser || hrUser.role?.name !== role.HR) {
      throw new Error("Only HR can initiate bulk assessments");
    }

    // Create assessment cycle
    const assessmentCycle = assessmentCycleRepo.create({
      title: assessmentTitle,
      createdBy: hrId,
      scheduledDate: scheduledDate || new Date(),
      status: 'ACTIVE',
      comments: comments
    });

    const savedCycle = await assessmentCycleRepo.save(assessmentCycle);

    // Get target users based on team selection
    let targetUsers: UserType[] = [];
    
    if (includeTeams.includes('all')) {
      // Get all employees and team leads
      targetUsers = await userRepo.find({
        where: {
          role: { name: In([role.EMPLOYEE, role.LEAD]) }
        },
        relations: ["role", "team"]
      });
    } else {
      // Get users from specific teams
      targetUsers = await userRepo.find({
        where: {
          teamId: In(includeTeams as number[]),
          role: { name: In([role.EMPLOYEE, role.LEAD]) }
        },
        relations: ["role", "team"]
      });
    }

    // Exclude specified users
    if (excludeUsers.length > 0) {
      targetUsers = targetUsers.filter(user => !excludeUsers.includes(user.id));
    }

    // Create individual assessments for each user
    const assessments = [];
    for (const user of targetUsers) {
      const assessment = assessmentRequestRepo.create({
        userId: user.id,
        cycleId: savedCycle.id,
        status: AssessmentStatus.INITIATED,
        initiatedBy: hrId,
        nextApprover: user.leadId ? parseInt(user.leadId) : null,
        scheduledDate: scheduledDate || new Date(),
        currentCycle: 1
      });

      const savedAssessment = await assessmentRequestRepo.save(assessment);
      assessments.push(savedAssessment);
    }

    // Link skills to cycle
    for (const skillId of skillIds) {
      const cycleSkill = assessmentCycleSkillRepo.create({
        cycleId: savedCycle.id,
        skillId: skillId
      });
      await assessmentCycleSkillRepo.save(cycleSkill);
    }

    return {
      ...savedCycle,
      assessmentCount: assessments.length,
      targetUsers: targetUsers.length,
      skills: skillIds
    };
  } catch (error: any) {
    throw new Error(`Failed to initiate bulk assessment: ${error.message}`);
  }
},

// Get Team Assessments (for Team Lead)
getTeamAssessments: async (leadId: string): Promise<AssessmentWithHistory[]> => {
  try {
    // Get team members under this lead
    const teamMembers = await userRepo.find({
      where: { leadId: leadId },
      relations: ["role"]
    });

    if (teamMembers.length === 0) {
      return [];
    }

    const teamMemberIds = teamMembers.map(member => member.id);

    // Get assessments for team members only
    const assessments = await assessmentRequestRepo.find({
      where: {
        userId: In(teamMemberIds)
      },
      relations: ["user", "user.role"],
      order: { requestedAt: "DESC" }
    });

    // Get detailed scores for each assessment
    const assessmentsWithHistory = [];
    for (const assessment of assessments) {
      const scores = await scoreRepo.find({
        where: { assessmentId: assessment.id },
        relations: ["Skill"]
      });

      const history = await AuditRepo.find({
        where: { assessmentId: assessment.id },
        order: { createdAt: "ASC" }
      });

      assessmentsWithHistory.push({
        ...assessment,
        detailedScores: scores,
        history: history,
        currentCycle: assessment.currentCycle,
        isAccessible: true
      });
    }

    return assessmentsWithHistory;
  } catch (error: any) {
    throw new Error(`Failed to get team assessments: ${error.message}`);
  }
},

// Get Team Members (for Team Lead)
getTeamMembers: async (leadId: string): Promise<UserType[]> => {
  try {
    const teamMembers = await userRepo.find({
      where: { leadId: leadId },
      relations: ["role", "team", "position"],
      order: { name: "ASC" }
    });

    return teamMembers;
  } catch (error: any) {
    throw new Error(`Failed to get team members: ${error.message}`);
  }
},

// Get Assessment Cycles (for HR)
getAssessmentCycles: async (): Promise<AssessmentCycle[]> => {
  try {
    const cycles = await assessmentCycleRepo.find({
      relations: ["skills", "assessments"],
      order: { createdAt: "DESC" }
    });

    return cycles;
  } catch (error: any) {
    throw new Error(`Failed to get assessment cycles: ${error.message}`);
  }
},
```

## Step 3: Update Routes

Add these routes to `AssessmentRoute.new.ts`:

```typescript
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

{
  method: "GET",
  path: "/cycles/{cycleId}",
  handler: AssessmentController.getAssessmentCycleDetails,
  options: {
    auth: 'jwt',
    description: 'Get specific assessment cycle details',
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

{
  method: "GET",
  path: "/team-pending",
  handler: AssessmentController.getTeamPendingAssessments,
  options: {
    auth: 'jwt',
    description: 'Get pending assessments for team',
    tags: ['api', 'assessment', 'lead'],
  }
},
```

## Step 4: Database Migrations

Create migration files for the new schema:

```sql
-- Create assessment_cycles table
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

-- Create assessment_cycle_skills junction table
CREATE TABLE assessment_cycle_skills (
  cycle_id INTEGER REFERENCES assessment_cycles(id) ON DELETE CASCADE,
  skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (cycle_id, skill_id)
);

-- Add cycle_id to assessment_requests
ALTER TABLE assessment_requests 
ADD COLUMN cycle_id INTEGER REFERENCES assessment_cycles(id);

-- Add index for better performance
CREATE INDEX idx_assessment_requests_cycle_id ON assessment_requests(cycle_id);
CREATE INDEX idx_assessment_requests_user_id ON assessment_requests(user_id);
CREATE INDEX idx_users_lead_id ON users(lead_id);
```

## Step 5: Update Entity Types

Add new entity types to `types/entities.ts`:

```typescript
export interface AssessmentCycleType {
  id: number;
  title: string;
  createdBy: string;
  scheduledDate: Date;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
  assessments?: AssessmentRequestType[];
  skills?: SkillType[];
}

export interface AssessmentCycleSkillType {
  cycleId: number;
  skillId: number;
  cycle: AssessmentCycleType;
  skill: SkillType;
}
```

## Step 6: Testing

1. **Import updated Postman collection**
2. **Test HR bulk assessment creation**
3. **Test team lead access to team assessments only**
4. **Test security - ensure team leads cannot access other teams**
5. **Test employee workflow remains unchanged**

This implementation provides a complete team-based assessment system with proper access controls and bulk operations capability.
