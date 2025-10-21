import {
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserGuard } from '../auth/guards/user.guard';
import { CreateSessionDto } from './dto/create-session.dto';

@ApiTags('Sessions')
@ApiBearerAuth('JWT-auth')
@Controller('sessions')
@UseGuards(JwtAuthGuard, UserGuard)
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Post('book')
  @ApiOperation({
    summary: 'Book a new session',
    description:
      'Book a parking or charging session. Checks for availability, overlapping bookings, and calculates total amount based on hourly rate.',
  })
  @ApiBody({ type: CreateSessionDto })
  @ApiResponse({
    status: 201,
    description: 'Session booked successfully',
    schema: {
      example: {
        success: true,
        message: 'Session booked successfully',
        data: {
          sessionId: 'uuid',
          userId: 'uuid',
          providerId: 'uuid',
          serviceId: 'uuid',
          fromDatetime: '2025-10-21T10:00:00Z',
          toDatetime: '2025-10-21T12:00:00Z',
          totalAmount: '30.00',
          createdAt: '2025-10-21T09:00:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - Service unavailable, time overlap, or validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found',
  })
  async bookSession(@Request() req: any, @Body() createSessionDto: CreateSessionDto) {
    const session = await this.sessionsService.createSession(
      req.user.id,
      createSessionDto,
    );

    return {
      success: true,
      message: 'Session booked successfully',
      data: session,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all user sessions',
    description:
      'Retrieve all sessions booked by the authenticated user, including service details.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sessions retrieved successfully',
    schema: {
      example: {
        success: true,
        data: [
          {
            sessionId: 'uuid',
            userId: 'uuid',
            providerId: 'uuid',
            serviceId: 'uuid',
            fromDatetime: '2025-10-21T10:00:00Z',
            toDatetime: '2025-10-21T12:00:00Z',
            totalAmount: '30.00',
            createdAt: '2025-10-21T09:00:00Z',
            updatedAt: '2025-10-21T09:00:00Z',
            service: {
              serviceType: 'parking',
              address: '123 Main St',
              city: 'San Francisco',
              state: 'CA',
              country: 'USA',
              hourlyRate: '15',
            },
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getUserSessions(@Request() req: any) {
    const sessions = await this.sessionsService.getUserSessions(req.user.id);

    return {
      success: true,
      data: sessions,
    };
  }
}
