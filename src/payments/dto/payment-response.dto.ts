export class InitiatePaymentResponseDto {
  paymentId: string;
  amountUsd: number;
  flowTokenAmount: number;
  flowTokenPriceUsd: number;
  providerWalletAddress: string;
  expiresAt: string;
}

export class ExecutePaymentResponseDto {
  paymentId: string;
  status: string;
  message: string;
}

export class PaymentStatusResponseDto {
  paymentId: string;
  status: string;
  transactionHash?: string;
  verifiedAt?: string;
}

export class PaymentHistoryDto {
  paymentId: string;
  sessionId: string;
  providerId: string;
  paymentMethod: string;
  amountUsd: number;
  flowTokenAmount?: number;
  flowTokenPriceUsd?: number;
  status: string;
  transactionHash?: string;
  createdAt: string;
  updatedAt: string;
  // Session details
  serviceType?: string;
  serviceAddress?: string;
  fromDatetime?: string;
  toDatetime?: string;
}

export class ProviderEarningsDto {
  paymentId: string;
  sessionId: string;
  userId: string;
  paymentMethod: string;
  amountUsd: number;
  flowTokenAmount?: number;
  status: string;
  transactionHash?: string;
  createdAt: string;
  // Session details
  serviceType?: string;
  fromDatetime?: string;
  toDatetime?: string;
}

export class EarningsSummaryDto {
  totalEarningsUsd: number;
  totalFlowTokens: number;
  completedPayments: number;
  pendingPayments: number;
  payments: ProviderEarningsDto[];
}
