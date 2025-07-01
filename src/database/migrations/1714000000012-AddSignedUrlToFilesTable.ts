import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSignedUrlToFilesTable1714000000012 implements MigrationInterface {
  name = 'AddSignedUrlToFilesTable1714000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "files" ADD COLUMN "signedUrl" character varying`);
    await queryRunner.query(`ALTER TABLE "files" ADD COLUMN "thumbnailKey" character varying`);
    await queryRunner.query(`ALTER TABLE "files" ADD COLUMN "signed_url_expire_at" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "files" ADD COLUMN "thumbnailSignedUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ADD COLUMN "thumbnail_signed_url_expire_at" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "signedUrl"`);
    await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "thumbnailKey"`);
    await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "signed_url_expire_at"`);
    await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "thumbnailSignedUrl"`);
    await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "thumbnail_signed_url_expire_at"`);
  }
}
