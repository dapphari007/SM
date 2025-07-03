export enum AssessmentStatus{
    Pending = "Pending",
    Approved = "Approved", 
    Cancelled = "Cancelled",
    Forwarded = "Forwarded",
    
    // New workflow statuses
    INITIATED = 'INITIATED',
    LEAD_WRITING = 'LEAD_WRITING',
    EMPLOYEE_REVIEW = 'EMPLOYEE_REVIEW',
    EMPLOYEE_APPROVED = 'EMPLOYEE_APPROVED',
    EMPLOYEE_REJECTED = 'EMPLOYEE_REJECTED',
    HR_FINAL_REVIEW = 'HR_FINAL_REVIEW',
    COMPLETED = 'COMPLETED'
}

export enum position {
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  TESTING = 'testing',
  HR = 'hr'
};

export enum role{
  EMPLOYEE = "employee",
  LEAD = "lead",
  HR = "hr",
}

export enum teamName{
  INFORIVER = "inforiver",
  INFOBRIDGE = "infobridge",
  VALQ = "valq",
}