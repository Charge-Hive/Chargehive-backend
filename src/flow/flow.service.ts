import { Injectable, Logger } from '@nestjs/common';
import * as fcl from '@onflow/fcl';
import { ec as EC } from 'elliptic';
import { SHA3 } from 'sha3';

// Initialize elliptic curve for key generation
const ec = new EC('p256');

@Injectable()
export class FlowService {
  private readonly logger = new Logger(FlowService.name);

  constructor() {
    this.initializeFlowConfig();
  }

  /**
   * Initialize Flow FCL configuration for testnet
   */
  private initializeFlowConfig() {
    fcl.config({
      'accessNode.api': process.env.FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org',
      'discovery.wallet': 'https://fcl-discovery.onflow.org/testnet/authn',
      'flow.network': 'testnet',
    });

    this.logger.log('Flow FCL configured for testnet');
  }

  /**
   * Generate a new Flow account with keys
   * @returns Object containing wallet address and private key
   */
  async createFlowAccount(): Promise<{ address: string; privateKey: string }> {
    try {
      // Generate a new key pair
      const keyPair = this.generateKeyPair();

      // Create account using Flow testnet faucet or service account
      const address = await this.createAccountOnChain(keyPair.publicKey);

      this.logger.log(`Successfully created Flow account: ${address}`);

      return {
        address,
        privateKey: keyPair.privateKey,
      };
    } catch (error) {
      this.logger.error('Failed to create Flow account', error);
      throw new Error(`Flow account creation failed: ${error.message}`);
    }
  }

  /**
   * Generate an elliptic curve key pair for Flow
   */
  private generateKeyPair(): { publicKey: string; privateKey: string } {
    const keyPair = ec.genKeyPair();
    const privateKey = keyPair.getPrivate('hex');
    const publicKey = keyPair.getPublic('hex').substring(2); // Remove '04' prefix

    return {
      publicKey,
      privateKey,
    };
  }

  /**
   * Create account on Flow blockchain using service account
   * Uses the configured Flow service account to create new accounts via Cadence transaction
   */
  private async createAccountOnChain(publicKey: string): Promise<string> {
    // Directly use service account method (more reliable than faucet API)
    return await this.createAccountWithServiceAccount(publicKey);
  }

  /**
   * Create account using a Flow service account
   * This requires you to have a funded service account on testnet
   */
  private async createAccountWithServiceAccount(publicKey: string): Promise<string> {
    const serviceAddress = process.env.FLOW_SERVICE_ACCOUNT_ADDRESS;
    const servicePrivateKey = process.env.FLOW_SERVICE_ACCOUNT_PRIVATE_KEY;

    if (!serviceAddress || !servicePrivateKey) {
      throw new Error(
        'Flow service account not configured. Set FLOW_SERVICE_ACCOUNT_ADDRESS and FLOW_SERVICE_ACCOUNT_PRIVATE_KEY environment variables.'
      );
    }

    // Modern Cadence transaction to create a new account with proper key setup
    const createAccountTx = `
      import Crypto

      transaction(publicKey: String) {
        prepare(signer: auth(BorrowValue, Storage) &Account) {
          let key = PublicKey(
            publicKey: publicKey.decodeHex(),
            signatureAlgorithm: SignatureAlgorithm.ECDSA_P256
          )

          let account = Account(payer: signer)

          account.keys.add(
            publicKey: key,
            hashAlgorithm: HashAlgorithm.SHA3_256,
            weight: 1000.0
          )
        }
      }
    `;

    try {
      const authorization = this.getAuthorization(serviceAddress, servicePrivateKey);

      const txId = await fcl.mutate({
        cadence: createAccountTx,
        args: (arg, t) => [arg(publicKey, t.String)],
        proposer: authorization,
        payer: authorization,
        authorizations: [authorization],
        limit: 1000,
      });

      // Wait for transaction to be sealed
      const txResult = await fcl.tx(txId).onceSealed();

      if (txResult.errorMessage) {
        throw new Error(txResult.errorMessage);
      }

      // Extract created account address from transaction events
      const accountCreatedEvent = txResult.events.find(
        (e) => e.type === 'flow.AccountCreated'
      );

      if (!accountCreatedEvent) {
        throw new Error('Account creation event not found');
      }

      return accountCreatedEvent.data.address;
    } catch (error) {
      this.logger.error('Service account transaction failed', error);
      throw error;
    }
  }

