import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateImageReportsTable1714000000020 implements MigrationInterface {
    name = 'CreateImageReportsTable1714000000020'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS public.image_reports (
                id SERIAL PRIMARY KEY,
                gallery_image_id INTEGER NOT NULL,
                customer_id BIGINT NOT NULL,
                description TEXT,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_image_reports_gallery_image FOREIGN KEY (gallery_image_id)
                    REFERENCES public.gallery_image (id) ON DELETE CASCADE,
                CONSTRAINT fk_image_reports_customer FOREIGN KEY (customer_id)
                    REFERENCES public.users (id) ON DELETE CASCADE
            );
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_image_reports_gallery_image 
                ON public.image_reports(gallery_image_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_image_reports_customer 
                ON public.image_reports(customer_id);
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_image_reports_unique 
                ON public.image_reports(gallery_image_id, customer_id);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_image_reports_unique`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_image_reports_customer`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_image_reports_gallery_image`);
        await queryRunner.query(`DROP TABLE IF EXISTS public.image_reports`);
    }
}

