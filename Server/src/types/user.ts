export interface User {
    id: number;
    email: string;
    username: string;
    firstname: string;
    lastname: string;
    password: string;
    gender?: 'male' | 'female' | 'other';
    sexual_preferences?: 'male' | 'female' | 'both';
    biography?: string;
    latitude?: number;
    longitude?: number;
    fame_rating: number;
    last_connection?: Date;
    is_online: boolean;
    email_verified: boolean;
    verification_token?: string | null;
    password_reset_token?: string | null;
    password_reset_expires?: Date | null;
    birth_date?: Date;
    created_at: Date;
  }
