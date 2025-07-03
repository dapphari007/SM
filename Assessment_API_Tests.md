# Assessment API Test Collection

This document contains comprehensive test cases for the new Assessment API workflow. Use these with Thunderclient (VS Code) or Postman.

## Prerequisites

- Base URL: `http://localhost:3000/api/assessment` (adjust port as needed)
- Authentication: JWT token required in Authorization header
- Content-Type: `application/json`

## Test Flow Overview

1. **HR User**: Initiates assessment
2. **Team Lead**: Writes assessment scores
3. **Employee**: Reviews and approves/rejects
4. **HR User**: Final review and approval
5. **Various Users**: Query assessments based on role

---

## 1. HR Initiates Assessment

**Endpoint**: `POST /initiate`
**Auth**: HR User JWT Token
**Description**: HR initiates assessment for an employee or team lead

### Request
```json
{
  "method": "POST",
  "url": "{{baseUrl}}/initiate",
  "headers": {
    "Authorization": "Bearer {{hrToken}}",
    "Content-Type": "application/json"
  },
  "body": {
    "targetUserId": "employee-uuid-here",
    "skillIds": [1, 2, 3, 4, 5],
    "scheduledDate": "2024-02-01T10:00:00Z",
    "comments": "Annual performance assessment"
  }
}
```

### Expected Response (201)
```json
{
  "success": true,
  "message": "Assessment initiated successfully",
  "data": {
    "id": 1,
    "userId": "employee-uuid-here",
    "status": "LEAD_WRITING",
    "initiatedBy": "hr-uuid-here",
    "scheduledDate": "2024-02-01T10:00:00.000Z",
    "currentCycle": 1,
    "nextApprover": 123,
    "detailedScores": [...],
    "history": [...]
  }
}
```

### Error Cases
```json
// 403 - Non-HR user
{
  "success": false,
  "error": "Only HR can initiate assessments"
}

// 404 - Target user not found
{
  "success": false,
  "error": "Target user not found"
}

// 409 - Active assessment exists
{
  "success": false,
  "error": "User already has an active assessment"
}
```

---

## 2. Team Lead Writes Assessment

**Endpoint**: `POST /lead-assessment/{assessmentId}`
**Auth**: Team Lead JWT Token
**Description**: Team lead writes assessment scores for their team member

### Request
```json
{
  "method": "POST",
  "url": "{{baseUrl}}/lead-assessment/1",
  "headers": {
    "Authorization": "Bearer {{leadToken}}",
    "Content-Type": "application/json"
  },
  "body": {
    "skillScores": [
      {
        "skillId": 1,
        "leadScore": 3
      },
      {
        "skillId": 2,
        "leadScore": 4
      },
      {
        "skillId": 3,
        "leadScore": 2
      },
      {
        "skillId": 4,
        "leadScore": 3
      },
      {
        "skillId": 5,
        "leadScore": 4
      }
    ],
    "comments": "Good performance overall. Areas for improvement in skill 3."
  }
}
```

### Expected Response (200)
```json
{
  "success": true,
  "message": "Lead assessment written successfully",
  "data": {
    "id": 1,
    "status": "EMPLOYEE_REVIEW",
    "nextApprover": 456,
    "detailedScores": [...],
    "history": [...]
  }
}
```

### Error Cases
```json
// 403 - Unauthorized lead
{
  "success": false,
  "error": "You are not authorized to write this assessment"
}

// 400 - Invalid score
{
  "success": false,
  "error": "Invalid lead score for skill 1. Must be between 1 and 4"
}

// 400 - Wrong status
{
  "success": false,
  "error": "Assessment is not in a writable state"
}
```

---

## 3. Employee Reviews Assessment

**Endpoint**: `POST /employee-review/{assessmentId}`
**Auth**: Employee JWT Token
**Description**: Employee reviews and approves/rejects their assessment

