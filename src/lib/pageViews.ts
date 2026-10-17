import { supabase } from './supabase';

const VISITOR_KEY = 'dhong_visitor_id';

function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export function trackPageView(path: string, productId?: string) {
  try {
    supabase.from('page_views').insert({
      page_path: path,
      product_id: productId ?? null,
      visitor_id: getVisitorId(),
    }).then(() => {});
  } catch {
    // silent fail — analytics should never break the page
  }
}
