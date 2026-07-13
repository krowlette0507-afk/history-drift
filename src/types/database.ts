// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Json = any;

export interface Database {
  public: {
    Tables: {
      interview_sessions: {
        Row: {
          id: string;
          user_id: string;
          interviewer_id: string;
          interviewer_name: string;
          started_at: string;
          completed_at: string | null;
          title: string | null;
          exchange_count: number;
          summary: Json | null;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          interviewer_id: string;
          interviewer_name: string;
          started_at: string;
          completed_at?: string | null;
          title?: string | null;
          exchange_count?: number;
          summary?: Json | null;
        };
        Update: {
          completed_at?: string | null;
          title?: string | null;
          exchange_count?: number;
          summary?: Json | null;
        };
      };
      relive_storyboards: {
        Row: {
          id: string;
          user_id: string;
          session_id: string | null;
          subject_name: string | null;
          age_stage: string;
          art_style: string;
          panel_count: number;
          title: string | null;
          subtitle: string | null;
          image_url: string | null;
          character_profile: Json | null;
          storyboard_plan: Json | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id?: string | null;
          subject_name?: string | null;
          age_stage: string;
          art_style: string;
          panel_count: number;
          title?: string | null;
          subtitle?: string | null;
          image_url?: string | null;
          character_profile?: Json | null;
          storyboard_plan?: Json | null;
          status?: string;
        };
        Update: {
          title?: string | null;
          subtitle?: string | null;
          image_url?: string | null;
          status?: string;
        };
      };
      interview_exchanges: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          phase: string;
          question: string;
          answer: string;
          memory: Json | null;
          saved_at: string;
          created_at: string;
        };
        Insert: {
          id: string;
          session_id: string;
          user_id: string;
          phase: string;
          question: string;
          answer: string;
          memory?: Json | null;
          saved_at: string;
        };
        Update: {
          memory?: Json | null;
          answer?: string;
        };
      };
    };
  };
}
