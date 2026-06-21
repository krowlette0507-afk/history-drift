export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          subject_name: string;
          subject_relationship: string | null;
          birth_year: number | null;
          birth_place: string | null;
          avatar_url: string | null;
          bio_summary: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      interviews: {
        Row: {
          id: string;
          profile_id: string;
          interviewer_id: string;
          title: string;
          status: "active" | "completed" | "paused";
          started_at: string;
          completed_at: string | null;
          duration_seconds: number | null;
        };
        Insert: Omit<Database["public"]["Tables"]["interviews"]["Row"], "id" | "started_at">;
        Update: Partial<Database["public"]["Tables"]["interviews"]["Insert"]>;
      };
      messages: {
        Row: {
          id: string;
          interview_id: string;
          role: "assistant" | "user";
          content: string;
          audio_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["messages"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
      };
      people: {
        Row: {
          id: string;
          profile_id: string;
          name: string;
          relationship: string | null;
          description: string | null;
          birth_year: number | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["people"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["people"]["Insert"]>;
      };
      places: {
        Row: {
          id: string;
          profile_id: string;
          name: string;
          place_type: string | null;
          description: string | null;
          years_lived: string | null;
          significance: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["places"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["places"]["Insert"]>;
      };
      timeline_events: {
        Row: {
          id: string;
          profile_id: string;
          year: number | null;
          date_description: string | null;
          title: string;
          description: string | null;
          category: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["timeline_events"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["timeline_events"]["Insert"]>;
      };
      life_lessons: {
        Row: {
          id: string;
          profile_id: string;
          lesson: string;
          context: string | null;
          category: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["life_lessons"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["life_lessons"]["Insert"]>;
      };
      biography_drafts: {
        Row: {
          id: string;
          profile_id: string;
          title: string;
          content: string;
          style: "narrative" | "chronological" | "thematic";
          version: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["biography_drafts"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["biography_drafts"]["Insert"]>;
      };
      legacy_documents: {
        Row: {
          id: string;
          profile_id: string;
          doc_type: "letter" | "tribute" | "wishes" | "values" | "advice";
          title: string;
          content: string;
          recipient: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["legacy_documents"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["legacy_documents"]["Insert"]>;
      };
    };
  };
}
