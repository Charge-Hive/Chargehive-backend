import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ServicesService {
  constructor(private supabaseService: SupabaseService) {}

  async getAllAvailableServices() {
    // Get all services (removed status filter to show all services)
    const { data, error} = await this.supabaseService.providerClient
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(`Database error: ${error.message}`);
    }

    console.log(`📊 Found ${data?.length || 0} services in database`);
    console.log('Services statuses:', data?.map(s => ({ id: s.service_id.substring(0, 8), status: s.status })));

    // Transform the data to match the frontend expected format
    return data.map((service) => ({
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
      hourlyRate: service.hourly_rate,
      description: service.description,
      image1: service.image1,
      image2: service.image2,
      image3: service.image3,
      createdAt: service.created_at,
    }));
  }
}
