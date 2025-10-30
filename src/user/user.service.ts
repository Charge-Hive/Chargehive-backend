import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { FlowService } from '../flow/flow.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private supabaseService: SupabaseService,
    private flowService: FlowService,
  ) {}

  async register(registerDto: RegisterUserDto) {
    const { email, password, name, phone, profileImage } = registerDto;

    // Step 1: Create Flow blockchain account
    this.logger.log(`Creating Flow account for user: ${email}`);
    let flowAccount: { address: string; privateKey: string };

    try {
      flowAccount = await this.flowService.createFlowAccount();
      this.logger.log(`Flow account created successfully: ${flowAccount.address}`);
    } catch (error) {
      this.logger.error('Failed to create Flow account', error);
      throw new BadRequestException(`Failed to create blockchain wallet: ${error.message}`);
    }

    // Step 1.5: Fund the new account with initial FLOW tokens for storage
    try {
      const initialFundAmount = '0.001'; // 0.001 FLOW (minimum for storage)
      this.logger.log(`Funding new account ${flowAccount.address} with ${initialFundAmount} FLOW`);

      const serviceAccountAddress = this.flowService.getAccountAddress();
      const serviceAccountPrivateKey = process.env.FLOW_PRIVATE_KEY || process.env.FLOW_SERVICE_ACCOUNT_PRIVATE_KEY;

      await this.flowService.sendFlowTokens(
        serviceAccountAddress,
        serviceAccountPrivateKey,
        flowAccount.address,
        initialFundAmount
      );

      this.logger.log(`✓ Account funded successfully with ${initialFundAmount} FLOW`);

      // Wait a moment for the transaction to settle
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      this.logger.error('Failed to fund new account', error);
      this.logger.warn('Continuing without funding - CHToken vault setup may fail');
    }

    // Step 1.6: Setup CHToken vault for the newly created account
    try {
      this.logger.log(`Setting up CHToken vault for user: ${email}`);
      const vaultSetup = await this.flowService.setupCHTokenVault(
        flowAccount.address,
        flowAccount.privateKey
      );
      this.logger.log(
        `CHToken vault setup successful. Transaction: ${vaultSetup.transactionId}`
      );
    } catch (error) {
      this.logger.error('Failed to setup CHToken vault', error);
      // Note: We don't throw here to allow account creation to proceed
      // The vault can be set up later if needed
      this.logger.warn(
        `User account created but CHToken vault setup failed: ${error.message}`
      );
    }

    // Step 2: Sign up with Supabase Auth (this will send verification email)
    const { data: authData, error: authError } =
      await this.supabaseService.userAuthClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
            profile_image: profileImage,
            type: 'user',
          },
        },
      });

    if (authError) {
      this.logger.error('Supabase Auth Error:', authError);

      if (authError.message.includes('already registered')) {
        throw new ConflictException('User with this email already exists');
      }
      throw new BadRequestException(`Signup failed: ${authError.message}`);
    }

    if (!authData.user) {
      throw new BadRequestException('Signup failed');
    }

    // Step 3: Store wallet details in wallet_details table
    const { error: walletError } = await this.supabaseService.providerClient
      .from('wallet_details')
      .insert([
        {
          wallet_address: flowAccount.address,
          private_key: flowAccount.privateKey,
        },
      ]);

    if (walletError) {
      // Rollback: delete auth user if wallet creation fails
      await this.supabaseService.userAuthClient.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to store wallet details: ${walletError.message}`);
    }

    // Step 4: Store additional user data in users table with wallet reference
    const { data: newUser, error: dbError } = await this.supabaseService.providerClient
      .from('users')
      .insert([
        {
          id: authData.user.id, // Use Supabase Auth user ID
          email,
          name,
          phone: phone || null,
          profile_image: profileImage || null,
          wallet_address: flowAccount.address,
          private_key: flowAccount.privateKey,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (dbError) {
      // Rollback: delete auth user and wallet if profile creation fails
      await this.supabaseService.userAuthClient.auth.admin.deleteUser(authData.user.id);
      await this.supabaseService.providerClient
        .from('wallet_details')
        .delete()
        .eq('wallet_address', flowAccount.address);
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Remove sensitive data from response
    const { private_key, ...userWithoutPrivateKey } = newUser;

    return {
      access_token: authData.session?.access_token,
      refresh_token: authData.session?.refresh_token,
      auth_user: authData.user,
      user: userWithoutPrivateKey,
      wallet: {
        address: flowAccount.address,
      },
    };
  }

  async login(loginDto: LoginUserDto) {
    const { email, password } = loginDto;

    // Login with Supabase Auth
    const { data: authData, error: authError } =
      await this.supabaseService.userAuthClient.auth.signInWithPassword({
        email,
        password,
      });

    if (authError || !authData.user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Get user profile from database
    const { data: user, error: dbError } =
      await this.supabaseService.providerClient
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

    if (dbError || !user) {
      throw new UnauthorizedException('User profile not found');
    }

    // Remove sensitive data from response
    delete user.private_key;

    return {
      access_token: authData.session?.access_token,
      refresh_token: authData.session?.refresh_token,
      auth_user: authData.user,
      user,
    };
  }

  async getProfile(userId: string) {
    const { data: user, error } = await this.supabaseService.providerClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new NotFoundException('User not found');
    }

    delete user.password;
    return user;
  }

  async updateProfile(userId: string, updates: any) {
    // Remove sensitive fields that shouldn't be updated this way
    delete updates.password;
    delete updates.email;

    const { data: updatedUser, error } = await this.supabaseService.providerClient
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error || !updatedUser) {
      throw new NotFoundException('User not found');
    }

    delete updatedUser.password;
    return updatedUser;
  }

  async getDashboardData(userId: string) {
    const { data: user, error } = await this.supabaseService.providerClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new NotFoundException('User not found');
    }

    // Example: fetch additional stats, recent bookings, etc.
    const dashboardData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      stats: {
        // Add more dashboard-specific data here
      },
    };

    return dashboardData;
  }
}
