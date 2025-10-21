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
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { ProviderService } from './provider.service';
import { SignupProviderDto } from './dto/signup-provider.dto';
import { LoginProviderDto } from './dto/login-provider.dto';
import { SendTokensDto } from './dto/send-tokens.dto';
import { AddServiceDto } from './dto/add-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProviderGuard } from '../auth/guards/provider.guard';

@ApiTags('Provider')
@Controller('provider')
export class ProviderController {
  constructor(private providerService: ProviderService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new provider', description: 'Create a new provider account with wallet' })
  @ApiResponse({ status: 201, description: 'Provider registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or email already exists' })
  async signup(@Body() signupDto: SignupProviderDto) {
    const result = await this.providerService.signup(signupDto);
    return {
      success: true,
      message: 'Registration successful',
      data: result,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Provider login', description: 'Authenticate provider and receive JWT token' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginProviderDto) {
    const result = await this.providerService.login(loginDto);
    return {
      success: true,
      message: 'Login successful',
      data: result,
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard, ProviderGuard)
  async getProfile(@Request() req) {
    const profile = await this.providerService.getProfile(req.user.id);
    return {
      success: true,
      data: profile,
    };
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard, ProviderGuard)
  async updateProfile(@Request() req, @Body() updates: any) {
    const updatedProfile = await this.providerService.updateProfile(
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
  @UseGuards(JwtAuthGuard, ProviderGuard)
  async getDashboard(@Request() req) {
    const dashboardData = await this.providerService.getDashboardData(req.user.id);
    return {
      success: true,
      data: dashboardData,
    };
  }

  @Put('password')
  @HttpCode(HttpStatus.OK)
  async updatePassword(
    @Body('accessToken') accessToken: string,
    @Body('newPassword') newPassword: string,
  ) {
    const result = await this.providerService.updatePassword(
      accessToken,
      newPassword,
    );
    return {
      success: true,
      message: result.message,
      data: result.user,
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body('email') email: string) {
    const result = await this.providerService.forgotPassword(email);
    return {
      success: true,
      message: result.message,
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body('accessToken') accessToken: string,
    @Body('newPassword') newPassword: string,
  ) {
    const result = await this.providerService.resetPassword(accessToken, newPassword);
    return {
      success: true,
      message: result.message,
      data: result.user,
    };
  }

  @Get('wallet')
  @UseGuards(JwtAuthGuard, ProviderGuard)
  async getWalletDetails(@Request() req) {
    const walletDetails = await this.providerService.getWalletDetails(req.user.id);
    return {
      success: true,
      data: walletDetails,
    };
  }

  @Get('wallet/transactions')
  @UseGuards(JwtAuthGuard, ProviderGuard)
  async getWalletTransactions(
    @Request() req,
    @Query('limit') limit?: string,
  ) {
    const transactionLimit = limit ? parseInt(limit, 10) : 10;
    const transactions = await this.providerService.getWalletTransactions(
      req.user.id,
      transactionLimit,
    );
    return {
      success: true,
      data: transactions,
    };
  }

  @Post('wallet/send')
  @UseGuards(JwtAuthGuard, ProviderGuard)
  @HttpCode(HttpStatus.OK)
  async sendTokens(@Request() req, @Body() sendTokensDto: SendTokensDto) {
    const result = await this.providerService.sendFlowTokens(
      req.user.id,
      sendTokensDto.toAddress,
      sendTokensDto.amount,
    );
    return {
      success: true,
      message: 'Transaction submitted successfully',
      data: result,
    };
  }

  @Get('wallet/receive')
  @UseGuards(JwtAuthGuard, ProviderGuard)
  async getReceiveInfo(@Request() req) {
    const receiveInfo = await this.providerService.getReceiveInfo(req.user.id);
    return {
      success: true,
      data: receiveInfo,
    };
  }

  @Post('services')
  @UseGuards(JwtAuthGuard, ProviderGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add a new service', description: 'Register a new parking spot or EV charging station' })
  @ApiResponse({ status: 201, description: 'Service registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addService(@Request() req: any, @Body() addServiceDto: AddServiceDto) {
    const service = await this.providerService.addService(req.user.id, addServiceDto);
    return {
      success: true,
      message: 'Service registered successfully',
      data: service,
    };
  }
}
