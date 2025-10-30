import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { PriceService } from "../prices/price.service";
import { WalletService } from "../wallet/wallet.service";
import {
  InitiatePaymentResponseDto,
  ExecutePaymentResponseDto,
  PaymentStatusResponseDto,
  PaymentHistoryDto,
  EarningsSummaryDto,
  ProviderEarningsDto,
} from "./dto/payment-response.dto";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly PAYMENT_EXPIRY_MINUTES = 15;

  constructor(
    private supabaseService: SupabaseService,
    private priceService: PriceService,
    private walletService: WalletService
  ) {}

  /**
   * Initiates a Flow token payment
   * Creates session first, then calculates Flow amount and creates a pending payment record
   */
  async initiateFlowPayment(
    serviceId: string,
    fromDatetime: string,
    toDatetime: string,
    userId: string
  ): Promise<InitiatePaymentResponseDto> {
    this.logger.log(
      `Initiating Flow payment for service ${serviceId} by user ${userId}`
    );

    // 1. Validate datetime range
    const fromDate = new Date(fromDatetime);
    const toDate = new Date(toDatetime);

    if (fromDate >= toDate) {
      throw new BadRequestException("From datetime must be before to datetime");
    }

    if (fromDate < new Date()) {
      throw new BadRequestException("Cannot book a session in the past");
    }

    // 2. Fetch service details
    const { data: service, error: serviceError } =
      await this.supabaseService.userClient
        .from("services")
        .select("service_id, provider_id, status, hourly_rate")
        .eq("service_id", serviceId)
        .single();

    if (serviceError || !service) {
      throw new NotFoundException("Service not found");
    }

    // 3. Check if service status is 'available' or 'active'
    if (service.status !== "available" && service.status !== "active") {
      throw new BadRequestException(
        `Service is not available for booking. Current status: ${service.status}`
      );
    }

    // 4. Check for overlapping sessions
    // A session overlaps if: (new_start < existing_end) AND (new_end > existing_start)
    this.logger.log(`[OVERLAP CHECK] Starting overlap check`);
    this.logger.log(`[OVERLAP CHECK] serviceId: ${serviceId}`);
    this.logger.log(`[OVERLAP CHECK] fromDatetime: ${fromDatetime}`);
    this.logger.log(`[OVERLAP CHECK] toDatetime: ${toDatetime}`);

    // First, get ALL sessions for this service to see what's in the database
    const { data: allSessions } = await this.supabaseService.userClient
      .from("sessions")
      .select("*")
      .eq("service_id", serviceId);

    this.logger.log(`[OVERLAP CHECK] Total sessions for service ${serviceId}: ${allSessions?.length || 0}`);
    if (allSessions && allSessions.length > 0) {
      this.logger.log(`[OVERLAP CHECK] All sessions:`, JSON.stringify(allSessions, null, 2));
    }

    // Now check for overlapping sessions
    const { data: overlappingSessions, error: overlapError } =
      await this.supabaseService.userClient
        .from("sessions")
        .select("session_id, from_datetime, to_datetime")
        .eq("service_id", serviceId)
        .filter("from_datetime", "lt", toDatetime)
        .filter("to_datetime", "gt", fromDatetime);

    this.logger.log(`[OVERLAP CHECK] Overlapping sessions found: ${overlappingSessions?.length || 0}`);
    if (overlappingSessions && overlappingSessions.length > 0) {
      this.logger.log(`[OVERLAP CHECK] Overlapping session details:`, JSON.stringify(overlappingSessions, null, 2));
    }

    if (overlapError) {
      this.logger.error("[OVERLAP CHECK] Error checking overlaps:", overlapError);
      throw new BadRequestException(
        `Failed to check availability: ${overlapError.message}`
      );
    }

    if (overlappingSessions && overlappingSessions.length > 0) {
      throw new BadRequestException(
        "This service is already booked for the selected time slot. Please choose a different time."
      );
    }

    this.logger.log(`[OVERLAP CHECK] No overlaps found - proceeding with payment initiation`);

    // 5. Calculate total amount
    const durationInHours =
      (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60);
    const hourlyRate = parseFloat(service.hourly_rate || "10");
    const amountUsd = parseFloat((durationInHours * hourlyRate).toFixed(2));

    // 6. Check if there's already a pending payment for this service + time slot
    const { data: existingPayment } = await this.supabaseService.userClient
      .from("payments")
      .select("*")
      .eq("service_id", serviceId)
      .eq("user_id", userId)
      .eq("from_datetime", fromDatetime)
      .eq("to_datetime", toDatetime)
      .eq("status", "pending")
      .single();

    if (existingPayment) {
      // Return existing pending payment details
      const expiresAt = new Date(
        new Date(existingPayment.created_at).getTime() +
          this.PAYMENT_EXPIRY_MINUTES * 60000
      ).toISOString();

      return {
        paymentId: existingPayment.payment_id,
        amountUsd: parseFloat(existingPayment.amount_usd),
        flowTokenAmount: parseFloat(existingPayment.flow_token_amount),
        flowTokenPriceUsd: parseFloat(existingPayment.flow_token_price_usd),
        providerWalletAddress: existingPayment.receiver_wallet_address,
        expiresAt,
      };
    }

    // 7. Fetch provider details to get wallet address
    const { data: provider, error: providerError } =
      await this.supabaseService.providerClient
        .from("providers")
        .select("wallet_address")
        .eq("id", service.provider_id)
        .single();

    if (providerError || !provider) {
      throw new NotFoundException("Provider not found");
    }

    if (!provider.wallet_address) {
      throw new BadRequestException(
        "Provider has not set up a Flow wallet. Please contact the provider or use card payment."
      );
    }

    // 5. Fetch user's wallet address
    const { data: user, error: userError } =
      await this.supabaseService.userClient
        .from("users")
        .select("wallet_address")
        .eq("id", userId)
        .single();

    if (userError || !user) {
      throw new NotFoundException("User not found");
    }

    if (!user.wallet_address) {
      throw new BadRequestException(
        "You have not set up a Flow wallet. Please add your wallet address in settings."
      );
    }

    // 8. Get current Flow token price
    const flowPrice = await this.priceService.getFlowPriceInUSD();

    // 9. Calculate Flow token amount
    const flowTokenAmount = this.priceService.calculateFlowAmount(
      amountUsd,
      flowPrice
    );

    this.logger.log(
      `Payment calculation: $${amountUsd} = ${flowTokenAmount} FLOW @ $${flowPrice}/FLOW`
    );

    // 10. Create payment record WITHOUT session (session created after payment)
    const { data: payment, error: paymentError } =
      await this.supabaseService.userClient
        .from("payments")
        .insert({
          session_id: null, // Session will be created when payment is executed
          user_id: userId,
          provider_id: service.provider_id,
          service_id: serviceId, // Store booking details in payment
          from_datetime: fromDatetime,
          to_datetime: toDatetime,
          payment_method: "flow_token",
          amount_usd: amountUsd,
          flow_token_amount: flowTokenAmount,
          flow_token_price_usd: flowPrice,
          sender_wallet_address: user.wallet_address,
          receiver_wallet_address: provider.wallet_address,
          status: "pending",
        })
        .select()
        .single();

    if (paymentError) {
      this.logger.error("Failed to create payment record", paymentError);
      throw new BadRequestException(
        `Failed to initiate payment: ${paymentError.message}`
      );
    }

    // 9. Calculate expiry time
    const expiresAt = new Date(
      Date.now() + this.PAYMENT_EXPIRY_MINUTES * 60000
    ).toISOString();

    this.logger.log(`Payment ${payment.payment_id} initiated successfully`);

    return {
      paymentId: payment.payment_id,
      amountUsd,
      flowTokenAmount,
      flowTokenPriceUsd: flowPrice,
      providerWalletAddress: provider.wallet_address,
      expiresAt,
    };
  }

  /**
   * Executes a Flow payment by sending actual blockchain transaction
   * Backend generates the transaction hash by sending FLOW tokens
   */
  async executeFlowPayment(
    paymentId: string,
    transactionHash: string | undefined,
    senderWalletAddress: string,
    userId: string
  ): Promise<ExecutePaymentResponseDto> {
    this.logger.log(
      `Executing Flow payment ${paymentId} for user ${userId}`
    );

    // 1. Fetch payment record
    const { data: payment, error: paymentError } =
      await this.supabaseService.userClient
        .from("payments")
        .select("*")
        .eq("payment_id", paymentId)
        .eq("user_id", userId)
        .single();

    if (paymentError || !payment) {
      throw new NotFoundException(
        "Payment not found or does not belong to user"
      );
    }

    // 2. Check payment status
    if (payment.status === "completed") {
      throw new BadRequestException("This payment has already been completed");
    }

    if (payment.status === "failed") {
      throw new BadRequestException(
        "This payment has failed. Please initiate a new payment."
      );
    }

    // 3. Check payment expiry
    const expiryTime = new Date(
      new Date(payment.created_at).getTime() +
        this.PAYMENT_EXPIRY_MINUTES * 60000
    );

    if (new Date() > expiryTime) {
      // Mark as failed
      await this.supabaseService.userClient
        .from("payments")
        .update({ status: "failed" })
        .eq("payment_id", paymentId);

      throw new BadRequestException(
        "Payment has expired. Please initiate a new payment."
      );
    }

    // 4. Verify sender wallet matches
    if (senderWalletAddress !== payment.sender_wallet_address) {
      throw new BadRequestException(
        "Sender wallet address does not match payment record"
      );
    }

    // 5. Actually send Flow tokens on blockchain from user to provider
    let blockchainTransactionId: string;
    try {
      this.logger.log(
        `Sending ${payment.flow_token_amount} FLOW from ${payment.sender_wallet_address} to ${payment.receiver_wallet_address}`
      );

      const txResult = await this.walletService.sendFlowTokens(
        payment.sender_wallet_address,
        payment.receiver_wallet_address,
        payment.flow_token_amount.toString()
      );

      blockchainTransactionId = txResult.transactionId;
      this.logger.log(`Blockchain transaction successful: ${blockchainTransactionId}`);
    } catch (error) {
      this.logger.error("Blockchain transaction failed", error);

      // Mark payment as failed
      await this.supabaseService.userClient
        .from("payments")
        .update({ status: "failed" })
        .eq("payment_id", paymentId);

      throw new BadRequestException(
        `Failed to send FLOW tokens on blockchain: ${error.message}`
      );
    }

    // 6. Create the session NOW (after blockchain payment is successful)
    this.logger.log(`[SESSION CREATE] Creating session for payment ${paymentId}`);
    this.logger.log(`[SESSION CREATE] Session data:`, {
      user_id: payment.user_id,
      provider_id: payment.provider_id,
      service_id: payment.service_id,
      from_datetime: payment.from_datetime,
      to_datetime: payment.to_datetime,
      total_amount: payment.amount_usd,
      payment_id: paymentId,
      payment_status: "paid",
    });

    const { data: session, error: sessionError } =
      await this.supabaseService.userClient
        .from("sessions")
        .insert({
          user_id: payment.user_id,
          provider_id: payment.provider_id,
          service_id: payment.service_id,
          from_datetime: payment.from_datetime,
          to_datetime: payment.to_datetime,
          total_amount: payment.amount_usd,
          payment_id: paymentId,
          payment_status: "paid",
        })
        .select()
        .single();

    if (sessionError) {
      this.logger.error("[SESSION CREATE] Failed to create session:", sessionError);
      this.logger.error("[SESSION CREATE] Error details:", JSON.stringify(sessionError, null, 2));
      throw new BadRequestException(
        `Failed to create session: ${sessionError?.message || JSON.stringify(sessionError)}`
      );
    }

    if (!session) {
      this.logger.error("[SESSION CREATE] Session creation returned no data");
      throw new BadRequestException("Failed to create session: No data returned");
    }

    this.logger.log(`[SESSION CREATE] ✅ Session created successfully: ${session.session_id}`);

    // 7. Update payment with REAL blockchain transaction hash and session_id
    const { error: updateError } = await this.supabaseService.userClient
      .from("payments")
      .update({
        transaction_hash: blockchainTransactionId, // Real blockchain transaction ID
        session_id: session.session_id,
        status: "completed", // Payment successful, blockchain transaction confirmed
      })
      .eq("payment_id", paymentId);

    if (updateError) {
      this.logger.error("Failed to update payment", updateError);
      throw new BadRequestException(
        `Failed to execute payment: ${updateError.message}`
      );
    }

    this.logger.log(`Payment ${paymentId} executed successfully with blockchain tx: ${blockchainTransactionId}`);

    return {
      paymentId,
      status: "completed",
      message: "Payment completed successfully",
    };
  }

  /**
   * Gets the status of a payment
   */
  async getPaymentStatus(
    paymentId: string,
    userId: string
  ): Promise<PaymentStatusResponseDto> {
    const { data: payment, error } = await this.supabaseService.userClient
      .from("payments")
      .select("payment_id, status, transaction_hash, updated_at")
      .eq("payment_id", paymentId)
      .eq("user_id", userId)
      .single();

    if (error || !payment) {
      throw new NotFoundException("Payment not found");
    }

    return {
      paymentId: payment.payment_id,
      status: payment.status,
      transactionHash: payment.transaction_hash || undefined,
      verifiedAt:
        payment.status === "completed" ? payment.updated_at : undefined,
    };
  }

  /**
   * Gets payment history for a user
   */
  async getUserPaymentHistory(userId: string): Promise<PaymentHistoryDto[]> {
    const { data: payments, error } = await this.supabaseService.userClient
      .from("payments")
      .select(
        `
        payment_id,
        session_id,
        provider_id,
        payment_method,
        amount_usd,
        flow_token_amount,
        flow_token_price_usd,
        status,
        transaction_hash,
        created_at,
        updated_at,
        sessions (
          service_id,
          from_datetime,
          to_datetime,
          services (
            service_type,
            address
          )
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      this.logger.error("Failed to fetch user payment history", error);
      throw new BadRequestException(
        `Failed to fetch payment history: ${error.message}`
      );
    }

    return payments.map((payment: any) => ({
      paymentId: payment.payment_id,
      sessionId: payment.session_id,
      providerId: payment.provider_id,
      paymentMethod: payment.payment_method,
      amountUsd: parseFloat(payment.amount_usd),
      flowTokenAmount: payment.flow_token_amount
        ? parseFloat(payment.flow_token_amount)
        : undefined,
      flowTokenPriceUsd: payment.flow_token_price_usd
        ? parseFloat(payment.flow_token_price_usd)
        : undefined,
      status: payment.status,
      transactionHash: payment.transaction_hash || undefined,
      createdAt: payment.created_at,
      updatedAt: payment.updated_at,
      serviceType: payment.sessions?.services?.service_type,
      serviceAddress: payment.sessions?.services?.address,
      fromDatetime: payment.sessions?.from_datetime,
      toDatetime: payment.sessions?.to_datetime,
    }));
  }

  /**
   * Gets earnings for a provider
   */
  async getProviderEarnings(providerId: string): Promise<EarningsSummaryDto> {
    const { data: payments, error } = await this.supabaseService.providerClient
      .from("payments")
      .select(
        `
        payment_id,
        session_id,
        user_id,
        payment_method,
        amount_usd,
        flow_token_amount,
        status,
        transaction_hash,
        created_at,
        sessions (
          service_id,
          from_datetime,
          to_datetime,
          services (
            service_type
          )
        )
      `
      )
      .eq("provider_id", providerId)
      .order("created_at", { ascending: false });

    if (error) {
      this.logger.error("Failed to fetch provider earnings", error);
      throw new BadRequestException(
        `Failed to fetch earnings: ${error.message}`
      );
    }

    // Calculate summary
    let totalEarningsUsd = 0;
    let totalFlowTokens = 0;
    let completedPayments = 0;
    let pendingPayments = 0;

    const paymentDtos: ProviderEarningsDto[] = payments.map((payment: any) => {
      const amountUsd = parseFloat(payment.amount_usd);
      const flowAmount = payment.flow_token_amount
        ? parseFloat(payment.flow_token_amount)
        : 0;

      if (payment.status === "completed") {
        totalEarningsUsd += amountUsd;
        totalFlowTokens += flowAmount;
        completedPayments++;
      } else if (payment.status === "pending") {
        pendingPayments++;
      }

      return {
        paymentId: payment.payment_id,
        sessionId: payment.session_id,
        userId: payment.user_id,
        paymentMethod: payment.payment_method,
        amountUsd,
        flowTokenAmount: flowAmount > 0 ? flowAmount : undefined,
        status: payment.status,
        transactionHash: payment.transaction_hash || undefined,
        createdAt: payment.created_at,
        serviceType: payment.sessions?.services?.service_type,
        fromDatetime: payment.sessions?.from_datetime,
        toDatetime: payment.sessions?.to_datetime,
      };
    });

    return {
      totalEarningsUsd,
      totalFlowTokens,
      completedPayments,
      pendingPayments,
      payments: paymentDtos,
    };
  }
}