### Request (Approve)
```json
{
  "method": "POST",
  "url": "{{baseUrl}}/employee-review/1",
  "headers": {
    "Authorization": "Bearer {{employeeToken}}",
    "Content-Type": "application/json"
  },
  "body": {
    "approved": true,
    "comments": "I agree with the assessment scores."
  }
}
```

### Request (Reject)
```json
{
  "method": "POST",
  "url": "{{baseUrl}}/employee-review/1",
  "headers": {
    "Authorization": "Bearer {{employeeToken}}",
    "Content-Type": "application/json"
  },
  "body": {
    "approved": false,
    "comments": "I disagree with the score for skill 3. I believe it should be higher."
  }
}
```

### Expected Response (200)
```json
{
  "success": true,
  "message": "Assessment approved successfully",
  "data": {
    "id": 1,
    "status": "EMPLOYEE_APPROVED",
    "nextApprover": 789,
    "history": [...]
  }
}
```

### Error Cases
```json
// 403 - Unauthorized employee
{
  "success": false,
  "error": "You are not authorized to review this assessment"
}

// 400 - Wrong status
{
  "success": false,
  "error": "Assessment is not in a reviewable state"
}
```

---

## 4. HR Final Review

**Endpoint**: `POST /hr-final-review/{assessmentId}`
**Auth**: HR User JWT Token
**Description**: HR performs final review of employee-approved assessment

### Request (Approve)
```json
{
  "method": "POST",
  "url": "{{baseUrl}}/hr-final-review/1",
  "headers": {
    "Authorization": "Bearer {{hrToken}}",
    "Content-Type": "application/json"
  },
  "body": {
    "approved": true,
    "comments": "Assessment completed successfully. Next review scheduled in 3 months."
  }
}
```

### Request (Reject)
```json
{
  "method": "POST",
  "url": "{{baseUrl}}/hr-final-review/1",
  "headers": {
    "Authorization": "Bearer {{hrToken}}",
    "Content-Type": "application/json"
  },
  "body": {
    "approved": false,
    "comments": "Assessment needs revision. Lead should reconsider scores."
  }
}
```

### Expected Response (200)
```json
{
  "success": true,
  "message": "HR final review completed: approved",
  "data": {
    "id": 1,
    "status": "COMPLETED",
    "completedAt": "2024-02-01T15:30:00.000Z",
    "nextApprover": null,
    "history": [...]
  }
}
```

---

## 5. Get Assessment with History

**Endpoint**: `GET /history/{assessmentId}`
**Auth**: Any authenticated user
**Description**: Get complete assessment history and audit trail

### Request
```json
{
  "method": "GET",
  "url": "{{baseUrl}}/history/1",
  "headers": {
    "Authorization": "Bearer {{token}}"
  }
}
```

### Expected Response (200)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": "employee-uuid",
    "status": "COMPLETED",
    "currentCycle": 1,
    "detailedScores": [
      {
        "skillId": 1,
        "leadScore": 3,
        "Skill": {
          "name": "JavaScript",
          "category": "Technical"
        }
      }
    ],
    "history": [
      {
        "auditType": "INITIATED",
        "editorId": 789,
        "comments": "Annual performance assessment",
        "auditedAt": "2024-01-15T10:00:00.000Z",
        "cycleNumber": 1
      },
      {
        "auditType": "LEAD_ASSESSMENT_WRITTEN",
        "editorId": 123,
        "comments": "Good performance overall",
        "auditedAt": "2024-01-18T14:30:00.000Z",
        "cycleNumber": 1
      }
    ],
    "isAccessible": true
  }
}
```

---

## 6. Get Assessments for User Role

**Endpoint**: `GET /role-assessments`
**Auth**: Any authenticated user
**Description**: Get assessments visible to current user based on their role

### Request
```json
{
  "method": "GET",
  "url": "{{baseUrl}}/role-assessments",
  "headers": {
    "Authorization": "Bearer {{token}}"
  }
}
```

### Expected Response (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": "employee-uuid",
      "status": "EMPLOYEE_REVIEW",
      "scheduledDate": "2024-02-01T10:00:00.000Z",
      "user": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@company.com"
      }
    }
  ]
}
```

