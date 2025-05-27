import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFilesTable1710936000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.files (
        id bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        key text COLLATE pg_catalog."default" NOT NULL,
        url text COLLATE pg_catalog."default" NOT NULL,
        original_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
        mime_type character varying(100) COLLATE pg_catalog."default" NOT NULL,
        size bigint NOT NULL,
        version_id character varying(100) COLLATE pg_catalog."default",
        version integer DEFAULT 1,
        parent_version_id character varying(100) COLLATE pg_catalog."default",
        user_id bigint,
        folder character varying(255) COLLATE pg_catalog."default",
        is_deleted boolean DEFAULT false,
        created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT files_pkey PRIMARY KEY (id),
        CONSTRAINT fk_files_user_id FOREIGN KEY (user_id)
          REFERENCES public.users (id) MATCH SIMPLE
          ON UPDATE NO ACTION
          ON DELETE SET NULL
      );

      -- Add indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_files_user_id 
        ON public.files(user_id);

      CREATE INDEX IF NOT EXISTS idx_files_version_id 
        ON public.files(version_id);

      CREATE INDEX IF NOT EXISTS idx_files_parent_version_id 
        ON public.files(parent_version_id);

      CREATE INDEX IF NOT EXISTS idx_files_key 
        ON public.files(key);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS public.files CASCADE;
    `);
  }
}
