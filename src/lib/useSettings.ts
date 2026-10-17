import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { Settings } from './types';

const DEFAULT_SETTINGS: Settings = {
  id: 1,
  gtm_container_id: null,
  facebook_pixel_id: null,
  google_analytics_id: null,
  site_name: 'Dhong Ghar',
  default_shipping_inside: 60,
  default_shipping_outside: 120,
  bkash_number: null,
  bkash_type: 'personal',
  nagad_number: null,
  nagad_type: 'personal',
  payment_instructions: null,
  updated_at: new Date().toISOString(),
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data) setSettings(data as Settings);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { settings, loading, setSettings };
}