  /**
   * Get FCL authorization object for signing transactions
   */
  private getAuthorization(address: string, privateKey: string, keyId: number = 0) {
    return (account: any = {}) => {
      const keyPair = ec.keyFromPrivate(privateKey);

      return {
        ...account,
        tempId: `${address}-${keyId}`,
        addr: fcl.sansPrefix(address),
        keyId: keyId,
        signingFunction: async (signable: any) => {
          const message = signable.message;

          // Hash the message using SHA3-256 (Flow's hashing algorithm)
          const sha3 = new SHA3(256);
          const messageHash = sha3.update(Buffer.from(message, 'hex')).digest();

          // Sign the hashed message using elliptic
          const signature = keyPair.sign(messageHash);

          // Convert signature to raw format (r + s as 32-byte buffers each)
          const r = signature.r.toArrayLike(Buffer, 'be', 32);
          const s = signature.s.toArrayLike(Buffer, 'be', 32);
          const rawSignature = Buffer.concat([r, s]);

          return {
            addr: fcl.sansPrefix(address),
            keyId: keyId,
            signature: rawSignature.toString('hex'),
          };
        },
      };
    };
  }


  /**
   * Get account information from Flow blockchain
   */
  async getAccountInfo(address: string): Promise<any> {
    try {
      const account = await fcl.account(address);
      return account;
    } catch (error) {
      this.logger.error(`Failed to get account info for ${address}`, error);
      throw error;
    }
  }

