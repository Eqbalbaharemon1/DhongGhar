import { useState, type FormEvent } from 'react';
import { Save, Loader2, Check, BarChart3, Truck, Store, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/lib/useSettings';
import type { Settings } from '@/lib/types';

export function AdminSettings() {
  const { settings, setSettings } = useSettings();
  const [form, setForm] = useState<Settings>(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [synced, setSynced] = useState(false);

  if (!synced && settings.updated_at !== form.updated_at) {
    setForm(settings);
    setSynced(true);
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      gtm_container_id: form.gtm_container_id || null,
      facebook_pixel_id: form.facebook_pixel_id || null,
      google_analytics_id: form.google_analytics_id || null,
      site_name: form.site_name,
      default_shipping_inside: Number(form.default_shipping_inside) || 0,
      default_shipping_outside: Number(form.default_shipping_outside) || 0,
      bkash_number: form.bkash_number || null,
      bkash_type: form.bkash_type || 'personal',
      nagad_number: form.nagad_number || null,
      nagad_type: form.nagad_type || 'personal',
      payment_instructions: form.payment_instructions || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('settings').update(payload).eq('id', 1);
    setSaving(false);
    if (error) {
      setError(error.message);
    } else {
      setSettings({ ...form, ...payload } as Settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-[#1A1A1A] font-semibold">Settings</h1>
        <p className="text-sm text-[#1A1A1A]/50 mt-1">Configure your store and analytics tracking.</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <Section icon={Store} title="General">
          <Field label="Site Name">
            <input
              value={form.site_name}
              onChange={(e) => setForm({ ...form, site_name: e.target.value })}
              className={inputClass}
            />
          </Field>
        </Section>

        <Section icon={BarChart3} title="Analytics & Tracking">
          <p className="text-xs text-[#1A1A1A]/50 -mt-1 mb-4">
            Enter your tracking IDs and they will be automatically embedded across your store. Leave
            blank to disable.
          </p>
          <div className="space-y-4">
            <Field label="Google Tag Manager (GTM) Container ID" hint="e.g. GTM-XXXXXXX">
              <input
                value={form.gtm_container_id ?? ''}
                onChange={(e) => setForm({ ...form, gtm_container_id: e.target.value })}
                placeholder="GTM-XXXXXXX"
                className={inputClass}
              />
            </Field>
            <Field label="Facebook Pixel ID" hint="e.g. 123456789012345">
              <input
                value={form.facebook_pixel_id ?? ''}
                onChange={(e) => setForm({ ...form, facebook_pixel_id: e.target.value })}
                placeholder="123456789012345"
                className={inputClass}
              />
            </Field>
            <Field label="Google Analytics Tracking ID" hint="e.g. G-XXXXXXXXXX or UA-XXXXXXXX-X">
              <input
                value={form.google_analytics_id ?? ''}
                onChange={(e) => setForm({ ...form, google_analytics_id: e.target.value })}
                placeholder="G-XXXXXXXXXX"
                className={inputClass}
              />
            </Field>
          </div>
          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-sm p-3 text-xs text-blue-700">
            Events tracked automatically: <strong>ViewContent</strong> (product page),{' '}
            <strong>AddToCart</strong>, <strong>InitiateCheckout</strong>, and{' '}
            <strong>Purchase</strong> (thank-you page).
          </div>
        </Section>

        <Section icon={Truck} title="Shipping Costs">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Inside Dhaka (৳)">
              <input
                type="number"
                step="0.01"
                value={form.default_shipping_inside}
                onChange={(e) =>
                  setForm({ ...form, default_shipping_inside: parseFloat(e.target.value) || 0 })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Outside Dhaka (৳)">
              <input
                type="number"
                step="0.01"
                value={form.default_shipping_outside}
                onChange={(e) =>
                  setForm({ ...form, default_shipping_outside: parseFloat(e.target.value) || 0 })
                }
                className={inputClass}
              />
            </Field>
          </div>
        </Section>

        <Section icon={CreditCard} title="Mobile Payment (bKash / Nagad)">
          <p className="text-xs text-[#1A1A1A]/50 -mt-1 mb-4">
            Configure the numbers and instructions shown at checkout when a customer selects bKash or Nagad.
          </p>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="bKash Number" hint="e.g. 01XXXXXXXXX">
                <input
                  value={form.bkash_number ?? ''}
                  onChange={(e) => setForm({ ...form, bkash_number: e.target.value })}
                  placeholder="01XXXXXXXXX"
                  className={inputClass}
                />
              </Field>
              <Field label="bKash Account Type">
                <select
                  value={form.bkash_type ?? 'personal'}
                  onChange={(e) => setForm({ ...form, bkash_type: e.target.value as 'personal' | 'merchant' })}
                  className={inputClass}
                >
                  <option value="personal">Personal</option>
                  <option value="merchant">Merchant</option>
                </select>
              </Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nagad Number" hint="e.g. 01XXXXXXXXX">
                <input
                  value={form.nagad_number ?? ''}
                  onChange={(e) => setForm({ ...form, nagad_number: e.target.value })}
                  placeholder="01XXXXXXXXX"
                  className={inputClass}
                />
              </Field>
              <Field label="Nagad Account Type">
                <select
                  value={form.nagad_type ?? 'personal'}
                  onChange={(e) => setForm({ ...form, nagad_type: e.target.value as 'personal' | 'merchant' })}
                  className={inputClass}
                >
                  <option value="personal">Personal</option>
                  <option value="merchant">Merchant</option>
                </select>
              </Field>
            </div>
            <Field label="Payment Instructions" hint="Shown to customers after they choose bKash/Nagad at checkout">
              <textarea
                value={form.payment_instructions ?? ''}
                onChange={(e) => setForm({ ...form, payment_instructions: e.target.value })}
                placeholder="Send money to the number above, then enter your Sender Phone Number and Transaction ID (TrxID) below."
                rows={3}
                className={inputClass}
              />
            </Field>
          </div>
        </Section>

        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[#1A1A1A] text-[#FAF9F6] px-6 py-3 text-sm rounded-sm hover:bg-[#1A1A1A]/90 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  'w-full px-3 py-2.5 text-sm bg-white border border-[#1A1A1A]/15 rounded-sm focus:outline-none focus:border-[#1A1A1A]';

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Store;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-sm border border-[#1A1A1A]/8 p-5">
      <h2 className="text-sm font-medium text-[#1A1A1A] flex items-center gap-2 mb-4">
        <Icon size={16} /> {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs text-[#1A1A1A]/60 mb-1.5">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-[#1A1A1A]/40">{hint}</p>}
    </div>
  );
}
