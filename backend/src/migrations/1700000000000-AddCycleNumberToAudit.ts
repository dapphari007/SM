import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddCycleNumberToAudit1700000000000 implements MigrationInterface {
    name = 'AddCycleNumberToAudit1700000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if the column already exists to avoid errors
        const table = await queryRunner.getTable("audit");
        const columnExists = table?.findColumnByName("cycle_number");

        if (!columnExists) {
            await queryRunner.addColumn("audit", new TableColumn({
                name: "cycle_number",
                type: "integer",
                isNullable: true,
                comment: "Assessment cycle number for tracking multiple assessment cycles"
            }));

            // Update existing records to have cycle_number = 1 as default
            await queryRunner.query(`
                UPDATE audit 
                SET cycle_number = 1 
                WHERE cycle_number IS NULL;
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("audit", "cycle_number");
    }
}
