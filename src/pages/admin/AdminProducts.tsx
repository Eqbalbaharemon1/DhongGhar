import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, X, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice, slugify } from '@/lib/utils';
import type { Category, Product, ProductImage } from '@/lib/types';

type ProductWithRelations = Product & {
  category: Category | null;
  product_images: ProductImage[];
};

export function AdminProducts() {
  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<ProductWithRelations | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    supabase
      .from('products')
      .select('*, category:categories(*), product_images(*)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProducts((data as ProductWithRelations[]) ?? []);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      setCategories((data as Category[]) ?? []);
    });
  }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    await supabase.from('product_images').delete().eq('product_id', id);
    await supabase.from('products').delete().eq('id', id);
    load();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl text-[#1A1A1A] font-semibold">Products</h1>
          <p className="text-sm text-[#1A1A1A]/50 mt-1">{products.length} total products</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 bg-[#1A1A1A] text-[#FAF9F6] px-4 py-2.5 text-sm rounded-sm hover:bg-[#1A1A1A]/90 transition-colors"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full sm:max-w-sm pl-10 pr-4 py-2.5 text-sm bg-white border border-[#1A1A1A]/15 rounded-sm focus:outline-none focus:border-[#1A1A1A]"
        />
      </div>

      <div className="bg-white rounded-sm border border-[#1A1A1A]/8 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-[#1A1A1A]/40">
            <Loader2 size={20} className="inline animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-[#1A1A1A]/40">No products found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-[#1A1A1A]/50 border-b border-[#1A1A1A]/8">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]/5">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF9F6]/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-12 rounded-sm overflow-hidden bg-[#1A1A1A]/5 flex-shrink-0">
                          {p.product_images?.[0]?.image_url && (
                            <img
                              src={p.product_images[0].image_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[#1A1A1A]">{p.name}</p>
                          <p className="text-xs text-[#1A1A1A]/40">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#1A1A1A]/70">{p.category?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-[#1A1A1A]">{formatPrice(Number(p.price))}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          p.stock > 0 ? 'text-[#1A1A1A]/70' : 'text-red-600 font-medium'
                        }
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditing(p);
                            setShowForm(true);
                          }}
                          className="p-1.5 text-[#1A1A1A]/60 hover:text-[#1A1A1A] hover:bg-[#1A1A1A]/5 rounded-sm"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-[#1A1A1A]/60 hover:text-red-600 hover:bg-red-50 rounded-sm"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <ProductForm
          product={editing}
          categories={categories}
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

function ProductForm({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: ProductWithRelations | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(product?.name ?? '');
  const [categoryId, setCategoryId] = useState(product?.category_id ?? categories[0]?.id ?? '');
  const [price, setPrice] = useState(String(product?.price ?? ''));
  const [costPrice, setCostPrice] = useState(String(product?.cost_price ?? '0'));
  const [compareAt, setCompareAt] = useState(String(product?.compare_at_price ?? ''));
  const [sku, setSku] = useState(product?.sku ?? '');
  const [stock, setStock] = useState(String(product?.stock ?? '0'));
  const [description, setDescription] = useState(product?.description ?? '');
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false);
  const [isTrending, setIsTrending] = useState(product?.is_trending ?? false);
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [images, setImages] = useState<string[]>(
    product?.product_images?.map((i) => i.image_url) ?? [''],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const slug = product?.slug ?? slugify(name);
    const payload = {
      name,
      slug,
      category_id: categoryId || null,
      price: parseFloat(price) || 0,
      cost_price: parseFloat(costPrice) || 0,
      compare_at_price: compareAt ? parseFloat(compareAt) : null,
      sku: sku || null,
      stock: parseInt(stock) || 0,
      description,
      is_featured: isFeatured,
      is_trending: isTrending,
      is_active: isActive,
    };

    let productId = product?.id;

    if (product) {
      const { error } = await supabase.from('products').update(payload).eq('id', product.id);
      if (error) {
        setError(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from('products')
        .insert(payload)
        .select()
        .single();
      if (error) {
        setError(error.message);
        setSaving(false);
        return;
      }
      productId = data.id;
    }

    // Update images
    const validImages = images.filter((u) => u.trim());
    if (productId) {
      await supabase.from('product_images').delete().eq('product_id', productId);
      if (validImages.length > 0) {
        await supabase
          .from('product_images')
          .insert(
            validImages.map((url, i) => ({
              product_id: productId,
              image_url: url.trim(),
              display_order: i,
            })),
          );
      }
    }

    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FAF9F6] rounded-sm w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#FAF9F6] border-b border-[#1A1A1A]/10 px-6 py-4 flex items-center justify-between">
          <h2 className="font-serif text-xl text-[#1A1A1A] font-semibold">
            {product ? 'Edit Product' : 'Add Product'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-[#1A1A1A]/5 rounded-sm">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-5">
          <FormField label="Product Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={inputClass}
            />
          </FormField>

          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Category">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={inputClass}
              >
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="SKU">
              <input value={sku} onChange={(e) => setSku(e.target.value)} className={inputClass} />
            </FormField>
          </div>

          <div className="grid sm:grid-cols-4 gap-4">
            <FormField label="Selling Price (৳)">
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className={inputClass}
              />
            </FormField>
            <FormField label="Cost Price (৳)" hint="Buying cost for P&L">
              <input
                type="number"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Compare at (৳)">
              <input
                type="number"
                step="0.01"
                value={compareAt}
                onChange={(e) => setCompareAt(e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Stock">
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className={inputClass}
              />
            </FormField>
          </div>

          <FormField label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={inputClass}
            />
          </FormField>

          <FormField label="Image URLs">
            <div className="space-y-2">
              {images.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={url}
                    onChange={(e) => {
                      const next = [...images];
                      next[i] = e.target.value;
                      setImages(next);
                    }}
                    placeholder="https://images.pexels.com/..."
                    className={inputClass}
                  />
                  {images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                      className="p-2 text-[#1A1A1A]/50 hover:text-red-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setImages([...images, ''])}
                className="text-xs text-[#1A1A1A]/60 hover:text-[#1A1A1A] flex items-center gap-1"
              >
                <Plus size={12} /> Add another image
              </button>
            </div>
          </FormField>

          <div className="flex flex-wrap gap-5">
            <Toggle label="Featured" checked={isFeatured} onChange={setIsFeatured} />
            <Toggle label="Trending" checked={isTrending} onChange={setIsTrending} />
            <Toggle label="Active" checked={isActive} onChange={setIsActive} />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#1A1A1A] text-[#FAF9F6] py-3 text-sm rounded-sm hover:bg-[#1A1A1A]/90 disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {product ? 'Save Changes' : 'Create Product'}
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

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-[#1A1A1A]/60 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-sm text-[#1A1A1A]"
    >
      <span
        className={`w-10 h-5 rounded-full transition-colors relative ${
          checked ? 'bg-[#1A1A1A]' : 'bg-[#1A1A1A]/20'
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </span>
      {label}
    </button>
  );
}
