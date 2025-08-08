import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { SignupDto } from '../dto/signup.dto';
import { LoginDto } from '../dto/login.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { ResendOtpDto } from '../dto/resend-otp.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiResponse as ApiResponseInterface } from 'src/common/interfaces/api-response.interface';
import { CustomValidationPipe } from 'src/common/pipes/validation.pipe';
import { Descriptions } from 'src/common/enums/descriptions.enum';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  _200_login,
  _200_resendOtp,
  _200_verifyOtp,
  _201_signup,
  _400_login,
  _400_signnup,
  _400_verifyOtp,
} from '../documentaion/api.response';
import { Messages } from 'src/common/enums/messages.enum';
import { User } from '../../users/entities/user.entity';
import { AcceptInviteDto } from '../dto/accept-invite.dto';

@Controller('auth')
@ApiTags('auth')
@ApiBearerAuth('JWT-auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: Descriptions.SIGNUP_SUMMARY })
  @ApiResponse(_201_signup)
  @ApiResponse(_400_signnup)
  async signup(
    @Body(new CustomValidationPipe()) signupDto: SignupDto,
  ): Promise<ApiResponseInterface<User>> {
    const user = await this.authService.signup(signupDto);
    return {
      success: true,
      message: Messages.USER_REGISTERED,
      status: HttpStatus.CREATED,
      data: user,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: Descriptions.LOGIN_SUMMARY })
  @ApiResponse(_200_login)
  @ApiResponse(_400_login)
  async login(
    @Body(new CustomValidationPipe()) loginDto: LoginDto,
  ): Promise<ApiResponseInterface<{ message: string }>> {
    const result = await this.authService.login(loginDto);
    return {
      success: true,
      message: Messages.USER_FETCHED,
      status: HttpStatus.OK,
      data: result,
    };
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: Descriptions.VERIFY_OTP_SUMMARY })
  @ApiResponse(_200_verifyOtp)
  @ApiResponse(_400_verifyOtp)
  async verifyOtp(
    @Body(new CustomValidationPipe()) verifyOtpDto: VerifyOtpDto,
  ): Promise<ApiResponseInterface<{ user: User | null }>> {
    const result = await this.authService.verifyOtp(verifyOtpDto);
    return {
      success: true,
      message: Messages.OTP_VERIFIED,
      status: HttpStatus.OK,
      data: result,
    };
  }

  @Post('send-otp')
  @ApiResponse(_200_resendOtp)
  @HttpCode(HttpStatus.OK)
  async resendOtp(
    @Body() resendOtpDto: ResendOtpDto,
  ): Promise<ApiResponseInterface<{ message: string }>> {
    const result = await this.authService.sendOtp(resendOtpDto.phone_number);
    return {
      success: true,
      message: Messages.OTP_SENT,
      status: HttpStatus.OK,
      data: result,
    };
  }

  @Post('accept-invite')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Accept an invitation' })
  @ApiResponse(_200_resendOtp)
  @HttpCode(HttpStatus.OK)
  async acceptInvite(
    @Body() acceptInviteDto: AcceptInviteDto,
  ): Promise<ApiResponseInterface<{ message: string }>> {
    const result = await this.authService.acceptInvite(acceptInviteDto);
    return {
      success: true,
      message: Messages.INVITATION_ACCEPTED,
      status: HttpStatus.OK,
      data: result,
    };
  }
}
