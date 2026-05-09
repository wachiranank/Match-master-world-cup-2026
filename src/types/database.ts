export type MatchStage = 'group_stage' | 'r32' | 'r16' | 'qf' | 'sf' | 'third_place' | 'final';
export type MatchStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string;
          name_th: string;
          name_en: string;
          flag_url: string | null;
          group_name: string | null;
          confederation: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['teams']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['teams']['Insert']>;
      };
      matches: {
        Row: {
          id: string;
          home_team_id: string | null;
          away_team_id: string | null;
          stage_key: MatchStage;
          kick_off: string;
          venue_th: string | null;
          venue_en: string | null;
          status: MatchStatus;
          home_score: number | null;
          away_score: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['matches']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['matches']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          preferred_lang: 'th' | 'en';
          total_points: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      champion_picks: {
        Row: {
          id: string;
          user_id: string;
          team_id: string;
          picked_at: string;
          is_correct: boolean | null;
        };
        Insert: Omit<Database['public']['Tables']['champion_picks']['Row'], 'id' | 'picked_at'>;
        Update: Partial<Database['public']['Tables']['champion_picks']['Insert']>;
      };
      predictions: {
        Row: {
          id: string;
          user_id: string;
          match_id: string;
          predicted_home: number;
          predicted_away: number;
          points_result: number;
          points_score: number;
          multiplier: number;
          total_points: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['predictions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['predictions']['Insert']>;
      };
      stage_multipliers: {
        Row: { stage_key: MatchStage; multiplier: number };
        Insert: Database['public']['Tables']['stage_multipliers']['Row'];
        Update: Partial<Database['public']['Tables']['stage_multipliers']['Row']>;
      };
    };
    Views: {
      leaderboard: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          total_points: number;
          rank: number;
          prediction_count: number;
          correct_count: number;
          champion_team_id: string | null;
        };
      };
    };
  };
}