---

## 7. Get Assessments Requiring Action

**Endpoint**: `GET /pending-actions`
**Auth**: Any authenticated user
**Description**: Get assessments that require action from current user

### Request
```json
{
  "method": "GET",
  "url": "{{baseUrl}}/pending-actions",
  "headers": {
    "Authorization": "Bearer {{token}}"
  }
}
```

### Expected Response (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": "employee-uuid",
      "status": "LEAD_WRITING",
      "nextApprover": 123,
      "scheduledDate": "2024-02-01T10:00:00.000Z",
      "user": {
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ]
}
```

---

## 8. Check Assessment Accessibility

**Endpoint**: `GET /accessibility/{assessmentId}`
**Auth**: Any authenticated user
**Description**: Check if assessment is accessible based on schedule

### Request
```json
{
  "method": "GET",
  "url": "{{baseUrl}}/accessibility/1",
  "headers": {
    "Authorization": "Bearer {{token}}"
  }
}
```

### Expected Response (200)
```json
{
  "success": true,
  "data": {
    "isAccessible": true
  }
}
```

---

## 9. Get Dashboard Data

**Endpoint**: `GET /dashboard`
**Auth**: Any authenticated user
**Description**: Get dashboard data for current user

### Request
```json
{
  "method": "GET",
  "url": "{{baseUrl}}/dashboard",
  "headers": {
    "Authorization": "Bearer {{token}}"
  }
}
```

### Expected Response (200)
```json
{
  "success": true,
  "data": {
    "pendingActions": [
      {
        "id": 1,
        "status": "LEAD_WRITING",
        "nextApprover": 123
      }
    ],
    "recentAssessments": [
      {
        "id": 2,
        "status": "COMPLETED",
        "completedAt": "2024-01-20T10:00:00.000Z"
      }
    ],
    "totalAssessments": 5,
    "pendingCount": 1
  }
}
```

---

## 10. Get Assessment Statistics (HR Only)

**Endpoint**: `GET /statistics`
**Auth**: HR User JWT Token
**Description**: Get comprehensive assessment statistics for HR dashboard

### Request
```json
{
  "method": "GET",
  "url": "{{baseUrl}}/statistics",
  "headers": {
    "Authorization": "Bearer {{hrToken}}"
  }
}
```

### Expected Response (200)
```json
{
  "success": true,
  "data": {
    "total": 25,
    "byStatus": {
      "initiated": 2,
      "leadWriting": 3,
      "employeeReview": 1,
      "employeeApproved": 2,
      "employeeRejected": 1,
      "hrFinalReview": 1,
      "completed": 15
    },
    "averageCompletionTime": 5.2,
    "averageScore": 3.1,
    "topSkills": [
      {
        "skillName": "JavaScript",
        "averageScore": 3.5,
        "assessmentCount": 20
      }
    ],
    "employeeParticipation": {
      "totalEmployees": 50,
      "assessedEmployees": 25,
      "participationRate": 50
    }
  }
}
```

### Error Cases
```json
// 403 - Non-HR user
{
  "success": false,
  "error": "Only HR can access assessment statistics"
}
```

---

## 11. Get Workflow Status

**Endpoint**: `GET /workflow-status/{assessmentId}`
**Auth**: Any authenticated user
**Description**: Get current workflow status of assessment

### Request
```json
{
  "method": "GET",
  "url": "{{baseUrl}}/workflow-status/1",
  "headers": {
    "Authorization": "Bearer {{token}}"
  }
}
```

### Expected Response (200)
```json
{
  "success": true,
  "data": {
    "currentStatus": "EMPLOYEE_REVIEW",
    "currentCycle": 1,
    "nextApprover": 456,
    "isAccessible": true,
    "completedSteps": [
      "INITIATED",
      "LEAD_ASSESSMENT_WRITTEN"
    ]
  }
}
```

---

## 12. Get Assessments by Status

**Endpoint**: `GET /by-status/{status}`
**Auth**: Any authenticated user
**Description**: Get assessments filtered by status

### Request
```json
{
  "method": "GET",
  "url": "{{baseUrl}}/by-status/EMPLOYEE_REVIEW",
  "headers": {
    "Authorization": "Bearer {{token}}"
  }
}
```

### Expected Response (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": "employee-uuid",
      "status": "EMPLOYEE_REVIEW",
      "scheduledDate": "2024-02-01T10:00:00.000Z",
      "user": {
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ]
}
```

