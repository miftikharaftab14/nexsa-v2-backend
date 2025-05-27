import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOtpVerificationTable1710000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.otp_verification (
        id bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        user_id bigint,
        phone_number character varying(20) COLLATE pg_catalog."default" NOT NULL,
        otp_code character varying(10) COLLATE pg_catalog."default" NOT NULL,
        purpose character varying(20) COLLATE pg_catalog."default" NOT NULL,
        status character varying(20) COLLATE pg_catalog."default" NOT NULL DEFAULT 'PENDING',
        expires_at timestamp without time zone NOT NULL,
        failed_attempts integer DEFAULT 0,
        resend_count integer DEFAULT 0,
        locked boolean DEFAULT false,
        lock_time timestamp without time zone,
        verified boolean DEFAULT false,
        verified_at timestamp without time zone,
        last_sent_at timestamp without time zone,
        created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT otp_verification_pkey PRIMARY KEY (id),
        CONSTRAINT check_otp_purpose CHECK (purpose IN ('LOGIN', 'SIGNUP', 'PASSWORD_RESET', 'PHONE_VERIFICATION')),
        CONSTRAINT check_otp_status CHECK (status IN ('PENDING', 'VERIFIED', 'EXPIRED', 'BLOCKED')),
        CONSTRAINT fk_user FOREIGN KEY (user_id)
          REFERENCES public.users (id) MATCH SIMPLE
          ON UPDATE NO ACTION
          ON DELETE NO ACTION
      );

      -- Add indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_otp_phone 
        ON public.otp_verification(phone_number);

      CREATE INDEX IF NOT EXISTS idx_otp_user 
        ON public.otp_verification(user_id);

      CREATE INDEX IF NOT EXISTS idx_otp_status 
        ON public.otp_verification(status) 
        WHERE status = 'PENDING';

      CREATE INDEX IF NOT EXISTS idx_otp_phone_purpose 
        ON public.otp_verification(phone_number, purpose) 
        WHERE status = 'PENDING';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS public.otp_verification CASCADE;
    `);
  }
}
