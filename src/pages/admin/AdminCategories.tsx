import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { slugify } from '@/lib/utils';
import type { Category } from '@/lib/types';

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    supabase
      .from('categories')
      .select('*')
      .order('display_order')
      .then(({ data }) => {
        setCategories((data as Category[]) ?? []);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? Products will become uncategorized.')) return;
    await supabase.from('categories').delete().eq('id', id);
    load();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl text-[#1A1A1A] font-semibold">Categories</h1>
          <p className="text-sm text-[#1A1A1A]/50 mt-1">{categories.length} categories</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 bg-[#1A1A1A] text-[#FAF9F6] px-4 py-2.5 text-sm rounded-sm hover:bg-[#1A1A1A]/90"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-sm border border-[#1A1A1A]/8 p-10 text-center text-[#1A1A1A]/40">
          <Loader2 size={20} className="inline animate-spin" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-sm border border-[#1A1A1A]/8 overflow-hidden group"
            >
              <div className="aspect-[3/2] bg-[#1A1A1A]/5 overflow-hidden">
                {c.image_url && (
                  <img src={c.image_url} alt={c.name} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-[#1A1A1A]">{c.name}</h3>
                    <p className="text-xs text-[#1A1A1A]/40 mt-0.5">/{c.slug}</p>
                  </div>
                  <span
                    className={`text-[0.65rem] px-2 py-0.5 rounded-full ${
                      c.is_active
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {c.is_active ? 'Active' : 'Hidden'}
                  </span>
                </div>
                {c.description && (
                  <p className="mt-2 text-xs text-[#1A1A1A]/60 line-clamp-2">{c.description}</p>
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(c);
                      setShowForm(true);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs border border-[#1A1A1A]/15 text-[#1A1A1A] py-2 rounded-sm hover:bg-[#1A1A1A]/5"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-2 text-[#1A1A1A]/50 hover:text-red-600 hover:bg-red-50 rounded-sm"
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
        <CategoryForm
          category={editing}
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

function CategoryForm({
  category,
  onClose,
  onSaved,
}: {
  category: Category | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(category?.name ?? '');
  const [description, setDescription] = useState(category?.description ?? '');
  const [imageUrl, setImageUrl] = useState(category?.image_url ?? '');
  const [displayOrder, setDisplayOrder] = useState(String(category?.display_order ?? '0'));
  const [isActive, setIsActive] = useState(category?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const slug = category?.slug ?? slugify(name);
    const payload = {
      name,
      slug,
      description: description || null,
      image_url: imageUrl || null,
      display_order: parseInt(displayOrder) || 0,
      is_active: isActive,
    };

    if (category) {
      const { error } = await supabase.from('categories').update(payload).eq('id', category.id);
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.from('categories').insert(payload);
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
            {category ? 'Edit Category' : 'Add Category'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-[#1A1A1A]/5 rounded-sm">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs text-[#1A1A1A]/60 mb-1.5">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2.5 text-sm bg-white border border-[#1A1A1A]/15 rounded-sm focus:outline-none focus:border-[#1A1A1A]"
            />
          </div>
          <div>
            <label className="block text-xs text-[#1A1A1A]/60 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 text-sm bg-white border border-[#1A1A1A]/15 rounded-sm focus:outline-none focus:border-[#1A1A1A]"
            />
          </div>
          <div>
            <label className="block text-xs text-[#1A1A1A]/60 mb-1.5">Image URL</label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2.5 text-sm bg-white border border-[#1A1A1A]/15 rounded-sm focus:outline-none focus:border-[#1A1A1A]"
            />
          </div>
          <div>
            <label className="block text-xs text-[#1A1A1A]/60 mb-1.5">Display Order</label>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-white border border-[#1A1A1A]/15 rounded-sm focus:outline-none focus:border-[#1A1A1A]"
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
              {category ? 'Save' : 'Create'}
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