---

## 13. Get Overdue Assessments (HR Only)

**Endpoint**: `GET /overdue`
**Auth**: HR User JWT Token
**Description**: Get assessments that are past their scheduled date

### Request
```json
{
  "method": "GET",
  "url": "{{baseUrl}}/overdue",
  "headers": {
    "Authorization": "Bearer {{hrToken}}"
  }
}
```

### Expected Response (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "userId": "employee-uuid",
      "status": "LEAD_WRITING",
      "scheduledDate": "2024-01-15T10:00:00.000Z",
      "user": {
        "firstName": "Jane",
        "lastName": "Smith"
      }
    }
  ]
}
```

---

## 14. Get Upcoming Assessments

**Endpoint**: `GET /upcoming`
**Auth**: Any authenticated user
**Description**: Get assessments scheduled in the next 7 days

### Request
```json
{
  "method": "GET",
  "url": "{{baseUrl}}/upcoming",
  "headers": {
    "Authorization": "Bearer {{token}}"
  }
}
```

### Expected Response (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "userId": "employee-uuid",
      "status": "INITIATED",
      "scheduledDate": "2024-02-05T10:00:00.000Z",
      "user": {
        "firstName": "Mike",
        "lastName": "Johnson"
      }
    }
  ]
}
```

---

## 15. Cancel Assessment

**Endpoint**: `DELETE /cancel/{assessmentId}`
**Auth**: HR User JWT Token
**Description**: Cancel an assessment (HR only)

### Request
```json
{
  "method": "DELETE",
  "url": "{{baseUrl}}/cancel/1",
  "headers": {
    "Authorization": "Bearer {{hrToken}}"
  }
}
```

### Expected Response (200)
```json
{
  "success": true,
  "message": "Assessment cancelled successfully",
  "data": {
    "id": 1,
    "status": "CANCELLED",
    "cancelledAt": "2024-02-01T16:00:00.000Z"
  }
}
```

---

## Environment Variables

Create these environment variables in your testing tool:

```
baseUrl = http://localhost:3000/api/assessment
hrToken = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
leadToken = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
employeeToken = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Test Sequence

1. **Setup**: Get JWT tokens for HR, Lead, and Employee users
2. **Step 1**: HR initiates assessment (save assessmentId)
3. **Step 2**: Lead writes assessment using assessmentId
4. **Step 3**: Employee reviews assessment
5. **Step 4**: HR performs final review
6. **Step 5**: Test various query endpoints
7. **Step 6**: Test error scenarios with invalid data

## Common HTTP Status Codes

- `200` - Success
- `201` - Created (for initiate assessment)
- `400` - Bad Request (invalid data)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (resource already exists)
- `410` - Gone (deprecated endpoint)
- `500` - Internal Server Error

## Testing Tips

1. Test the complete workflow in sequence
2. Test error scenarios with invalid data
3. Test role-based access control
4. Test with different user roles
5. Verify audit trail is properly maintained
6. Test edge cases (expired tokens, non-existent IDs)
7. Test concurrent access scenarios

---

*This test collection covers all new assessment workflow endpoints. Update the base URL and tokens according to your environment.*