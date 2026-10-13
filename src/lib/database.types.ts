export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          user_id: string
        }
        ComputedFields: never
        Insert: {
          user_id: string
        }
        Update: {
          user_id?: string
        }
        Relationships: []
      }
      availability_rules: {
        Row: {
          created_at: string
          day: string
          end_time: string
          id: string
          kind: Database['public']['Enums']['availability_kind']
          repeat: Database['public']['Enums']['availability_repeat']
          start_time: string
          until_day: string | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          day: string
          end_time: string
          id?: string
          kind: Database['public']['Enums']['availability_kind']
          repeat?: Database['public']['Enums']['availability_repeat']
          start_time: string
          until_day?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          day?: string
          end_time?: string
          id?: string
          kind?: Database['public']['Enums']['availability_kind']
          repeat?: Database['public']['Enums']['availability_repeat']
          start_time?: string
          until_day?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      availability_windows: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          starts_at: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          starts_at: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          starts_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          admin_note: string | null
          baby_extension: boolean
          blocked_until: string
          client_name: string
          created_at: string
          deposit_cents: number
          email: string
          ends_at: string
          id: string
          notes: string | null
          package_code: string
          participants: string
          phone: string
          price_cents: number
          privacy_consent_at: string
          receipt_path: string
          reviewed_at: string | null
          starts_at: string
          status: Database['public']['Enums']['booking_status']
        }
        ComputedFields: never
        Insert: {
          admin_note?: string | null
          baby_extension?: boolean
          blocked_until: string
          client_name: string
          created_at?: string
          deposit_cents: number
          email: string
          ends_at: string
          id?: string
          notes?: string | null
          package_code: string
          participants: string
          phone: string
          price_cents: number
          privacy_consent_at: string
          receipt_path: string
          reviewed_at?: string | null
          starts_at: string
          status?: Database['public']['Enums']['booking_status']
        }
        Update: {
          admin_note?: string | null
          baby_extension?: boolean
          blocked_until?: string
          client_name?: string
          created_at?: string
          deposit_cents?: number
          email?: string
          ends_at?: string
          id?: string
          notes?: string | null
          package_code?: string
          participants?: string
          phone?: string
          price_cents?: number
          privacy_consent_at?: string
          receipt_path?: string
          reviewed_at?: string | null
          starts_at?: string
          status?: Database['public']['Enums']['booking_status']
        }
        Relationships: [
          {
            foreignKeyName: 'bookings_package_code_fkey'
            columns: ['package_code']
            isOneToOne: false
            referencedRelation: 'packages'
            referencedColumns: ['code']
          },
        ]
      }
      packages: {
        Row: {
          code: string
          duration_min: number
          name: string
          presale_price_cents: number
          price_cents: number
        }
        ComputedFields: never
        Insert: {
          code: string
          duration_min: number
          name: string
          presale_price_cents: number
          price_cents: number
        }
        Update: {
          code?: string
          duration_min?: number
          name?: string
          presale_price_cents?: number
          price_cents?: number
        }
        Relationships: []
      }
      profile: {
        Row: {
          about: string
          bizum: string
          email: string
          facebook: string
          full_name: string
          id: boolean
          instagram: string
          phone: string
          photo_path: string
          show_about: boolean
          tiktok: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          about?: string
          bizum?: string
          email?: string
          facebook?: string
          full_name?: string
          id?: boolean
          instagram?: string
          phone?: string
          photo_path?: string
          show_about?: boolean
          tiktok?: string
          updated_at?: string
        }
        Update: {
          about?: string
          bizum?: string
          email?: string
          facebook?: string
          full_name?: string
          id?: boolean
          instagram?: string
          phone?: string
          photo_path?: string
          show_about?: boolean
          tiktok?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      availability_day_ranges: { Args: { p_day: string }; Returns: unknown }
      availability_rule_days: {
        Args: {
          p_day: string
          p_repeat: Database['public']['Enums']['availability_repeat']
          p_until: string
        }
        Returns: string[]
      }
      cfg_baby_extra_cents: { Args: Record<PropertyKey, never>; Returns: number }
      cfg_baby_extra_min: { Args: Record<PropertyKey, never>; Returns: number }
      cfg_buffer_min: { Args: Record<PropertyKey, never>; Returns: number }
      cfg_deposit_cents: { Args: Record<PropertyKey, never>; Returns: number }
      cfg_min_notice: { Args: Record<PropertyKey, never>; Returns: string }
      cfg_presale_ends: { Args: Record<PropertyKey, never>; Returns: string }
      cfg_presale_starts: { Args: Record<PropertyKey, never>; Returns: string }
      cfg_step_min: { Args: Record<PropertyKey, never>; Returns: number }
      create_booking: {
        Args: {
          p_baby_extension: boolean
          p_client_name: string
          p_email: string
          p_notes: string
          p_package_code: string
          p_participants: string
          p_phone: string
          p_privacy_consent: boolean
          p_receipt_path: string
          p_starts_at: string
        }
        Returns: string
      }
      delete_availability_rule: { Args: { p_id: string }; Returns: undefined }
      get_availability: { Args: { p_from: string; p_to: string }; Returns: Json }
      get_public_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          about: string
          bizum: string
          email: string
          facebook: string
          full_name: string
          instagram: string
          phone: string
          photo_path: string
          show_about: boolean
          tiktok: string
        }[]
      }
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      rebuild_availability: { Args: { p_days: string[] }; Returns: undefined }
      review_booking: {
        Args: {
          p_id: string
          p_note?: string
          p_status: Database['public']['Enums']['booking_status']
        }
        Returns: undefined
      }
      save_availability_rule: {
        Args: {
          p_day: string
          p_end: string
          p_id?: string
          p_kind: Database['public']['Enums']['availability_kind']
          p_repeat: Database['public']['Enums']['availability_repeat']
          p_start: string
          p_until?: string
        }
        Returns: string
      }
    }
    Enums: {
      availability_kind: 'disponible' | 'no_disponible'
      availability_repeat: 'unico' | 'mes' | 'hasta'
      booking_status: 'pendiente' | 'aceptada' | 'rechazada'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      availability_kind: ['disponible', 'no_disponible'],
      availability_repeat: ['unico', 'mes', 'hasta'],
      booking_status: ['pendiente', 'aceptada', 'rechazada'],
    },
  },
} as const
