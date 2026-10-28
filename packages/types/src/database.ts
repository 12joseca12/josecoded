// PLACEHOLDER: replace by running `pnpm --filter @josecoded/types db:types` (needs `supabase start`).
// Same shape as the output of `supabase gen types typescript --local`, with no tables yet.
// TODO(1.6 dump): generate for real after baseline.sql exists and `supabase db reset` works.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: { [_ in never]: never };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
