import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFirstMessageAndGalleryToUsers1714000000019 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add first_message_send and first_gallery_open columns
    await queryRunner.query(`
      ALTER TABLE public.users
      ADD COLUMN first_message_send BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN first_gallery_open BOOLEAN NOT NULL DEFAULT false;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns
    await queryRunner.query(`
      ALTER TABLE public.users
      DROP COLUMN IF EXISTS first_message_send,
      DROP COLUMN IF EXISTS first_gallery_open;
    `);
  }
}
