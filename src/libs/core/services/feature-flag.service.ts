import { supabase } from '@data';
import type { FeatureFlag } from '@types';

export class FeatureFlagService {
  static async getAll(): Promise<FeatureFlag[]> {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('key');
    if (error) throw error;
    return (data ?? []) as FeatureFlag[];
  }

  /** Admins only: RLS rejects the write for anyone else. */
  static async setFlag(key: string, enabled: boolean): Promise<FeatureFlag> {
    const { data, error } = await supabase
      .from('feature_flags')
      .update({ enabled })
      .eq('key', key)
      .select()
      .single();
    if (error) throw error;
    return data as FeatureFlag;
  }
}
