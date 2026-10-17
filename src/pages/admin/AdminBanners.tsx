import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Banner } from '@/lib/types';

export function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    supabase
      .from('banners')
      .select('*')
      .order('display_order')
      .then(({ data }) => {
        setBanners((data as Banner[]) ?? []);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    await supabase.from('banners').delete().eq('id', id);
    load();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl text-[#1A1A1A] font-semibold">Banners</h1>
          <p className="text-sm text-[#1A1A1A]/50 mt-1">Home page hero slider</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 bg-[#1A1A1A] text-[#FAF9F6] px-4 py-2.5 text-sm rounded-sm hover:bg-[#1A1A1A]/90"
        >
          <Plus size={16} /> Add Banner
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-sm border border-[#1A1A1A]/8 p-10 text-center text-[#1A1A1A]/40">
          <Loader2 size={20} className="inline animate-spin" />
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-sm border border-[#1A1A1A]/8 p-10 text-center text-sm text-[#1A1A1A]/40">
          No banners yet. Add your first hero banner.
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-sm border border-[#1A1A1A]/8 overflow-hidden flex flex-col sm:flex-row"
            >
              <div className="sm:w-48 h-32 sm:h-auto bg-[#1A1A1A]/5 flex-shrink-0 overflow-hidden">
                <img src={b.image_url} alt={b.title} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 p-4 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-[#1A1A1A]">{b.title}</h3>
                    {b.subtitle && (
                      <p className="text-xs text-[#1A1A1A]/50 mt-1">{b.subtitle}</p>
                    )}
                    {b.link_url && (
                      <p className="text-xs text-[#1A1A1A]/40 mt-2">Links to: {b.link_url}</p>
                    )}
                  </div>
                  <span
                    className={`text-[0.65rem] px-2 py-0.5 rounded-full flex-shrink-0 ${
                      b.is_active
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {b.is_active ? 'Active' : 'Hidden'}
                  </span>
                </div>
                <div className="mt-auto pt-3 flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(b);
                      setShowForm(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs border border-[#1A1A1A]/15 text-[#1A1A1A] px-3 py-1.5 rounded-sm hover:bg-[#1A1A1A]/5"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="p-1.5 text-[#1A1A1A]/50 hover:text-red-600 hover:bg-red-50 rounded-sm"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <BannerForm
          banner={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function BannerForm({
  banner,
  onClose,
  onSaved,
}: {
  banner: Banner | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(banner?.title ?? '');
  const [subtitle, setSubtitle] = useState(banner?.subtitle ?? '');
  const [imageUrl, setImageUrl] = useState(banner?.image_url ?? '');
  const [linkUrl, setLinkUrl] = useState(banner?.link_url ?? '');
  const [displayOrder, setDisplayOrder] = useState(String(banner?.display_order ?? '0'));
  const [isActive, setIsActive] = useState(banner?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      title,
      subtitle: subtitle || null,
      image_url: imageUrl,
      link_url: linkUrl || null,
      display_order: parseInt(displayOrder) || 0,
      is_active: isActive,
    };

    if (banner) {
      const { error } = await supabase.from('banners').update(payload).eq('id', banner.id);
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.from('banners').insert(payload);
      if (error) setError(error.message);
    }

    setSaving(false);
    if (!error) onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-[#FAF9F6] rounded-sm w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#FAF9F6] border-b border-[#1A1A1A]/10 px-6 py-4 flex items-center justify-between">
          <h2 className="font-serif text-xl text-[#1A1A1A] font-semibold">
            {banner ? 'Edit Banner' : 'Add Banner'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-[#1A1A1A]/5 rounded-sm">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs text-[#1A1A1A]/60 mb-1.5">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-[#1A1A1A]/60 mb-1.5">Subtitle</label>
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-[#1A1A1A]/60 mb-1.5">Image URL</label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              required
              placeholder="https://..."
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-[#1A1A1A]/60 mb-1.5">Link URL (optional)</label>
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="/shop or /category/saree"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-[#1A1A1A]/60 mb-1.5">Display Order</label>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              className={inputClass}
            />
          </div>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className="flex items-center gap-2 text-sm text-[#1A1A1A]"
          >
            <span
              className={`w-10 h-5 rounded-full transition-colors relative ${
                isActive ? 'bg-[#1A1A1A]' : 'bg-[#1A1A1A]/20'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  isActive ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </span>
            Active
          </button>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#1A1A1A] text-[#FAF9F6] py-3 text-sm rounded-sm hover:bg-[#1A1A1A]/90 disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {banner ? 'Save' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 border border-[#1A1A1A]/20 text-[#1A1A1A] py-3 text-sm rounded-sm hover:bg-[#1A1A1A]/5"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  'w-full px-3 py-2.5 text-sm bg-white border border-[#1A1A1A]/15 rounded-sm focus:outline-none focus:border-[#1A1A1A]';
