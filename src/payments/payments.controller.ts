import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { InitiateFlowPaymentDto } from './dto/initiate-flow-payment.dto';
import { ExecuteFlowPaymentDto } from './dto/execute-flow-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserGuard } from '../auth/guards/user.guard';
import { ProviderGuard } from '../auth/guards/provider.guard';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('initiateFlow')
  @UseGuards(JwtAuthGuard, UserGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Initiate Flow token payment',
    description: 'Start payment process, calculate Flow amount, and create pending payment record',
  })
  @ApiResponse({ status: 200, description: 'Payment initiated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid session or payment already exists' })
  @ApiResponse({ status: 404, description: 'Session or provider not found' })
  async initiateFlowPayment(
    @Body() initiateDto: InitiateFlowPaymentDto,
    @Request() req,
  ) {
    const userId = req.user.id;
    const result = await this.paymentsService.initiateFlowPayment(
      initiateDto.sessionId,
      userId,
    );

    return {
      success: true,
      message: 'Flow payment initiated successfully',
      data: result,
    };
  }

  @Post('executeFlow')
  @UseGuards(JwtAuthGuard, UserGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Execute Flow token payment',
    description: 'Submit blockchain transaction hash to complete the payment',
  })
  @ApiResponse({ status: 200, description: 'Payment executed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment or transaction' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async executeFlowPayment(
    @Body() executeDto: ExecuteFlowPaymentDto,
    @Request() req,
  ) {
    const userId = req.user.id;
    const result = await this.paymentsService.executeFlowPayment(
      executeDto.paymentId,
      executeDto.transactionHash,
      executeDto.senderWalletAddress,
      userId,
    );

    return {
      success: true,
      message: result.message,
      data: {
        paymentId: result.paymentId,
        status: result.status,
      },
    };
  }

  @Get(':paymentId/status')
  @UseGuards(JwtAuthGuard, UserGuard)
  @ApiOperation({
    summary: 'Get payment status',
    description: 'Check the current status of a payment',
  })
  @ApiResponse({ status: 200, description: 'Payment status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPaymentStatus(
    @Param('paymentId') paymentId: string,
    @Request() req,
  ) {
    const userId = req.user.id;
    const result = await this.paymentsService.getPaymentStatus(paymentId, userId);

    return {
      success: true,
      data: result,
    };
  }

  @Get('user')
  @UseGuards(JwtAuthGuard, UserGuard)
  @ApiOperation({
    summary: 'Get user payment history',
    description: 'Retrieve all payments made by the authenticated user',
  })
  @ApiResponse({ status: 200, description: 'Payment history retrieved successfully' })
  async getUserPaymentHistory(@Request() req) {
    const userId = req.user.id;
    const payments = await this.paymentsService.getUserPaymentHistory(userId);

    return {
      success: true,
      data: {
        count: payments.length,
        payments,
      },
    };
  }

  @Get('provider')
  @UseGuards(JwtAuthGuard, ProviderGuard)
  @ApiOperation({
    summary: 'Get provider earnings',
    description: 'Retrieve all earnings and payment details for the authenticated provider',
  })
  @ApiResponse({ status: 200, description: 'Provider earnings retrieved successfully' })
  async getProviderEarnings(@Request() req) {
    const providerId = req.user.id;
    const earnings = await this.paymentsService.getProviderEarnings(providerId);

    return {
      success: true,
      data: earnings,
    };
  }
}
