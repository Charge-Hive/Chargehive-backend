import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  /**
   * Get wallet details (balance and account info)
   * GET /api/wallet
   */
  @Get()
  async getWalletDetails(@Req() req: any) {
    const walletAddress = await this.getWalletAddressFromUser(req.user);
    const walletDetails = await this.walletService.getWalletDetails(walletAddress);

    return {
      success: true,
      data: walletDetails,
    };
  }

  /**
   * Get wallet transactions
   * GET /api/wallet/transactions?limit=10
   */
  @Get('transactions')
  async getTransactions(
    @Req() req: any,
    @Query('limit') limit?: string,
  ) {
    const walletAddress = await this.getWalletAddressFromUser(req.user);
    const txLimit = limit ? parseInt(limit, 10) : 10;
    const transactions = await this.walletService.getWalletTransactions(walletAddress, txLimit);

    return {
      success: true,
      data: transactions.transactions || [],
    };
  }

  /**
   * Send Flow tokens
   * POST /api/wallet/send
   * Body: { toAddress: string, amount: string }
   */
  @Post('send')
  async sendTokens(
    @Req() req: any,
    @Body() sendDto: { toAddress: string; amount: string },
  ) {
    const walletAddress = await this.getWalletAddressFromUser(req.user);
    const result = await this.walletService.sendFlowTokens(
      walletAddress,
      sendDto.toAddress,
      sendDto.amount,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Get receive info (QR code and address)
   * GET /api/wallet/receive
   */
  @Get('receive')
  async getReceiveInfo(@Req() req: any) {
    const walletAddress = await this.getWalletAddressFromUser(req.user);
    const displayName = req.user.name || req.user.email;
    return this.walletService.getReceiveInfo(walletAddress, displayName);
  }

  /**
   * Get CHT (ChargeHive Token) balance for user's wallet
   * GET /api/wallet/cht-balance
   */
  @Get('cht-balance')
  async getCHTBalance(@Req() req: any) {
    const walletAddress = await this.getWalletAddressFromUser(req.user);
    const chtBalance = await this.walletService.getCHTBalance(walletAddress);

    return {
      success: true,
      data: {
        address: walletAddress,
        chtBalance: chtBalance,
        token: 'CHT',
      },
    };
  }

  /**
   * Helper method to get wallet address from authenticated user
   * Works for both providers and users
   */
  private async getWalletAddressFromUser(user: any): Promise<string> {
    const userId = user.id || user.sub;
    const userType = user.type; // 'provider' or 'user'

    // Determine which table to query based on user type
    const tableName = userType === 'provider' ? 'providers' : 'users';

    // Fetch wallet address from appropriate table
    const { data, error } = await this.walletService['supabaseService'].providerClient
      .from(tableName)
      .select('wallet_address')
      .eq('id', userId)
      .single();

    if (error || !data || !data.wallet_address) {
      throw new Error('Wallet address not found for user');
    }

    return data.wallet_address;
  }
}
