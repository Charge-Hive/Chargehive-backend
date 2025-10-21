import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserGuard } from '../auth/guards/user.guard';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user', description: 'Create a new user account with wallet' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or email already exists' })
  async register(@Body() registerDto: RegisterUserDto) {
    const result = await this.userService.register(registerDto);
    return {
      success: true,
      message: 'Registration successful',
      data: result,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login', description: 'Authenticate user and receive JWT token' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginUserDto) {
    const result = await this.userService.login(loginDto);
    return {
      success: true,
      message: 'Login successful',
      data: result,
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard, UserGuard)
  async getProfile(@Request() req) {
    const profile = await this.userService.getProfile(req.user.id);
    return {
      success: true,
      data: profile,
    };
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard, UserGuard)
  async updateProfile(@Request() req, @Body() updates: any) {
    const updatedProfile = await this.userService.updateProfile(
      req.user.id,
      updates,
    );
    return {
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile,
    };
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, UserGuard)
  async getDashboard(@Request() req) {
    const dashboardData = await this.userService.getDashboardData(req.user.id);
    return {
      success: true,
      data: dashboardData,
    };
  }
}
