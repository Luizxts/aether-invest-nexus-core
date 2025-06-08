export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_evolution: {
        Row: {
          ai_level: number
          created_at: string
          evolution_stage: string
          experience_points: number
          id: string
          successful_trades: number
          total_profit: number
          total_trades: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_level?: number
          created_at?: string
          evolution_stage?: string
          experience_points?: number
          id?: string
          successful_trades?: number
          total_profit?: number
          total_trades?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_level?: number
          created_at?: string
          evolution_stage?: string
          experience_points?: number
          id?: string
          successful_trades?: number
          total_profit?: number
          total_trades?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_data: {
        Row: {
          daily_pnl: number
          id: string
          last_updated: string
          total_balance: number
          user_id: string
        }
        Insert: {
          daily_pnl?: number
          id?: string
          last_updated?: string
          total_balance?: number
          user_id: string
        }
        Update: {
          daily_pnl?: number
          id?: string
          last_updated?: string
          total_balance?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          has_seen_tutorial: boolean
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          has_seen_tutorial?: boolean
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          has_seen_tutorial?: boolean
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      risk_settings: {
        Row: {
          ai_level: number
          created_at: string
          id: string
          is_trading_active: boolean
          max_daily_loss: number
          max_risk_per_trade: number
          stop_loss_enabled: boolean
          trading_mode: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_level?: number
          created_at?: string
          id?: string
          is_trading_active?: boolean
          max_daily_loss?: number
          max_risk_per_trade?: number
          stop_loss_enabled?: boolean
          trading_mode?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_level?: number
          created_at?: string
          id?: string
          is_trading_active?: boolean
          max_daily_loss?: number
          max_risk_per_trade?: number
          stop_loss_enabled?: boolean
          trading_mode?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trading_operations: {
        Row: {
          binance_order_id: string | null
          created_at: string
          fees: number | null
          id: string
          operation_type: string
          price: number
          quantity: number
          status: string
          symbol: string
          total_value: number
          user_id: string
        }
        Insert: {
          binance_order_id?: string | null
          created_at?: string
          fees?: number | null
          id?: string
          operation_type: string
          price: number
          quantity: number
          status?: string
          symbol: string
          total_value: number
          user_id: string
        }
        Update: {
          binance_order_id?: string | null
          created_at?: string
          fees?: number | null
          id?: string
          operation_type?: string
          price?: number
          quantity?: number
          status?: string
          symbol?: string
          total_value?: number
          user_id?: string
        }
        Relationships: []
      }
      user_binance_credentials: {
        Row: {
          api_key_encrypted: string
          created_at: string
          id: string
          is_active: boolean
          secret_key_encrypted: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_encrypted: string
          created_at?: string
          id?: string
          is_active?: boolean
          secret_key_encrypted: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_encrypted?: string
          created_at?: string
          id?: string
          is_active?: boolean
          secret_key_encrypted?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
