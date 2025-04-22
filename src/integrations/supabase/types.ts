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
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          concept_id: string
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          concept_id: string
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          concept_id?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["concept_id"]
          },
        ]
      }
      concepts: {
        Row: {
          concept_id: string
          concept_url: string
          created_at: string | null
          hearts: number
          status: string
          tshirt_asin: string
          updated_at: string | null
          votes_down: number
          votes_up: number
        }
        Insert: {
          concept_id?: string
          concept_url: string
          created_at?: string | null
          hearts?: number
          status?: string
          tshirt_asin: string
          updated_at?: string | null
          votes_down?: number
          votes_up?: number
        }
        Update: {
          concept_id?: string
          concept_url?: string
          created_at?: string | null
          hearts?: number
          status?: string
          tshirt_asin?: string
          updated_at?: string | null
          votes_down?: number
          votes_up?: number
        }
        Relationships: [
          {
            foreignKeyName: "concepts_tshirt_asin_fkey"
            columns: ["tshirt_asin"]
            isOneToOne: false
            referencedRelation: "tshirts"
            referencedColumns: ["asin"]
          },
        ]
      }
      tshirts: {
        Row: {
          ai_analysis_timestamp: string | null
          ai_copyright_check_passed: boolean | null
          ai_copyright_flag_reason: string | null
          ai_image_description: string | null
          ai_is_blank: boolean | null
          ai_is_tshirt: boolean | null
          ai_processing_status: string | null
          ai_recommendation_reason: string | null
          ai_recommended_background_color: string | null
          ai_recommended_model: string | null
          ai_suggested_tags: string[] | null
          asin: string
          avg_180_day_bsr: number | null
          avg_30_day_bsr: number | null
          avg_90_day_bsr: number | null
          brand: string | null
          buy_box_price_cents: number | null
          category_ids: number[] | null
          category_tree: Json | null
          created_at: string | null
          current_bsr: number | null
          current_new_price_cents: number | null
          current_rating: number | null
          current_review_count: number | null
          description: string | null
          fba_offer_count: number | null
          fbm_offer_count: number | null
          features: string[] | null
          generated_concept_urls: string[] | null
          generated_image_description: string | null
          is_merch_on_demand: boolean | null
          item_type_keyword: string | null
          keepa_last_update_timestamp: string | null
          listed_since_timestamp: string | null
          manufacturer: string | null
          material: string | null
          monthly_sold: number | null
          original_image_url: string | null
          pattern: string | null
          sales_rank_drops_30_day: number | null
          sales_rank_drops_90_day: number | null
          status: string
          style: string | null
          title: string | null
          total_offer_count: number | null
          updated_at: string | null
        }
        Insert: {
          ai_analysis_timestamp?: string | null
          ai_copyright_check_passed?: boolean | null
          ai_copyright_flag_reason?: string | null
          ai_image_description?: string | null
          ai_is_blank?: boolean | null
          ai_is_tshirt?: boolean | null
          ai_processing_status?: string | null
          ai_recommendation_reason?: string | null
          ai_recommended_background_color?: string | null
          ai_recommended_model?: string | null
          ai_suggested_tags?: string[] | null
          asin: string
          avg_180_day_bsr?: number | null
          avg_30_day_bsr?: number | null
          avg_90_day_bsr?: number | null
          brand?: string | null
          buy_box_price_cents?: number | null
          category_ids?: number[] | null
          category_tree?: Json | null
          created_at?: string | null
          current_bsr?: number | null
          current_new_price_cents?: number | null
          current_rating?: number | null
          current_review_count?: number | null
          description?: string | null
          fba_offer_count?: number | null
          fbm_offer_count?: number | null
          features?: string[] | null
          generated_concept_urls?: string[] | null
          generated_image_description?: string | null
          is_merch_on_demand?: boolean | null
          item_type_keyword?: string | null
          keepa_last_update_timestamp?: string | null
          listed_since_timestamp?: string | null
          manufacturer?: string | null
          material?: string | null
          monthly_sold?: number | null
          original_image_url?: string | null
          pattern?: string | null
          sales_rank_drops_30_day?: number | null
          sales_rank_drops_90_day?: number | null
          status?: string
          style?: string | null
          title?: string | null
          total_offer_count?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_analysis_timestamp?: string | null
          ai_copyright_check_passed?: boolean | null
          ai_copyright_flag_reason?: string | null
          ai_image_description?: string | null
          ai_is_blank?: boolean | null
          ai_is_tshirt?: boolean | null
          ai_processing_status?: string | null
          ai_recommendation_reason?: string | null
          ai_recommended_background_color?: string | null
          ai_recommended_model?: string | null
          ai_suggested_tags?: string[] | null
          asin?: string
          avg_180_day_bsr?: number | null
          avg_30_day_bsr?: number | null
          avg_90_day_bsr?: number | null
          brand?: string | null
          buy_box_price_cents?: number | null
          category_ids?: number[] | null
          category_tree?: Json | null
          created_at?: string | null
          current_bsr?: number | null
          current_new_price_cents?: number | null
          current_rating?: number | null
          current_review_count?: number | null
          description?: string | null
          fba_offer_count?: number | null
          fbm_offer_count?: number | null
          features?: string[] | null
          generated_concept_urls?: string[] | null
          generated_image_description?: string | null
          is_merch_on_demand?: boolean | null
          item_type_keyword?: string | null
          keepa_last_update_timestamp?: string | null
          listed_since_timestamp?: string | null
          manufacturer?: string | null
          material?: string | null
          monthly_sold?: number | null
          original_image_url?: string | null
          pattern?: string | null
          sales_rank_drops_30_day?: number | null
          sales_rank_drops_90_day?: number | null
          status?: string
          style?: string | null
          title?: string | null
          total_offer_count?: number | null
          updated_at?: string | null
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
