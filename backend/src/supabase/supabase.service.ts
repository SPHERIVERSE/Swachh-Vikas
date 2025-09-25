// src/supabase/supabase.service.ts
import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  public supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async sendOtp(phone: string) {
    return this.supabase.auth.signInWithOtp({ phone });
  }

  async verifyOtp(phone: string, token: string) {
  // Use anon client for OTP verification
  const anonClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  const { data, error } = await anonClient.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });

  if (error) throw error;

  return {
    user: data.user, // this may still be null if session not created
    session: data.session,
  };
}

  // NEW METHOD: get user from Supabase JWT token
  async getUserFromToken(token: string) {
  // Create anon client
    const anonClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
  
    const { data, error } = await anonClient.auth.getUser(token);
    if (error) throw error;
    return data.user;
  }
}

