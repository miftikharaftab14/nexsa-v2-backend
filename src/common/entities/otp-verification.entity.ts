import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { OtpPurpose, OtpStatus } from '../enums/otp.enum';

@Entity('otp_verification')
export class OtpVerification {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @Column({ nullable: true, name: 'user_id' })
  userId: number;

  @Column()
  phone_number: string;

  @Column()
  otp_code: string;

  @Column({
    type: 'enum',
    enum: OtpPurpose,
  })
  purpose: OtpPurpose;

  @Column({
    type: 'enum',
    enum: OtpStatus,
    default: OtpStatus.PENDING,
  })
  status: OtpStatus;

  @Column()
  expires_at: Date;

  @Column({ default: 0 })
  failed_attempts: number;

  @Column({ default: 0 })
  resend_count: number;

  @Column({ default: false })
  locked: boolean;

  @Column({ nullable: true })
  lock_time: Date;

  @Column({ default: false })
  verified: boolean;

  @Column({ nullable: true })
  verified_at: Date;

  @Column({ nullable: true })
  last_sent_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
