import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { FlowService } from '../flow/flow.service';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private supabaseService: SupabaseService,
    private flowService: FlowService,
  ) {}

  /**
   * Get wallet details (balance and account info)
   * Works for both providers and users
   */
  async getWalletDetails(walletAddress: string) {
    // Get wallet from wallet_details table
    const { data: wallet, error } = await this.supabaseService.providerClient
      .from('wallet_details')
      .select('wallet_address')
      .eq('wallet_address', walletAddress)
      .single();

    if (error || !wallet) {
      throw new NotFoundException('Wallet not found');
    }

    try {
      // Get wallet balance from Flow blockchain
      const balance = await this.flowService.getAccountBalance(wallet.wallet_address);

      // Get full account info from Flow blockchain
      const accountInfo = await this.flowService.getAccountInfo(wallet.wallet_address);

      return {
        address: wallet.wallet_address,
        balance: balance,
        accountInfo: {
          keys: accountInfo.keys,
          contracts: accountInfo.contracts,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch wallet details for ${wallet.wallet_address}`, error);
      throw new BadRequestException(`Failed to fetch wallet details: ${error.message}`);
    }
  }

  /**
   * Get wallet transactions
   * Works for both providers and users
   */
  async getWalletTransactions(walletAddress: string, limit: number = 10) {
    // Verify wallet exists
    const { data: wallet, error } = await this.supabaseService.providerClient
      .from('wallet_details')
      .select('wallet_address')
      .eq('wallet_address', walletAddress)
      .single();

    if (error || !wallet) {
      throw new NotFoundException('Wallet not found');
    }

    try {
      const transactions = await this.flowService.getAccountTransactions(
        wallet.wallet_address,
        limit
      );

      return {
        address: wallet.wallet_address,
        transactions,
        count: transactions.length,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch transactions for ${wallet.wallet_address}`, error);
      throw new BadRequestException(`Failed to fetch transactions: ${error.message}`);
    }
  }

  /**
   * Send Flow tokens from wallet
   * Works for both providers and users
   */
  async sendFlowTokens(walletAddress: string, toAddress: string, amount: string) {
    // Get wallet details including private key
    const { data: wallet, error } = await this.supabaseService.providerClient
      .from('wallet_details')
      .select('wallet_address, private_key')
      .eq('wallet_address', walletAddress)
      .single();

    if (error || !wallet) {
      throw new NotFoundException('Wallet not found');
    }

    try {
      // Send FLOW tokens
      const result = await this.flowService.sendFlowTokens(
        wallet.wallet_address,
        wallet.private_key,
        toAddress,
        amount
      );

      return {
        from: wallet.wallet_address,
        to: toAddress,
        amount,
        transactionId: result.transactionId,
        status: result.status,
      };
    } catch (error) {
      this.logger.error(`Failed to send FLOW tokens from ${wallet.wallet_address}`, error);
      throw new BadRequestException(`Failed to send FLOW tokens: ${error.message}`);
    }
  }

  /**
   * Get receive info (QR code and address)
   * Works for both providers and users
   */
  async getReceiveInfo(walletAddress: string, displayName?: string) {
    // Verify wallet exists
    const { data: wallet, error } = await this.supabaseService.providerClient
      .from('wallet_details')
      .select('wallet_address')
      .eq('wallet_address', walletAddress)
      .single();

    if (error || !wallet) {
      throw new NotFoundException('Wallet not found');
    }

    try {
      const QRCode = require('qrcode');

      // Generate QR code as base64 data URL
      const qrCodeDataUrl = await QRCode.toDataURL(wallet.wallet_address, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      return {
        address: wallet.wallet_address,
        qrCode: qrCodeDataUrl,
        displayName: displayName || 'User',
        network: 'Flow Testnet',
        instructions: 'Share this address or QR code to receive FLOW tokens',
      };
    } catch (error) {
      this.logger.error(`Failed to generate receive info for ${wallet.wallet_address}`, error);
      throw new BadRequestException(`Failed to generate receive info: ${error.message}`);
    }
  }

  /**
   * Get CHT (ChargeHive Token) balance for a wallet address
   * @param walletAddress - The Flow wallet address to query
   * @returns CHT token balance as a string
   */
  async getCHTBalance(walletAddress: string): Promise<string> {
    // Verify wallet exists
    const { data: wallet, error } = await this.supabaseService.providerClient
      .from('wallet_details')
      .select('wallet_address')
      .eq('wallet_address', walletAddress)
      .single();

    if (error || !wallet) {
      throw new NotFoundException('Wallet not found');
    }

    try {
      // Get CHT balance from Flow blockchain
      const chtBalance = await this.flowService.getCHTBalance(wallet.wallet_address);

      this.logger.log(`CHT Balance for ${wallet.wallet_address}: ${chtBalance} CHT`);

      return chtBalance;
    } catch (error) {
      this.logger.error(`Failed to get CHT balance for ${wallet.wallet_address}`, error);
      throw new BadRequestException(`Failed to get CHT balance: ${error.message}`);
    }
  }
}
