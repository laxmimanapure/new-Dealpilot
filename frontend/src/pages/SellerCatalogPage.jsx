import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import ProductImage from '../components/ProductImage';
import ImageUploader from '../components/ImageUploader';
import { Package, Plus, Settings, Trash2, CheckCircle2, AlertTriangle, Save, ShieldCheck, Image as ImageIcon } from 'lucide-react';

export default function SellerCatalogPage() {
  const [catalog, setCatalog] = useState([]);
  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [error, setError] = useState('');

  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Peripherals',
    imageUrl: '',
    list_price: 2000,
    cost_price: 1400,
    stock: 100,
    unit: 'pcs',
    moq: 5,
    standard_lead_time_days: 3
  });

  const [selectedProductRule, setSelectedProductRule] = useState(null);
  const [ruleForm, setRuleForm] = useState({
    maximumDiscountPercent: 15.0,
    maximumDiscountAmount: 20000.0,
    marginFloorPercent: 8.0,
    earlyPaymentDiscount: 2.0,
    leadTimeExtraDiscount: 1.0,
    standardLeadTimeDays: 3,
    leadTimeExtensionDays: 7,
    maxRounds: 3,
    bulkDiscountRules: []
  });
  const [ruleError, setRuleError] = useState('');
  const [isSavingRule, setIsSavingRule] = useState(false);

  useEffect(() => {
    fetchCatalogData();
  }, []);

  const fetchCatalogData = async () => {
    try {
      const [catRes, rulesRes] = await Promise.all([
        api.get('/seller/catalog'),
        api.get('/seller/rules')
      ]);
      setCatalog(catRes.data.catalog || catRes.data.products || []);
      setRules(rulesRes.data.rules || {});
    } catch (err) {
      console.error('Failed to load seller catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/seller/catalog', newProduct);
      setShowAddModal(false);
      setSaveSuccess('Product added successfully!');
      setNewProduct({
        name: '',
        category: 'Peripherals',
        imageUrl: '',
        list_price: 2000,
        cost_price: 1400,
        stock: 100,
        unit: 'pcs',
        moq: 5,
        standard_lead_time_days: 3
      });
      setTimeout(() => setSaveSuccess(''), 3000);
      fetchCatalogData();
    } catch (err) {
      setError('Failed to add product: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Delete this product from catalog?')) return;
    try {
      await api.delete(`/seller/catalog/${productId}`);
      fetchCatalogData();
    } catch (err) {
      setError('Failed to delete product');
    }
  };

  const handleOpenPolicyModal = (prod) => {
    setSelectedProductRule(prod);
    setRuleError('');
    const r = prod.rules || {};
    setRuleForm({
      maximumDiscountPercent: r.maximumDiscountPercent ?? 15.0,
      maximumDiscountAmount: r.maximumDiscountAmount ?? 20000.0,
      marginFloorPercent: r.marginFloorPercent ?? 8.0,
      earlyPaymentDiscount: r.earlyPaymentDiscount ?? 2.0,
      leadTimeExtraDiscount: r.leadTimeExtraDiscount ?? 1.0,
      standardLeadTimeDays: prod.standard_lead_time_days || prod.standardLeadTimeDays || 3,
      leadTimeExtensionDays: r.leadTimeExtensionDays ?? 7,
      maxRounds: r.maxRounds ?? 3,
      bulkDiscountRules: r.bulkDiscountRules ? JSON.parse(JSON.stringify(r.bulkDiscountRules)) : []
    });
  };

  const handleAddSlab = () => {
    setRuleForm(prev => {
      const existing = prev.bulkDiscountRules;
      const lastMin = existing.length > 0 ? (existing[existing.length - 1].maxQuantity ? existing[existing.length - 1].maxQuantity + 1 : existing[existing.length - 1].minQuantity + 20) : 25;
      return {
        ...prev,
        bulkDiscountRules: [
          ...existing,
          { minQuantity: lastMin, maxQuantity: lastMin + 24, discountPercent: 5.0 }
        ]
      };
    });
  };

  const handleRemoveSlab = (idx) => {
    setRuleForm(prev => ({
      ...prev,
      bulkDiscountRules: prev.bulkDiscountRules.filter((_, i) => i !== idx)
    }));
  };

  const handleSlabChange = (idx, field, val) => {
    setRuleForm(prev => {
      const updated = [...prev.bulkDiscountRules];
      const parsedVal = field === 'discountPercent' ? (parseFloat(val) || 0) : (val === '' ? null : parseInt(val, 10));
      updated[idx] = { ...updated[idx], [field]: parsedVal };
      return { ...prev, bulkDiscountRules: updated };
    });
  };

  const handleSavePolicyRules = async () => {
    if (!selectedProductRule) return;
    setRuleError('');
    setIsSavingRule(true);

    try {
      const productId = selectedProductRule.id || selectedProductRule._id;
      await api.put(`/seller/rules/${productId}`, ruleForm);
      setSaveSuccess(`Policy rules updated successfully for ${selectedProductRule.name}!`);
      setTimeout(() => setSaveSuccess(''), 3500);
      setSelectedProductRule(null);
      fetchCatalogData();
    } catch (err) {
      setRuleError(err.response?.data?.error || err.message || 'Failed to update policy rules');
    } finally {
      setIsSavingRule(false);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 space-y-6 font-sans text-[#20284F]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#20284F] tracking-tight">Products & Catalog Controls</h1>
          <p className="text-xs text-[#20284F]/70 font-medium mt-0.5">
            Manage product inventory, upload product images (via file or camera), set list prices, and AI policy negotiation boundaries
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Product Cards Grid */}
      {catalog.length === 0 ? (
        <div className="bg-white border border-[#EAE3D9] rounded-2xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#FAF6F0] text-[#7668D8] border border-[#EAE3D9] flex items-center justify-center mx-auto">
            <Package className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-[#20284F] text-lg">No Products in Catalog Yet</h3>
            <p className="text-xs text-[#20284F]/70 max-w-md mx-auto font-medium">
              Your catalog is currently empty. Add your products with images, list prices, and cost bounds so DealPilot's AI policy engine can auto-negotiate deals on your behalf.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Product</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {catalog.map(prod => (
            <div key={prod.id || prod._id} className="bg-white border border-[#EAE3D9] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              
              <div>
                {/* Product Image Header */}
                <div className="h-44 w-full bg-[#FAF6F0] relative overflow-hidden border-b border-[#EAE3D9]/60">
                  <ProductImage
                    src={prod.imageUrl || prod.image}
                    alt={prod.name}
                    name={prod.name}
                    category={prod.category}
                    className="w-full h-full object-cover"
                    containerClassName="w-full h-full"
                  />
                  <div className="absolute top-3 left-3 z-10">
                    <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-md bg-[#20284F]/80 text-white backdrop-blur-xs">
                      {prod.sku || 'SKU-001'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteProduct(prod.id || prod._id)}
                    className="absolute top-3 right-3 z-10 p-1.5 bg-white/90 hover:bg-rose-500 text-[#20284F]/60 hover:text-white transition-colors rounded-lg shadow-xs"
                    title="Delete Product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-[#7668D8] uppercase tracking-wider">{prod.category}</span>
                    <h3 className="font-bold text-[#20284F] text-base mt-0.5 line-clamp-1">{prod.name}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 bg-[#FAF6F0] rounded-xl text-xs border border-[#EAE3D9]/60">
                    <div>
                      <span className="text-[#20284F]/60 font-medium block">List Price</span>
                      <strong className="text-[#20284F] font-mono text-sm">₹{(prod.list_price || prod.price)?.toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <span className="text-[#20284F]/60 font-medium block">Cost Price</span>
                      <strong className="text-[#20284F]/80 font-mono">₹{(prod.cost_price || prod.costPrice || Math.round((prod.list_price || prod.price) * 0.7))?.toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <span className="text-[#20284F]/60 font-medium block">Stock</span>
                      <strong className="text-[#20284F]">{prod.stock ?? 100} units</strong>
                    </div>
                    <div>
                      <span className="text-[#20284F]/60 font-medium block">Lead Time</span>
                      <strong className="text-[#20284F]">{prod.standard_lead_time_days || prod.standardLeadTimeDays || 3} days</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-[#EAE3D9]/60 flex items-center justify-between text-xs">
                <span className="text-[#20284F]/60">MOQ: <strong className="text-[#20284F]">{prod.moq || 5} units</strong></span>
                <button
                  onClick={() => handleOpenPolicyModal(prod)}
                  className="text-[#7668D8] hover:text-[#352F6E] font-bold flex items-center space-x-1"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Policy Rules</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#20284F]/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-[#EAE3D9] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b border-[#EAE3D9]/60 pb-3">
              <h3 className="text-lg font-bold text-[#20284F]">Add Catalog Product</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#20284F]/50 hover:text-[#20284F] font-bold">✕</button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#20284F] mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="e.g. Mechanical Ergonomic Keyboard"
                  className="w-full bg-white border border-[#EAE3D9] rounded-xl px-3.5 py-2.5 text-[#20284F] focus:outline-none focus:border-[#7668D8] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#20284F] mb-1">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full bg-white border border-[#EAE3D9] rounded-xl px-3 py-2 text-[#20284F] focus:outline-none focus:border-[#7668D8] font-medium"
                  >
                    <option value="Peripherals">Peripherals</option>
                    <option value="Audio">Audio</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Stationery">Stationery</option>
                    <option value="Computers">Computers</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#20284F] mb-1">SKU (Optional)</label>
                  <input
                    type="text"
                    value={newProduct.sku || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    placeholder="Auto-generated if empty"
                    className="w-full bg-white border border-[#EAE3D9] rounded-xl px-3.5 py-2 text-[#20284F] focus:outline-none focus:border-[#7668D8] font-mono"
                  />
                </div>
              </div>

              {/* Advanced Image Uploader with File Upload & Live Camera Capture */}
              <div className="p-3.5 bg-[#FAF6F0] border border-[#EAE3D9] rounded-xl space-y-2">
                <label className="block font-bold text-[#20284F] flex items-center space-x-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#7668D8]" />
                  <span>Product Image (File, Camera, or Link)</span>
                </label>
                <ImageUploader
                  value={newProduct.imageUrl}
                  onChange={(imgUrl) => setNewProduct({ ...newProduct, imageUrl: imgUrl })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#20284F] mb-1">List Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newProduct.list_price}
                    onChange={(e) => setNewProduct({ ...newProduct, list_price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-[#EAE3D9] rounded-xl px-3.5 py-2 text-[#20284F] font-mono font-bold focus:outline-none focus:border-[#7668D8]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#20284F] mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newProduct.cost_price}
                    onChange={(e) => setNewProduct({ ...newProduct, cost_price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-[#EAE3D9] rounded-xl px-3.5 py-2 text-[#20284F] font-mono font-bold focus:outline-none focus:border-[#7668D8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#20284F] mb-1">Stock (Units)</label>
                  <input
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-white border border-[#EAE3D9] rounded-xl px-3.5 py-2 text-[#20284F] focus:outline-none focus:border-[#7668D8]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#20284F] mb-1">MOQ (Units)</label>
                  <input
                    type="number"
                    value={newProduct.moq}
                    onChange={(e) => setNewProduct({ ...newProduct, moq: parseInt(e.target.value, 10) || 1 })}
                    className="w-full bg-white border border-[#EAE3D9] rounded-xl px-3.5 py-2 text-[#20284F] focus:outline-none focus:border-[#7668D8]"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[#EAE3D9]/60">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#FAF6F0] text-[#20284F] border border-[#EAE3D9] hover:bg-[#EAE3D9]/50 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] text-white rounded-xl font-bold shadow-md hover:opacity-95"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Policy Rules Drawer Modal */}
      {selectedProductRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#20284F]/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-[#EAE3D9] rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#EAE3D9]/60 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#20284F]">Policy Rules: {selectedProductRule.name}</h3>
                <p className="text-xs text-[#20284F]/60">Configure seller-defined negotiation bounds & bulk discount slabs</p>
              </div>
              <button
                onClick={() => setSelectedProductRule(null)}
                className="text-[#20284F]/50 hover:text-[#20284F] font-bold"
              >
                ✕
              </button>
            </div>

            {ruleError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{ruleError}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              
              {/* Caps & Floor Section */}
              <div className="space-y-2">
                <div className="font-bold text-[#7668D8] text-[11px] uppercase tracking-wider">Discount Caps & Margins</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#20284F] mb-1">Max Total Discount (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={ruleForm.maximumDiscountPercent}
                      onChange={(e) => setRuleForm({ ...ruleForm, maximumDiscountPercent: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-[#EAE3D9] rounded-xl px-3 py-2 text-[#20284F] font-bold focus:outline-none focus:border-[#7668D8]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#20284F] mb-1">Max Discount Amount (₹)</label>
                    <input
                      type="number"
                      value={ruleForm.maximumDiscountAmount}
                      onChange={(e) => setRuleForm({ ...ruleForm, maximumDiscountAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-[#EAE3D9] rounded-xl px-3 py-2 text-[#20284F] font-mono font-bold focus:outline-none focus:border-[#7668D8]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#20284F] mb-1">Margin Floor (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={ruleForm.marginFloorPercent}
                      onChange={(e) => setRuleForm({ ...ruleForm, marginFloorPercent: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-[#EAE3D9] rounded-xl px-3 py-2 text-amber-700 font-bold focus:outline-none focus:border-[#7668D8]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#20284F] mb-1">Max Negotiation Rounds</label>
                    <input
                      type="number"
                      value={ruleForm.maxRounds}
                      onChange={(e) => setRuleForm({ ...ruleForm, maxRounds: parseInt(e.target.value, 10) || 3 })}
                      className="w-full bg-white border border-[#EAE3D9] rounded-xl px-3 py-2 text-[#20284F] focus:outline-none focus:border-[#7668D8]"
                    />
                  </div>
                </div>
              </div>

              {/* Payment & Delivery Incentives Section */}
              <div className="space-y-2 pt-2 border-t border-[#EAE3D9]/60">
                <div className="font-bold text-[#7668D8] text-[11px] uppercase tracking-wider">Payment & Delivery Policy Incentives</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#20284F] mb-1">Advance Pay Discount (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={ruleForm.earlyPaymentDiscount}
                      onChange={(e) => setRuleForm({ ...ruleForm, earlyPaymentDiscount: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-[#EAE3D9] rounded-xl px-3 py-2 text-[#20284F] focus:outline-none focus:border-[#7668D8]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#20284F] mb-1">Flexible Delivery Discount (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={ruleForm.leadTimeExtraDiscount}
                      onChange={(e) => setRuleForm({ ...ruleForm, leadTimeExtraDiscount: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-[#EAE3D9] rounded-xl px-3 py-2 text-[#20284F] focus:outline-none focus:border-[#7668D8]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#20284F] mb-1">Standard Lead Time (days)</label>
                    <input
                      type="number"
                      value={ruleForm.standardLeadTimeDays}
                      onChange={(e) => setRuleForm({ ...ruleForm, standardLeadTimeDays: parseInt(e.target.value, 10) || 1 })}
                      className="w-full bg-white border border-[#EAE3D9] rounded-xl px-3 py-2 text-[#20284F] focus:outline-none focus:border-[#7668D8]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#20284F] mb-1">Extension Required (days)</label>
                    <input
                      type="number"
                      value={ruleForm.leadTimeExtensionDays}
                      onChange={(e) => setRuleForm({ ...ruleForm, leadTimeExtensionDays: parseInt(e.target.value, 10) || 0 })}
                      className="w-full bg-white border border-[#EAE3D9] rounded-xl px-3 py-2 text-[#20284F] focus:outline-none focus:border-[#7668D8]"
                    />
                  </div>
                </div>
              </div>

              {/* Bulk Discount Slabs Section */}
              <div className="space-y-2 pt-2 border-t border-[#EAE3D9]/60">
                <div className="flex justify-between items-center">
                  <div className="font-bold text-[#7668D8] text-[11px] uppercase tracking-wider">Configured Bulk Discount Slabs</div>
                  <button
                    type="button"
                    onClick={handleAddSlab}
                    className="px-2.5 py-1 bg-[#7668D8]/10 hover:bg-[#7668D8]/20 text-[#7668D8] rounded-lg font-extrabold text-[11px] flex items-center space-x-1 transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Slab</span>
                  </button>
                </div>

                {ruleForm.bulkDiscountRules.length === 0 ? (
                  <p className="text-[11px] text-[#20284F]/60 italic bg-[#FAF6F0] p-3 rounded-xl border border-[#EAE3D9]">
                    No bulk discount slabs configured. Buyer orders will not receive bulk discounts unless a slab is added.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {ruleForm.bulkDiscountRules.map((slab, sIdx) => (
                      <div key={sIdx} className="flex items-center space-x-2 bg-[#FAF6F0] p-2.5 rounded-xl border border-[#EAE3D9]">
                        <div className="flex-1 grid grid-cols-3 gap-2 text-[11px]">
                          <div>
                            <span className="text-[10px] text-[#20284F]/60 block font-semibold">Min Qty</span>
                            <input
                              type="number"
                              value={slab.minQuantity}
                              onChange={(e) => handleSlabChange(sIdx, 'minQuantity', e.target.value)}
                              className="w-full bg-white border border-[#EAE3D9] rounded-lg px-2 py-1 font-bold text-[#20284F]"
                              placeholder="25"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-[#20284F]/60 block font-semibold">Max Qty (Opt)</span>
                            <input
                              type="number"
                              value={slab.maxQuantity ?? ''}
                              onChange={(e) => handleSlabChange(sIdx, 'maxQuantity', e.target.value)}
                              className="w-full bg-white border border-[#EAE3D9] rounded-lg px-2 py-1 text-[#20284F]"
                              placeholder="49"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-[#20284F]/60 block font-semibold">Discount (%)</span>
                            <input
                              type="number"
                              step="0.5"
                              value={slab.discountPercent}
                              onChange={(e) => handleSlabChange(sIdx, 'discountPercent', e.target.value)}
                              className="w-full bg-white border border-[#EAE3D9] rounded-lg px-2 py-1 font-bold text-emerald-700"
                              placeholder="5.0"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSlab(sIdx)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Remove Slab"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-[#EAE3D9]/60">
              <button
                type="button"
                onClick={() => setSelectedProductRule(null)}
                className="px-4 py-2 bg-[#FAF6F0] text-[#20284F] border border-[#EAE3D9] hover:bg-[#EAE3D9]/50 rounded-xl font-bold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSavePolicyRules}
                disabled={isSavingRule}
                className="px-5 py-2 bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] text-white rounded-xl font-bold shadow-md hover:opacity-95 disabled:opacity-50 flex items-center space-x-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingRule ? 'Saving Policies...' : 'Save Product Rules'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
