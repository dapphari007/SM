import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, JoinTable } from "typeorm";
import { AssessmentRequest } from "./AssessmentRequest.new";
import { Skill } from "./Skill";

@Entity("assessment_cycles")
export class AssessmentCycle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ name: "created_by" })
  createdBy: string;

  @Column({ name: "scheduled_date", type: "timestamp", nullable: true })
  scheduledDate?: Date;

  @Column({ 
    type: "enum", 
    enum: ["ACTIVE", "COMPLETED", "CANCELLED"], 
    default: "ACTIVE" 
  })
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";

  @Column({ type: "text", nullable: true })
  comments?: string;

  @Column({ name: "target_teams", type: "simple-array", nullable: true })
  targetTeams?: string[];

  @Column({ name: "excluded_users", type: "simple-array", nullable: true })
  excludedUsers?: string[];

  @Column({ name: "total_assessments", default: 0 })
  totalAssessments: number;

  @Column({ name: "completed_assessments", default: 0 })
  completedAssessments: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relations
  @OneToMany(() => AssessmentRequest, assessment => assessment.cycle)
  assessments: AssessmentRequest[];

  @ManyToMany(() => Skill, { eager: true })
  @JoinTable({
    name: "assessment_cycle_skills",
    joinColumn: { name: "cycle_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "skill_id", referencedColumnName: "id" }
  })
  skills: Skill[];

  // Virtual properties
  get completionRate(): number {
    return this.totalAssessments > 0 ? 
      (this.completedAssessments / this.totalAssessments) * 100 : 0;
  }

  get isActive(): boolean {
    return this.status === "ACTIVE";
  }
}
