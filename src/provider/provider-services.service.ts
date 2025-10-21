import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@Injectable()
export class ProviderServicesService {
  constructor(private supabaseService: SupabaseService) {}

  async createService(
    providerId: string,
    providerType: string,
    latitude: number,
    longitude: number,
    image1?: MulterFile,
    image2?: MulterFile,
  ) {
    let image1Url = null;
    let image2Url = null;

    // Upload image1 to Supabase Storage
    if (image1) {
      image1Url = await this.uploadImage(providerId, image1, 'image1');
    }

    // Upload image2 to Supabase Storage
    if (image2) {
      image2Url = await this.uploadImage(providerId, image2, 'image2');
    }

    // Store service data with image URLs
    const { data, error } = await this.supabaseService.providerClient
      .from('provider_services')
      .insert([
        {
          provider_id: providerId,
          provider_type: providerType,
          latitude,
          longitude,
          image1: image1Url,
          image2: image2Url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Database error: ${error.message}`);
    }

    return data;
  }

  private async uploadImage(
    providerId: string,
    file: MulterFile,
    imageName: string,
  ): Promise<string> {
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${providerId}/${imageName}-${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage bucket 'provider-images'
    const { data, error } = await this.supabaseService.providerClient.storage
      .from('provider-images')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = this.supabaseService.providerClient.storage
      .from('provider-images')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  }

  async getServices(providerId: string) {
    const { data, error } = await this.supabaseService.providerClient
      .from('provider_services')
      .select('*')
      .eq('provider_id', providerId);

    if (error) {
      throw new BadRequestException(`Database error: ${error.message}`);
    }

    return data;
  }
}
