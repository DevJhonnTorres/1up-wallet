import { usePrivy } from '@privy-io/react-auth';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { useProductCreation } from '../../hooks/useProductCreation';
import { GenderOption, ProductFormData, SizeOption } from '../../types/swag';

const SIZES: SizeOption[] = ['S', 'M', 'L', 'XL', 'NA'];
const GENDERS: GenderOption[] = ['Male', 'Female', 'Unisex'];

export function AdminProductForm() {
  const { user } = usePrivy();
  const { createProduct, isLoading, progress, currentStep, error } = useProductCreation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormData>({
    name: '',
    description: '',
    imageUri: '',
    price: 0,
    totalSupply: 0,
    traits: { gender: 'Unisex', color: '', style: '' },
    sizes: [],
  });

  const supplyPerSize = form.sizes.length ? Math.floor(form.totalSupply / form.sizes.length) : 0;

  // Handle image file selection and upload to IPFS
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);

      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(file);
      });

      // Upload to IPFS
      const response = await fetch('/api/pinata/pin-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: base64, fileName: file.name }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const { uri, gateway } = await response.json();
      setForm({ ...form, imageUri: uri });
      setImagePreview(gateway); // Use gateway URL for preview
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err instanceof Error ? err.message : 'Failed to upload image');
      setImagePreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSizeToggle = (size: SizeOption) => {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((value) => value !== size)
        : [...prev.sizes, size],
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.sizes.length) {
      alert('Please select at least one size.');
      return;
    }

    if (!form.imageUri) {
      alert('Provide an IPFS or HTTPS image URI.');
      return;
    }

    try {
      await createProduct(form);
      alert('Product created!');
      setForm({
        name: '',
        description: '',
        imageUri: '',
        price: 0,
        totalSupply: 0,
        traits: { gender: 'Unisex', color: '', style: '' },
        sizes: [],
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/5 p-4 text-yellow-200">
        Connect a wallet to create products.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-slate-500">Admin Panel</p>
        <h2 className="text-2xl font-semibold text-white">Create Swag Product</h2>
        {user && <p className="text-xs text-slate-500">Connected: {user.id}</p>}
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm text-slate-400">Product Name</span>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 p-3 text-white focus:border-cyan-400 focus:outline-none"
            placeholder="ETH Cali Tee"
            disabled={isLoading}
          />
        </label>
        
        {/* Image Upload Section */}
        <div className="space-y-2">
          <span className="text-sm text-slate-400">Product Image</span>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={isLoading || isUploading}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isUploading}
              className="flex-1 rounded-lg border border-dashed border-slate-600 bg-slate-900/80 p-3 text-slate-400 hover:border-cyan-400 hover:text-cyan-400 transition disabled:opacity-50"
            >
              {isUploading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Uploading to IPFS...
                </span>
              ) : imagePreview ? (
                'Change Image'
              ) : (
                '📷 Upload Image'
              )}
            </button>
          </div>
          
          {/* Image Preview */}
          {imagePreview && (
            <div className="mt-2 relative">
              <Image 
                src={imagePreview} 
                alt="Preview" 
                width={400}
                height={128}
                className="w-full h-32 object-cover rounded-lg border border-slate-700"
                unoptimized
              />
              <div className="absolute bottom-2 left-2 right-2 bg-black/70 rounded px-2 py-1">
                <p className="text-xs text-cyan-400 truncate font-mono">{form.imageUri}</p>
              </div>
            </div>
          )}
          
          {uploadError && (
            <p className="text-xs text-red-400">{uploadError}</p>
          )}
          
          {/* Manual URI input as fallback */}
          <input
            type="text"
            value={form.imageUri}
            onChange={(e) => setForm({ ...form, imageUri: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 p-2 text-sm text-slate-400 focus:border-cyan-400 focus:outline-none"
            placeholder="Or paste ipfs://... or https://..."
            disabled={isLoading}
          />
        </div>
      </div>

      <label className="space-y-2">
        <span className="text-sm text-slate-400">Description</span>
        <textarea
          required
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full rounded-lg border border-slate-700 bg-slate-900/80 p-3 text-white focus:border-cyan-400 focus:outline-none"
          placeholder="Drop story, materials, collab details..."
          disabled={isLoading}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm text-slate-400">Price (USDC)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            required
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 p-3 text-white focus:border-cyan-400 focus:outline-none"
            placeholder="25"
            disabled={isLoading}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-slate-400">Total Supply</span>
          <input
            type="number"
            min="1"
            required
            value={form.totalSupply}
            onChange={(e) => setForm({ ...form, totalSupply: Number(e.target.value) })}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 p-3 text-white focus:border-cyan-400 focus:outline-none"
            placeholder="20"
            disabled={isLoading}
          />
          {supplyPerSize > 0 && (
            <span className="text-xs text-slate-500">{supplyPerSize} per size</span>
          )}
        </label>
        <label className="space-y-2">
          <span className="text-sm text-slate-400">Gender</span>
          <select
            value={form.traits.gender}
            onChange={(e) => setForm({
              ...form,
              traits: { ...form.traits, gender: e.target.value as GenderOption },
            })}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 p-3 text-white focus:border-cyan-400 focus:outline-none"
            disabled={isLoading}
          >
            {GENDERS.map((gender) => (
              <option key={gender} value={gender}>
                {gender}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm text-slate-400">Color</span>
          <input
            type="text"
            value={form.traits.color}
            onChange={(e) => setForm({ ...form, traits: { ...form.traits, color: e.target.value } })}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 p-3 text-white focus:border-cyan-400 focus:outline-none"
            placeholder="Black"
            disabled={isLoading}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-slate-400">Style</span>
          <input
            type="text"
            value={form.traits.style}
            onChange={(e) => setForm({ ...form, traits: { ...form.traits, style: e.target.value } })}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 p-3 text-white focus:border-cyan-400 focus:outline-none"
            placeholder="Relaxed fit"
            disabled={isLoading}
          />
        </label>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Sizes</span>
          <span className="text-xs uppercase tracking-wide text-slate-500">Pick at least one</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => handleSizeToggle(size)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                form.sizes.includes(size)
                  ? 'border-cyan-400 bg-cyan-500/10 text-cyan-200'
                  : 'border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
              disabled={isLoading}
            >
              {size}
            </button>
          ))}
        </div>
      </section>

      {currentStep !== 'idle' && (
        <div className="space-y-2">
          <div className="h-2 rounded-full bg-slate-800">
            <div className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-slate-500">
            {currentStep === 'creating-variants' && 'Creating on-chain variants...'}
            {currentStep === 'complete' && 'All variants created!'}
          </p>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 p-3 text-base font-semibold text-white shadow-lg shadow-cyan-500/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? `Creating... ${progress}%` : 'Publish Product'}
      </button>
    </form>
  );
}
