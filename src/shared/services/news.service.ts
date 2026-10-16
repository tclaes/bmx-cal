import { supabase } from '@data/supabase';
import type { NewsArticle } from '@types';

export class NewsService {
  static async getPublishedArticles(): Promise<NewsArticle[]> {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('published', true)
      .order('published_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async getArticleBySlug(slug: string): Promise<NewsArticle | null> {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle();
    if (error) throw error;
    return data;
  }
}
