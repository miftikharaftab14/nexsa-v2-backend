import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1710000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // First create the enum type
    await queryRunner.query(`
      CREATE TYPE user_role AS ENUM ('CUSTOMER', 'ADMIN', 'SELLER');
    `);

    await queryRunner.query(`
      CREATE TABLE users (
        id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
        username character varying(50) COLLATE pg_catalog."default",
        email character varying(255) COLLATE pg_catalog."default",
        phone_number character varying(20) COLLATE pg_catalog."default" NOT NULL,
        role user_role NOT NULL DEFAULT 'CUSTOMER',
        profile_picture text COLLATE pg_catalog."default",
        about_me text COLLATE pg_catalog."default",
        is_deleted boolean DEFAULT false,
        created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT users_pkey PRIMARY KEY (id),
        CONSTRAINT users_email_key UNIQUE (email),
        CONSTRAINT users_phone_number_key UNIQUE (phone_number)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE users;`);
    await queryRunner.query(`DROP TYPE user_role;`);
  }
}
