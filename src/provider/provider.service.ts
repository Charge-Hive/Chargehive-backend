import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { AuthService } from "../auth/auth.service";
import { FlowService } from "../flow/flow.service";
import { SignupProviderDto } from "./dto/signup-provider.dto";
import { LoginProviderDto } from "./dto/login-provider.dto";
import { AddServiceDto } from "./dto/add-service.dto";

@Injectable()
export class ProviderService {
  private readonly logger = new Logger(ProviderService.name);

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private flowService: FlowService
  ) {}

  async signup(signupDto: SignupProviderDto) {
    const { email, password, ...rest } = signupDto;

    // Debug: Check if auth client is initialized
    console.log(
      "🔍 Auth client initialized:",
      !!this.supabaseService.providerAuthClient
    );

    // Step 1: Create Flow blockchain account
    this.logger.log(`Creating Flow account for provider: ${email}`);
    let flowAccount: { address: string; privateKey: string };

    try {
      flowAccount = await this.flowService.createFlowAccount();
      this.logger.log(
        `Flow account created successfully: ${flowAccount.address}`
      );
    } catch (error) {
      this.logger.error("Failed to create Flow account", error);
      throw new BadRequestException(
        `Failed to create blockchain wallet: ${error.message}`
      );
    }

    // Step 2: Sign up with Supabase Auth
    const { data: authData, error: authError } =
      await this.supabaseService.providerAuthClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: rest.name,
            type: "provider",
          },
        },
      });

    // Debug: Log full error details
    if (authError) {
      console.error("❌ Supabase Auth Error Details:", {
        message: authError.message,
        status: authError.status,
        name: authError.name,
      });

      if (authError.message.includes("already registered")) {
        throw new ConflictException("Provider with this email already exists");
      }
      throw new BadRequestException(
        `Signup failed: ${authError.message} (Status: ${authError.status})`
      );
    }

    if (!authData.user) {
      throw new BadRequestException("Signup failed");
    }

    // Step 3: Store wallet details in wallet_details table
    const { error: walletError } = await this.supabaseService.providerClient
      .from("wallet_details")
      .insert([
        {
          wallet_address: flowAccount.address,
          private_key: flowAccount.privateKey,
        },
      ]);

    if (walletError) {
      // Rollback: delete auth user if wallet creation fails
      await this.supabaseService.providerAuthClient.auth.admin.deleteUser(
        authData.user.id
      );
      throw new Error(`Failed to store wallet details: ${walletError.message}`);
    }

    // Step 4: Store additional provider data in providers table with wallet reference
    const { data: newProvider, error: dbError } =
      await this.supabaseService.providerClient
        .from("providers")
        .insert([
          {
            id: authData.user.id, // Use Supabase Auth user ID
            email,
            ...rest,
            wallet_address: flowAccount.address,
            private_key: flowAccount.privateKey,
            country: rest.country || "India",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

    if (dbError) {
      // Rollback: delete auth user and wallet if profile creation fails
      await this.supabaseService.providerAuthClient.auth.admin.deleteUser(
        authData.user.id
      );
      await this.supabaseService.providerClient
        .from("wallet_details")
        .delete()
        .eq("wallet_address", flowAccount.address);
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Remove private_key from response for security (still don't expose it to frontend)
    const { private_key, ...providerWithoutPrivateKey } = newProvider;

    return {
      access_token: authData.session?.access_token,
      refresh_token: authData.session?.refresh_token,
      user: authData.user,
      provider: providerWithoutPrivateKey,
      wallet: {
        address: flowAccount.address,
      },
    };
  }

  async login(loginDto: LoginProviderDto) {
    const { email, password } = loginDto;

    // Login with Supabase Auth
    const { data: authData, error: authError } =
      await this.supabaseService.providerAuthClient.auth.signInWithPassword({
        email,
        password,
      });

    if (authError || !authData.user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    // Get provider profile from database
    const { data: provider, error: dbError } =
      await this.supabaseService.providerClient
        .from("providers")
        .select("*")
        .eq("id", authData.user.id)
        .single();

    if (dbError || !provider) {
      throw new UnauthorizedException("Provider profile not found");
    }

    return {
      access_token: authData.session?.access_token,
      refresh_token: authData.session?.refresh_token,
      user: authData.user,
      provider,
    };
  }

  async getProfile(providerId: string) {
    const { data: provider, error } = await this.supabaseService.providerClient
      .from("providers")
      .select("*")
      .eq("id", providerId)
      .single();

    if (error || !provider) {
      throw new NotFoundException("Provider not found");
    }

    delete provider.password;
    return provider;
  }

  async updateProfile(providerId: string, updates: any) {
    // Remove sensitive fields that shouldn't be updated this way
    delete updates.password;
    delete updates.email;

    const { data: updatedProvider, error } =
      await this.supabaseService.providerClient
        .from("providers")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", providerId)
        .select()
        .single();

    if (error || !updatedProvider) {
      throw new NotFoundException("Provider not found");
    }

    delete updatedProvider.password;
    return updatedProvider;
  }

  async getDashboardData(providerId: string) {
    const { data: provider, error } = await this.supabaseService.providerClient
      .from("providers")
      .select("*")
      .eq("id", providerId)
      .single();

    if (error || !provider) {
      throw new NotFoundException("Provider not found");
    }

    // Example: fetch additional stats, recent activities, etc.
    const dashboardData = {
      provider: {
        id: provider.id,
        name: provider.name,
        email: provider.email,
      },
      stats: {
        // Add more dashboard-specific data here
      },
    };

    return dashboardData;
  }

  async updatePassword(accessToken: string, newPassword: string) {
    // Use Supabase Auth to update password (requires current session)
    const { data, error } =
      await this.supabaseService.providerAuthClient.auth.updateUser({
        password: newPassword,
      });

    if (error) {
      throw new UnauthorizedException(
        `Password update failed: ${error.message}`
      );
    }

    return {
      message: "Password updated successfully",
      user: data.user,
    };
  }

  async forgotPassword(email: string) {
    // Use Supabase Auth to send password reset email
    const { error } =
      await this.supabaseService.providerAuthClient.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
        }
      );

    // Always return success message (don't reveal if email exists)
    if (error) {
      console.error("Password reset error:", error.message);
    }

    return {
      message: "If the email exists, a password reset link has been sent",
    };
  }

  async resetPassword(accessToken: string, newPassword: string) {
    // Use Supabase Auth to update password
    // Note: User must be authenticated with the reset token first
    const { data, error } =
      await this.supabaseService.providerAuthClient.auth.updateUser({
        password: newPassword,
      });

    if (error) {
      throw new BadRequestException(`Password reset failed: ${error.message}`);
    }

    return {
      message: "Password reset successfully",
      user: data.user,
    };
  }

  async getWalletDetails(providerId: string) {
    // Get provider's wallet address from database
    const { data: provider, error } = await this.supabaseService.providerClient
      .from("providers")
      .select("wallet_address")
      .eq("id", providerId)
      .single();

    if (error || !provider) {
      throw new NotFoundException("Provider not found");
    }

    if (!provider.wallet_address) {
      throw new NotFoundException("Wallet not found for this provider");
    }

    try {
      // Get wallet balance from Flow blockchain
      const balance = await this.flowService.getAccountBalance(
        provider.wallet_address
      );

      // Get full account info from Flow blockchain
      const accountInfo = await this.flowService.getAccountInfo(
        provider.wallet_address
      );

      return {
        address: provider.wallet_address,
        balance: balance,
        accountInfo: {
          keys: accountInfo.keys,
          contracts: accountInfo.contracts,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch wallet details for ${provider.wallet_address}`,
        error
      );
      throw new BadRequestException(
        `Failed to fetch wallet details: ${error.message}`
      );
    }
  }

  async getWalletTransactions(providerId: string, limit: number = 10) {
    // Get provider's wallet address from database
    const { data: provider, error } = await this.supabaseService.providerClient
      .from("providers")
      .select("wallet_address")
      .eq("id", providerId)
      .single();

    if (error || !provider) {
      throw new NotFoundException("Provider not found");
    }

    if (!provider.wallet_address) {
      throw new NotFoundException("Wallet not found for this provider");
    }

    try {
      const transactions = await this.flowService.getAccountTransactions(
        provider.wallet_address,
        limit
      );

      return {
        address: provider.wallet_address,
        transactions,
        count: transactions.length,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch transactions for ${provider.wallet_address}`,
        error
      );
      throw new BadRequestException(
        `Failed to fetch transactions: ${error.message}`
      );
    }
  }

  async sendFlowTokens(providerId: string, toAddress: string, amount: string) {
    // Get provider's wallet details from database
    const { data: provider, error } = await this.supabaseService.providerClient
      .from("providers")
      .select("wallet_address, private_key")
      .eq("id", providerId)
      .single();

    if (error || !provider) {
      throw new NotFoundException("Provider not found");
    }

    if (!provider.wallet_address || !provider.private_key) {
      throw new NotFoundException("Wallet not found for this provider");
    }

    try {
      // Send FLOW tokens
      const result = await this.flowService.sendFlowTokens(
        provider.wallet_address,
        provider.private_key,
        toAddress,
        amount
      );

      return {
        from: provider.wallet_address,
        to: toAddress,
        amount,
        transactionId: result.transactionId,
        status: result.status,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send FLOW tokens from ${provider.wallet_address}`,
        error
      );
      throw new BadRequestException(
        `Failed to send FLOW tokens: ${error.message}`
      );
    }
  }

  async getReceiveInfo(providerId: string) {
    // Get provider's wallet address from database
    const { data: provider, error } = await this.supabaseService.providerClient
      .from("providers")
      .select("wallet_address, name")
      .eq("id", providerId)
      .single();

    if (error || !provider) {
      throw new NotFoundException("Provider not found");
    }

    if (!provider.wallet_address) {
      throw new NotFoundException("Wallet not found for this provider");
    }

    try {
      const QRCode = require("qrcode");

      // Generate QR code as base64 data URL
      const qrCodeDataUrl = await QRCode.toDataURL(provider.wallet_address, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      return {
        address: provider.wallet_address,
        qrCode: qrCodeDataUrl,
        displayName: provider.name,
        network: "Flow Testnet",
        instructions: "Share this address or QR code to receive FLOW tokens",
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate receive info for ${provider.wallet_address}`,
        error
      );
      throw new BadRequestException(
        `Failed to generate receive info: ${error.message}`
      );
    }
  }

  async addService(providerId: string, addServiceDto: AddServiceDto) {
    const {
      serviceType,
      status,
      address,
      city,
      state,
      postalCode,
      country,
      latitude,
      longitude,
      image1,
      image2,
      image3,
      description,
      hourlyRate,
    } = addServiceDto;

    try {
      // Insert service into database
      const { data: service, error } = await this.supabaseService.providerClient
        .from("services")
        .insert({
          provider_id: providerId,
          service_type: serviceType,
          status: status, // Default status
          address,
          city,
          state,
          postal_code: postalCode,
          country,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          image1: image1 || null,
          image2: image2 || null,
          image3: image3 || null,
          description: description || null,
          hourly_rate: hourlyRate ? hourlyRate : '10',
        })
        .select()
        .single();

      if (error) {
        this.logger.error("Failed to create service", error);
        throw new BadRequestException(
          `Failed to register service: ${error.message}`
        );
      }

      this.logger.log(`Service registered successfully: ${service.service_id}`);

      return {
        serviceId: service.service_id,
        serviceType: service.service_type,
        status: service.status,
        address: service.address,
        city: service.city,
        state: service.state,
        postalCode: service.postal_code,
        country: service.country,
        latitude: service.latitude,
        longitude: service.longitude,
        createdAt: service.created_at,
      };
    } catch (error) {
      this.logger.error("Failed to register service", error);
      throw new BadRequestException(
        `Failed to register service: ${error.message}`
      );
    }
  }
}
