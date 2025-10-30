import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { FlowService } from '../flow/flow.service';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    private supabaseService: SupabaseService,
    private flowService: FlowService,
  ) {}

  async createSession(userId: string, createSessionDto: CreateSessionDto) {
    const { serviceId, fromDatetime, toDatetime } = createSessionDto;

    // Validate datetime range
    const fromDate = new Date(fromDatetime);
    const toDate = new Date(toDatetime);

    if (fromDate >= toDate) {
      throw new BadRequestException(
        'From datetime must be before to datetime',
      );
    }

    if (fromDate < new Date()) {
      throw new BadRequestException(
        'Cannot book a session in the past',
      );
    }

    try {
      // Step 1: Fetch the service and check if it exists and is available
      const { data: service, error: serviceError } =
        await this.supabaseService.chargehiveClient
          .from('services')
          .select('service_id, provider_id, status, hourly_rate, service_type')
          .eq('service_id', serviceId)
          .single();

      if (serviceError || !service) {
        this.logger.error('Service not found', serviceError);
        throw new NotFoundException('Service not found');
      }

      // Step 2: Check if service status is 'available' or 'active'
      if (service.status !== 'available' && service.status !== 'active') {
        throw new BadRequestException(
          `Service is not available for booking. Current status: ${service.status}`,
        );
      }

      // Check if this is a charger service - if so, use CHAdapter booking flow
      const isCharger = service.service_type === 'charger';
      this.logger.log(`Service type: ${service.service_type}, isCharger: ${isCharger}`);

      // Step 3: Check for overlapping sessions
      const { data: overlappingSessions, error: overlapError } =
        await this.supabaseService.chargehiveClient
          .from('sessions')
          .select('session_id, from_datetime, to_datetime')
          .eq('service_id', serviceId)
          .or(
            `and(from_datetime.lte.${toDatetime},to_datetime.gte.${fromDatetime})`,
          );

      if (overlapError) {
        this.logger.error('Failed to check overlapping sessions', overlapError);
        throw new BadRequestException(
          `Failed to check availability: ${overlapError.message}`,
        );
      }

      if (overlappingSessions && overlappingSessions.length > 0) {
        throw new BadRequestException(
          'This service is already booked for the selected time slot. Please choose a different time.',
        );
      }

      // Step 4: Calculate total amount based on hourly rate and duration
      const durationInHours =
        (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60);
      const hourlyRate = parseFloat(service.hourly_rate || '10');
      const totalAmount = (durationInHours * hourlyRate).toFixed(2);

      // Step 5: Handle charger booking with CHAdapter contract
      let adapterBookingId: string | undefined;
      let adapterTransactionId: string | undefined;

      if (isCharger) {
        try {
          // Get user's wallet address
          const { data: user, error: userError } =
            await this.supabaseService.chargehiveClient
              .from('users')
              .select('wallet_address')
              .eq('id', userId)
              .single();

          if (userError || !user || !user.wallet_address) {
            throw new BadRequestException(
              'User wallet address not found. Please set up your wallet first.',
            );
          }

          // Get adapter ID from environment variable
          const adapterId = process.env.ADAPTER_ID;

          if (!adapterId) {
            throw new BadRequestException(
              'Adapter ID not configured. Please set ADAPTER_ID in environment variables.',
            );
          }

          // Convert from_datetime to Unix timestamp (seconds)
          const scheduledTimeUnix = Math.floor(fromDate.getTime() / 1000);

          this.logger.log(
            `Creating CHAdapter booking - Adapter: ${adapterId}, User: ${user.wallet_address}, Time: ${scheduledTimeUnix}`,
          );

          // Create booking on CHAdapter contract
          const bookingResult = await this.flowService.createAdapterBooking(
            adapterId,
            user.wallet_address,
            scheduledTimeUnix,
          );

          adapterBookingId = bookingResult.bookingId;
          adapterTransactionId = bookingResult.transactionId;

          this.logger.log(
            `✓ CHAdapter booking created: ${adapterBookingId}, Tx: ${adapterTransactionId}`,
          );
        } catch (error) {
          this.logger.error('Failed to create CHAdapter booking', error);
          throw new BadRequestException(
            `Failed to create charger booking on blockchain: ${error.message}`,
          );
        }
      }

      // Step 6: Create the session in database
      const sessionData: any = {
        user_id: userId,
        provider_id: service.provider_id,
        service_id: serviceId,
        from_datetime: fromDatetime,
        to_datetime: toDatetime,
        total_amount: totalAmount,
      };

      // Only add adapter fields if they exist (for charger bookings)
      // Note: These columns may not exist in the database yet
      // if (adapterBookingId) sessionData.adapter_booking_id = adapterBookingId;
      // if (adapterTransactionId) sessionData.adapter_transaction_id = adapterTransactionId;

      const { data: session, error: sessionError } =
        await this.supabaseService.chargehiveClient
          .from('sessions')
          .insert(sessionData)
          .select()
          .single();

      if (sessionError) {
        this.logger.error('Failed to create session', sessionError);
        throw new BadRequestException(
          `Failed to create session: ${sessionError.message}`,
        );
      }

      this.logger.log(`Session created successfully: ${session.session_id}`);

      // Return response with adapter booking details for chargers
      const response: any = {
        sessionId: session.session_id,
        userId: session.user_id,
        providerId: session.provider_id,
        serviceId: session.service_id,
        fromDatetime: session.from_datetime,
        toDatetime: session.to_datetime,
        totalAmount: session.total_amount,
        createdAt: session.created_at,
      };

      // Add adapter booking details if it's a charger (from blockchain, not database)
      if (isCharger && adapterBookingId) {
        response.adapterBookingId = adapterBookingId;
        response.adapterTransactionId = adapterTransactionId;
        response.adapterId = process.env.ADAPTER_ID;
        response.message = 'Charger has been booked successfully';
        this.logger.log(`✓ Charger booking complete - Adapter Booking ID: ${adapterBookingId}`);
      }

      return response;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error('Failed to create session', error);
      throw new BadRequestException(
        `Failed to create session: ${error.message}`,
      );
    }
  }

  async getUserSessions(userId: string) {
    try {
      const { data: sessions, error } =
        await this.supabaseService.chargehiveClient
          .from('sessions')
          .select(
            `
            session_id,
            user_id,
            provider_id,
            service_id,
            from_datetime,
            to_datetime,
            total_amount,
            created_at,
            updated_at,
            services (
              service_type,
              address,
              city,
              state,
              country,
              hourly_rate
            )
          `,
          )
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

      if (error) {
        this.logger.error('Failed to fetch user sessions', error);
        throw new BadRequestException(
          `Failed to fetch sessions: ${error.message}`,
        );
      }

      return sessions.map((session) => {
        const serviceData = Array.isArray(session.services)
          ? session.services[0]
          : session.services;

        return {
          sessionId: session.session_id,
          userId: session.user_id,
          providerId: session.provider_id,
          serviceId: session.service_id,
          fromDatetime: session.from_datetime,
          toDatetime: session.to_datetime,
          totalAmount: session.total_amount,
          createdAt: session.created_at,
          updatedAt: session.updated_at,
          service: serviceData
            ? {
                serviceType: serviceData.service_type,
                address: serviceData.address,
                city: serviceData.city,
                state: serviceData.state,
                country: serviceData.country,
                hourlyRate: serviceData.hourly_rate,
              }
            : null,
        };
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Failed to fetch user sessions', error);
      throw new BadRequestException(
        `Failed to fetch sessions: ${error.message}`,
      );
    }
  }
}
