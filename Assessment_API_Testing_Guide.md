# Assessment API Testing Guide

## Overview
This guide provides comprehensive testing instructions for the Assessment API using Postman.

## Files Created
1. `Assessment_API_Postman_Collection.json` - Main collection with all API endpoints
2. `Assessment_API_Environment.json` - Environment variables for testing

## Import Instructions

### 1. Import Collection
1. Open Postman
2. Click "Import" button
3. Select `Assessment_API_Postman_Collection.json`
4. Collection will be imported with all endpoints

### 2. Import Environment
1. Click the gear icon (Manage Environments)
2. Click "Import"
3. Select `Assessment_API_Environment.json`
4. Select the imported environment from the dropdown

## Testing Workflow

### Phase 1: Authentication
1. **Login as HR User**
   - Run `Authentication > Login (Get JWT Token)`
   - This will automatically save the JWT token to environment variables
   - Update the email/password in the request body if needed

### Phase 2: HR Operations
1. **Initiate Assessment**
   - Run `HR Operations > 1. HR Initiate Assessment`
   - This creates a new assessment and saves the assessment ID
   - Update `targetUserId` to match your user data

2. **Check Assessment Statistics**
   - Run `HR Operations > 5. HR Get Assessment Statistics`
   - View overall assessment statistics

### Phase 3: Team Lead Operations
1. **Login as Team Lead** (Change credentials in Auth request)
2. **Write Assessment**
   - Run `Team Lead Operations > 1. Lead Write Assessment`
   - Provide skill scores and comments

3. **Get Assigned Assessments**
   - Run `Team Lead Operations > 2. Lead Get Assigned Assessments`

### Phase 4: Employee Operations  
1. **Login as Employee** (Change credentials in Auth request)
2. **Review Assessment**
   - Run `Employee Operations > 1. Employee Review Assessment (Approve)`
   - Or run the reject version to test rejection workflow

3. **Get Pending Assessments**
   - Run `Employee Operations > 3. Employee Get Pending Assessments`

### Phase 5: HR Final Review
1. **Login as HR User**
2. **Final Review**
   - Run `HR Operations > 2. HR Final Review (Approve)`
   - Or run the reject version

## Common Operations Testing

### Retrieve Assessment Data
- `Get Assessment by ID` - Basic assessment info
- `Get Assessment with History` - Full assessment with audit trail
- `Get All Assessments for Role` - Role-specific assessments
- `Get Dashboard Data` - Dashboard summary
- `Check Assessment Accessibility` - Verify access permissions

### Error Testing
The collection includes error testing scenarios:
- Invalid Assessment ID
- NaN Assessment ID  
- Empty Assessment ID
- Unauthorized Access

## Assessment Workflow States

```
INITIATED → LEAD_WRITING → EMPLOYEE_REVIEW → 
EMPLOYEE_APPROVED → HR_FINAL_REVIEW → COMPLETED
         ↓
EMPLOYEE_REJECTED (back to lead)
```

## Environment Variables

| Variable | Description | Auto-Set |
|----------|-------------|----------|
| `baseUrl` | API base URL | No |
| `jwt_token` | Authentication token | Yes (on login) |
| `assessment_id` | Current assessment ID | Yes (on create) |
| `target_user_id` | User being assessed | No |
| `hr_email` | HR user email | No |
| `hr_password` | HR user password | No |
| `lead_email` | Team lead email | No |
| `lead_password` | Team lead password | No |
| `employee_email` | Employee email | No |
| `employee_password` | Employee password | No |

## Request Body Examples

### HR Initiate Assessment
```json
{
  "targetUserId": "user123",
  "skillIds": [1, 2, 3],
  "scheduledDate": "2025-07-15T10:00:00Z",
  "comments": "Quarterly assessment for performance review"
}
```

### Lead Write Assessment
```json
{
  "skillScores": [
    {
      "skillId": 1,
      "leadScore": 4,
      "comments": "Excellent JavaScript skills"
    },
    {
      "skillId": 2,
      "leadScore": 3,
      "comments": "Good React knowledge"
    }
  ],
  "comments": "Overall good performance"
}
```

### Employee Review
```json
{
  "approved": true,
  "comments": "I agree with the assessment"
}
```

### HR Final Review
```json
{
  "approved": true,
  "comments": "Assessment approved by HR"
}
```

## Expected Response Codes

- **200** - Success (GET, PUT operations)
- **201** - Created (POST operations)
- **400** - Bad Request (Invalid data, validation errors)
- **401** - Unauthorized (Missing/invalid JWT token)
- **403** - Forbidden (Insufficient permissions)
- **404** - Not Found (Assessment not found)
- **409** - Conflict (Assessment already exists)
- **500** - Internal Server Error

## Testing Tips

1. **Sequential Testing**: Follow the workflow order for best results
2. **Role Switching**: Change login credentials to test different user roles
3. **Data Validation**: Check response data matches expected format
4. **Error Scenarios**: Test invalid inputs and unauthorized access
5. **State Transitions**: Verify assessment status changes correctly

## Troubleshooting

### Common Issues:
1. **401 Unauthorized**: Re-run login to refresh JWT token
2. **404 Assessment Not Found**: Check assessment_id variable
3. **403 Forbidden**: Verify user role permissions
4. **400 Invalid ID**: Ensure assessment_id is numeric

### Debug Steps:
1. Check environment variables are set correctly
2. Verify JWT token is not expired
3. Confirm user has appropriate role permissions
4. Check request body format matches expected schema

## Legacy API Support

The collection includes legacy endpoint tests for backward compatibility:
- Legacy Create Assessment
- Legacy Get Assessment  
- Legacy Review Assessment
- Legacy Get Assigned Assessments

These endpoints redirect to new workflow methods or return appropriate error messages.