  /**
   * Check account balance
   */
  async getAccountBalance(address: string): Promise<string> {
    // Cadence 1.0 syntax for getting Flow token balance
    const script = `
      import FungibleToken from 0x9a0766d93b6608b7
      import FlowToken from 0x7e60df042a9c0868

      access(all) fun main(address: Address): UFix64 {
        let account = getAccount(address)

        let vaultRef = account.capabilities
          .borrow<&{FungibleToken.Balance}>(/public/flowTokenBalance)
          ?? panic("Could not borrow Balance reference")

        return vaultRef.balance
      }
    `;

    try {
      const balance = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(address, t.Address)],
      });

      return balance;
    } catch (error) {
      this.logger.error(`Failed to get balance for ${address}`, error);
      throw error;
    }
  }

  /**
   * Get recent transactions for an account
   */
  async getAccountTransactions(address: string, limit: number = 10): Promise<any[]> {
    try {
      // Use Flow REST API to get events for this account
      // We'll fetch FlowToken.TokensWithdrawn and FlowToken.TokensDeposited events
      const restApiUrl = process.env.FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org';

      // Get recent blocks (approximation since we don't have exact transaction history)
      const latestBlockResponse = await fetch(`${restApiUrl}/v1/blocks?height=sealed`);
      const latestBlockData = await latestBlockResponse.json();
      const latestHeight = parseInt(latestBlockData[0].header.height);

      // Fetch events from a larger range of recent blocks to capture more transactions
      const startHeight = Math.max(0, latestHeight - 1000); // Last ~1000 blocks
      const endHeight = latestHeight;

      this.logger.log(`Fetching transactions for ${address} from blocks ${startHeight} to ${endHeight}`);

      const withdrawEvents = await this.fetchEvents(
        'A.7e60df042a9c0868.FlowToken.TokensWithdrawn',
        startHeight,
        endHeight,
        address
      );

      const depositEvents = await this.fetchEvents(
        'A.7e60df042a9c0868.FlowToken.TokensDeposited',
        startHeight,
        endHeight,
        address
      );

      this.logger.log(`Found ${withdrawEvents.length} withdraw events and ${depositEvents.length} deposit events`);

      // Combine and format transactions
      const normalizedAddress = address.replace('0x', '').toLowerCase();

      const formattedTransactions = [];

      // Process withdraw events (sent)
      for (const event of withdrawEvents) {
        const fromAddr = event.data?.from?.replace('0x', '').toLowerCase() || '';
        if (fromAddr === normalizedAddress) {
          formattedTransactions.push({
            type: 'sent',
            transactionId: event.transactionId,
            amount: event.data?.amount || '0',
            from: event.data?.from,
            to: null, // Withdrawn events don't have 'to' address
            blockHeight: event.blockHeight,
            blockTimestamp: event.blockTimestamp,
            status: 'sealed',
          });
        }
      }

      // Process deposit events (received)
      for (const event of depositEvents) {
        const toAddr = event.data?.to?.replace('0x', '').toLowerCase() || '';
        if (toAddr === normalizedAddress) {
          formattedTransactions.push({
            type: 'received',
            transactionId: event.transactionId,
            amount: event.data?.amount || '0',
            from: null, // Deposited events don't have 'from' address
            to: event.data?.to,
            blockHeight: event.blockHeight,
            blockTimestamp: event.blockTimestamp,
            status: 'sealed',
          });
        }
      }

      // Sort by block height (newest first) and limit results
      const sortedTransactions = formattedTransactions
        .sort((a, b) => parseInt(b.blockHeight) - parseInt(a.blockHeight))
        .slice(0, limit);

      return sortedTransactions;
    } catch (error) {
      this.logger.error(`Failed to get transactions for ${address}`, error);
      throw error;
    }
  }

  /**
   * Fetch events from Flow blockchain
   */
  private async fetchEvents(eventType: string, startHeight: number, endHeight: number, filterAddress?: string): Promise<any[]> {
    try {
      const restApiUrl = process.env.FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org';
      const url = `${restApiUrl}/v1/events?type=${eventType}&start_height=${startHeight}&end_height=${endHeight}`;

      const response = await fetch(url);
      const apiResponse = await response.json();

      // Check if response is an array (the actual format from Flow API)
      const results = Array.isArray(apiResponse) ? apiResponse : (apiResponse.results || []);

      if (!Array.isArray(results)) {
        return [];
      }

      const events = [];
      for (const result of results) {
        for (const event of result.events || []) {
          // Decode the base64 payload
          let eventData: any = {};
          if (event.payload) {
            try {
              const decodedPayload = Buffer.from(event.payload, 'base64').toString('utf-8');
              const parsedPayload = JSON.parse(decodedPayload);

              // Extract fields from the Cadence event structure
              if (parsedPayload.value && parsedPayload.value.fields) {
                eventData = {};
                for (const field of parsedPayload.value.fields) {
                  if (field.name && field.value) {
                    // Handle nested Optional types
                    if (field.value.type === 'Optional' && field.value.value) {
                      eventData[field.name] = field.value.value.value;
                    } else {
                      eventData[field.name] = field.value.value;
                    }
                  }
                }
              }
            } catch (decodeError) {
              this.logger.warn(`Failed to decode event payload: ${decodeError.message}`);
              continue;
            }
          }

          // Filter by address if provided
          if (filterAddress) {
            const normalizedFilterAddress = filterAddress.replace('0x', '').toLowerCase();
            const fromAddress = eventData?.from?.replace('0x', '').toLowerCase() || '';
            const toAddress = eventData?.to?.replace('0x', '').toLowerCase() || '';

            // Skip if this event doesn't involve the filter address
            if (!fromAddress.includes(normalizedFilterAddress) &&
                !toAddress.includes(normalizedFilterAddress)) {
              continue;
            }
          }

          events.push({
            type: event.type,
            transactionId: event.transaction_id,
            blockHeight: result.block_height,
            blockTimestamp: result.block_timestamp,
            eventIndex: event.event_index,
            data: eventData,
          });
        }
      }

      return events;
    } catch (error) {
      this.logger.error(`Failed to fetch events: ${eventType}`, error);
      return [];
    }
  }

  /**
   * Send FLOW tokens to another address
   */
  async sendFlowTokens(
    fromAddress: string,
    fromPrivateKey: string,
    toAddress: string,
    amount: string
  ): Promise<{ transactionId: string; status: string }> {
    // Format amount to have exactly 8 decimal places (UFix64 requirement)
    const formattedAmount = parseFloat(amount).toFixed(8);

    // Cadence 1.0 transaction to transfer FLOW tokens
    const transferTx = `
      import FungibleToken from 0x9a0766d93b6608b7
      import FlowToken from 0x7e60df042a9c0868

      transaction(amount: UFix64, to: Address) {
        let sentVault: @{FungibleToken.Vault}

        prepare(signer: auth(BorrowValue) &Account) {
          let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
          ) ?? panic("Could not borrow reference to the owner's Vault")

          self.sentVault <- vaultRef.withdraw(amount: amount)
        }

        execute {
          let recipient = getAccount(to)
          let receiverRef = recipient.capabilities
            .borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            ?? panic("Could not borrow receiver reference")

          receiverRef.deposit(from: <- self.sentVault)
        }
      }
    `;

    try {
      const authorization = this.getAuthorization(fromAddress, fromPrivateKey);

      const txId = await fcl.mutate({
        cadence: transferTx,
        args: (arg, t) => [
          arg(formattedAmount, t.UFix64),
          arg(toAddress, t.Address),
        ],
        proposer: authorization,
        payer: authorization,
        authorizations: [authorization],
        limit: 1000,
      });

      this.logger.log(`Transfer transaction submitted: ${txId}`);

      // Wait for transaction to be sealed
      const txResult = await fcl.tx(txId).onceSealed();

      if (txResult.errorMessage) {
        throw new Error(txResult.errorMessage);
      }

      return {
        transactionId: txId,
        status: txResult.status === 4 ? 'sealed' : 'pending',
      };
    } catch (error) {
      this.logger.error('Failed to send FLOW tokens', error);
      throw error;
    }
  }
}
