export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      body_annotations: {
        Row: {
          body_part: Database["public"]["Enums"]["body_part"] | null
          created_at: string | null
          entry_id: string
          id: string
          intensity: number | null
          muscle_asset_id: string | null
          note: string | null
          pose_id: string | null
          sensation: Database["public"]["Enums"]["sensation_type"]
          side: string | null
          soreness_recorded_at: string | null
          user_id: string
        }
        Insert: {
          body_part?: Database["public"]["Enums"]["body_part"] | null
          created_at?: string | null
          entry_id: string
          id?: string
          intensity?: number | null
          muscle_asset_id?: string | null
          note?: string | null
          pose_id?: string | null
          sensation?: Database["public"]["Enums"]["sensation_type"]
          side?: string | null
          soreness_recorded_at?: string | null
          user_id: string
        }
        Update: {
          body_part?: Database["public"]["Enums"]["body_part"] | null
          created_at?: string | null
          entry_id?: string
          id?: string
          intensity?: number | null
          muscle_asset_id?: string | null
          note?: string | null
          pose_id?: string | null
          sensation?: Database["public"]["Enums"]["sensation_type"]
          side?: string | null
          soreness_recorded_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "body_annotations_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "diary_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "body_annotations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      diary_entries: {
        Row: {
          activation_note: string | null
          activity_name: string | null
          activity_type: Database["public"]["Enums"]["activity_type"]
          calories: number | null
          content: string | null
          created_at: string | null
          custom_pose_names: string[]
          duration_minutes: number | null
          id: string
          intensity: number | null
          is_favorite: boolean | null
          overall_feeling: number | null
          photo_urls: string[] | null
          pose_ids: string[]
          practice_session_id: string
          sensation_coord: Json | null
          sensation_words: string[] | null
          session_number: number | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          voice_url: string | null
        }
        Insert: {
          activation_note?: string | null
          activity_name?: string | null
          activity_type?: Database["public"]["Enums"]["activity_type"]
          calories?: number | null
          content?: string | null
          created_at?: string | null
          custom_pose_names?: string[]
          duration_minutes?: number | null
          id?: string
          intensity?: number | null
          is_favorite?: boolean | null
          overall_feeling?: number | null
          photo_urls?: string[] | null
          pose_ids?: string[]
          practice_session_id: string
          sensation_coord?: Json | null
          sensation_words?: string[] | null
          session_number?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          voice_url?: string | null
        }
        Update: {
          activation_note?: string | null
          activity_name?: string | null
          activity_type?: Database["public"]["Enums"]["activity_type"]
          calories?: number | null
          content?: string | null
          created_at?: string | null
          custom_pose_names?: string[]
          duration_minutes?: number | null
          id?: string
          intensity?: number | null
          is_favorite?: boolean | null
          overall_feeling?: number | null
          photo_urls?: string[] | null
          pose_ids?: string[]
          practice_session_id?: string
          sensation_coord?: Json | null
          sensation_words?: string[] | null
          session_number?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          voice_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diary_entries_practice_session_id_fkey"
            columns: ["practice_session_id"]
            isOneToOne: false
            referencedRelation: "practice_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diary_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_cards: {
        Row: {
          body_parts: Database["public"]["Enums"]["body_part"][] | null
          category: Database["public"]["Enums"]["knowledge_category"]
          content: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string | null
          difficulty: number | null
          embedding: string | null
          id: string
          is_builtin: boolean | null
          media_url: string | null
          summary: string | null
          tags: string[] | null
          title: string
        }
        Insert: {
          body_parts?: Database["public"]["Enums"]["body_part"][] | null
          category: Database["public"]["Enums"]["knowledge_category"]
          content: string
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string | null
          difficulty?: number | null
          embedding?: string | null
          id?: string
          is_builtin?: boolean | null
          media_url?: string | null
          summary?: string | null
          tags?: string[] | null
          title: string
        }
        Update: {
          body_parts?: Database["public"]["Enums"]["body_part"][] | null
          category?: Database["public"]["Enums"]["knowledge_category"]
          content?: string
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string | null
          difficulty?: number | null
          embedding?: string | null
          id?: string
          is_builtin?: boolean | null
          media_url?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string
        }
        Relationships: []
      }
      practice_sessions: {
        Row: {
          activity_name: string | null
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at: string
          custom_pose_names: string[]
          id: string
          pose_ids: string[]
          practice_number: number
          practiced_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_name?: string | null
          activity_type?: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          custom_pose_names?: string[]
          id?: string
          pose_ids?: string[]
          practice_number: number
          practiced_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_name?: string | null
          activity_type?: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          custom_pose_names?: string[]
          id?: string
          pose_ids?: string[]
          practice_number?: number
          practiced_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          llm_api_key: string | null
          llm_base_url: string | null
          llm_model: string | null
          llm_provider: string | null
          nickname: string | null
          updated_at: string | null
          wechat_openid: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id: string
          llm_api_key?: string | null
          llm_base_url?: string | null
          llm_model?: string | null
          llm_provider?: string | null
          nickname?: string | null
          updated_at?: string | null
          wechat_openid?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          llm_api_key?: string | null
          llm_base_url?: string | null
          llm_model?: string | null
          llm_provider?: string | null
          nickname?: string | null
          updated_at?: string | null
          wechat_openid?: string | null
        }
        Relationships: []
      }
      user_materials: {
        Row: {
          body_parts: Database["public"]["Enums"]["body_part"][] | null
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          is_embedded: boolean | null
          source: Database["public"]["Enums"]["material_source"]
          source_url: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          body_parts?: Database["public"]["Enums"]["body_part"][] | null
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          is_embedded?: boolean | null
          source?: Database["public"]["Enums"]["material_source"]
          source_url?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          body_parts?: Database["public"]["Enums"]["body_part"][] | null
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          is_embedded?: boolean | null
          source?: Database["public"]["Enums"]["material_source"]
          source_url?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_materials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_poses: {
        Row: {
          activation_cue: string | null
          activity_type: Database["public"]["Enums"]["activity_type"]
          compensation: string | null
          created_at: string
          family: string | null
          id: string
          image_url: string | null
          main_muscle_ids: string[]
          name_en: string | null
          name_zh: string
          sensation_words: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          activation_cue?: string | null
          activity_type?: Database["public"]["Enums"]["activity_type"]
          compensation?: string | null
          created_at?: string
          family?: string | null
          id?: string
          image_url?: string | null
          main_muscle_ids?: string[]
          name_en?: string | null
          name_zh: string
          sensation_words?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          activation_cue?: string | null
          activity_type?: Database["public"]["Enums"]["activity_type"]
          compensation?: string | null
          created_at?: string
          family?: string | null
          id?: string
          image_url?: string | null
          main_muscle_ids?: string[]
          name_en?: string | null
          name_zh?: string
          sensation_words?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_poses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      next_practice_number: { Args: { p_user_id: string }; Returns: number }
      next_session_number: { Args: { p_user_id: string }; Returns: number }
      search_knowledge: {
        Args: {
          match_count?: number
          match_user_id: string
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          similarity: number
          source_type: string
          title: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      activity_type:
        | "yoga_mat"
        | "ballet"
        | "swimming"
        | "strength"
        | "running"
        | "cycling"
        | "hiking"
        | "rehabilitation"
        | "other"
      body_part:
        | "head"
        | "neck"
        | "left_shoulder"
        | "right_shoulder"
        | "left_chest"
        | "right_chest"
        | "left_upper_arm"
        | "right_upper_arm"
        | "left_forearm"
        | "right_forearm"
        | "left_hand"
        | "right_hand"
        | "abdomen_upper"
        | "abdomen_lower"
        | "upper_back"
        | "middle_back"
        | "lower_back"
        | "left_oblique"
        | "right_oblique"
        | "left_hip"
        | "right_hip"
        | "left_glute"
        | "right_glute"
        | "left_quadricep"
        | "right_quadricep"
        | "left_hamstring"
        | "right_hamstring"
        | "left_inner_thigh"
        | "right_inner_thigh"
        | "left_knee"
        | "right_knee"
        | "left_calf"
        | "right_calf"
        | "left_shin"
        | "right_shin"
        | "left_ankle"
        | "right_ankle"
        | "left_foot"
        | "right_foot"
      content_type: "text_card" | "video" | "infographic" | "guided_practice"
      knowledge_category:
        | "body_awareness"
        | "meditation"
        | "muscle_anatomy"
        | "movement_pattern"
        | "recovery"
        | "breathing"
        | "mindfulness"
      material_source: "text_input" | "url_import" | "file_upload" | "clipboard"
      sensation_type:
        | "soreness"
        | "tightness"
        | "pain"
        | "fatigue"
        | "pump"
        | "stretch"
        | "numbness"
        | "warmth"
        | "weakness"
        | "strength"
        | "relaxation"
        | "other"
        | "swell"
        | "none"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_type: [
        "yoga_mat",
        "ballet",
        "swimming",
        "strength",
        "running",
        "cycling",
        "hiking",
        "rehabilitation",
        "other",
      ],
      body_part: [
        "head",
        "neck",
        "left_shoulder",
        "right_shoulder",
        "left_chest",
        "right_chest",
        "left_upper_arm",
        "right_upper_arm",
        "left_forearm",
        "right_forearm",
        "left_hand",
        "right_hand",
        "abdomen_upper",
        "abdomen_lower",
        "upper_back",
        "middle_back",
        "lower_back",
        "left_oblique",
        "right_oblique",
        "left_hip",
        "right_hip",
        "left_glute",
        "right_glute",
        "left_quadricep",
        "right_quadricep",
        "left_hamstring",
        "right_hamstring",
        "left_inner_thigh",
        "right_inner_thigh",
        "left_knee",
        "right_knee",
        "left_calf",
        "right_calf",
        "left_shin",
        "right_shin",
        "left_ankle",
        "right_ankle",
        "left_foot",
        "right_foot",
      ],
      content_type: ["text_card", "video", "infographic", "guided_practice"],
      knowledge_category: [
        "body_awareness",
        "meditation",
        "muscle_anatomy",
        "movement_pattern",
        "recovery",
        "breathing",
        "mindfulness",
      ],
      material_source: ["text_input", "url_import", "file_upload", "clipboard"],
      sensation_type: [
        "soreness",
        "tightness",
        "pain",
        "fatigue",
        "pump",
        "stretch",
        "numbness",
        "warmth",
        "weakness",
        "strength",
        "relaxation",
        "other",
        "swell",
        "none",
      ],
    },
  },
} as const

