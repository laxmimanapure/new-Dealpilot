import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ProductImage from '../components/ProductImage';
import { 
  Package, 
  Search, 
  Filter, 
  Store, 
  ShieldCheck, 
  CheckCircle2, 
  Plus, 
  ArrowRight, 
  Clock, 
  Truck, 
  Tag, 
  X, 
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BuyerCatalogPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const navigate = useNavigate();

  const categories = ['All', 'Peripherals', 'Audio', 'Furniture', 'Stationery', 'Computers'];

  useEffect(() => {
    fetchCatalog();
  }, [selectedCategory, searchQuery]);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'All') params.append('category', selectedCategory);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await api.get(`/buyer/catalog?${params.toString()}`);
      setProducts(res.data.catalog || res.data.products || []);
    } catch (err) {
      console.error('Failed to fetch buyer catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequestForProduct = (product) => {
    setSelectedProduct(null);
    navigate('/buyer/new-request', { 
      state: { 
        prefilledPrompt: `I need ${product.moq || 5} units of ${product.name} (${product.category})`
      } 
    });
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans text-[#20284F] bg-[#FBF8F3]">
      
      {/* ================= PAGE HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#EAE3D9] pb-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#7668D8]/10 text-[#7668D8] border border-[#7668D8]/20 text-xs font-extrabold">
            <Package className="w-3.5 h-3.5 text-[#7668D8]" />
            <span>Product Catalog</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#20284F] tracking-tight">Verified Products Catalog</h1>
          <p className="text-[#5A6588] text-xs sm:text-sm max-w-2xl leading-relaxed">
            Browse verified seller inventory available for instant multi-seller AI rule negotiation on DealPilot Procure.
          </p>
        </div>

        {/* Search Input */}
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-[#7668D8] absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name, category, or SKU..."
            className="w-full pl-10 pr-9 py-2.5 bg-[#FAF6F0] hover:bg-white focus:bg-white border border-[#EAE3D9] focus:border-[#7668D8] focus:ring-2 focus:ring-[#7668D8]/20 rounded-xl text-xs text-[#20284F] placeholder-[#94A3B8] focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-[#5A6588] hover:text-[#20284F] font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ================= CATEGORY FILTER TABS ================= */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] text-white shadow-xs font-extrabold'
                : 'bg-white border border-[#EAE3D9] text-[#5A6588] hover:bg-[#FAF6F0] hover:text-[#20284F]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ================= PRODUCT CARDS GRID ================= */}
      {loading ? (
        <div className="p-16 text-center text-xs text-[#5A6588] flex items-center justify-center space-x-2 font-bold">
          <div className="w-5 h-5 border-2 border-[#7668D8] border-t-transparent rounded-full animate-spin"></div>
          <span>Loading catalog products...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-[#EAE3D9] rounded-3xl bg-white space-y-4">
          <Package className="w-12 h-12 text-[#5A6588] mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-[#20284F]">No Products Found</h3>
            <p className="text-xs text-[#5A6588] max-w-sm mx-auto">
              No products match your query "{searchQuery || selectedCategory}". Try adjusting your category filter or search term.
            </p>
          </div>
          <button
            onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
            className="px-4 py-2 bg-[#7668D8]/10 text-[#7668D8] border border-[#7668D8]/20 font-bold text-xs rounded-xl hover:bg-[#7668D8]/20 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <motion.div
              key={product.id || product._id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedProduct(product)}
              className="bg-white rounded-3xl border border-[#EAE3D9] shadow-xs hover:shadow-xl hover:border-[#7668D8]/40 transition-all overflow-hidden flex flex-col justify-between cursor-pointer group"
            >
              <div>
                {/* Product Image Container */}
                <div className="relative aspect-4/3 w-full bg-[#FAF6F0] overflow-hidden border-b border-[#EAE3D9]">
                  <ProductImage
                    src={product.imageUrl || product.image}
                    alt={product.name}
                    name={product.name}
                    category={product.category}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    containerClassName="w-full h-full"
                  />
                  
                  {/* Category Pill Overlay */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-white/95 text-[#20284F] border border-[#EAE3D9] shadow-2xs">
                      {product.category}
                    </span>
                  </div>

                  {/* Stock Status Badge */}
                  <div className="absolute bottom-3 right-3 z-10">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#20284F]/90 backdrop-blur-md text-white shadow-2xs">
                      {product.stock || 100} in stock
                    </span>
                  </div>
                </div>

                {/* Product Content Details */}
                <div className="p-5 space-y-3">
                  <div>
                    <div className="text-[10px] font-mono text-[#7668D8] font-extrabold uppercase tracking-wider mb-0.5">
                      {product.sku || 'SKU-001'}
                    </div>
                    <h3 className="font-extrabold text-[#20284F] text-sm group-hover:text-[#7668D8] transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-[#5A6588] mt-1 line-clamp-2 leading-relaxed">
                      {product.description || 'Verified hardware item available for multi-seller automated negotiation.'}
                    </p>
                  </div>

                  {/* Pricing & Supplier Box */}
                  <div className="p-3 rounded-2xl bg-[#FAF6F0] border border-[#EAE3D9] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#5A6588] font-bold block">List Price</span>
                      <span className="text-base font-extrabold text-[#20284F] font-mono">
                        ₹{(product.list_price || product.price || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#5A6588] font-bold block">Supplier</span>
                      <span className="text-xs font-extrabold text-[#7668D8] line-clamp-1 max-w-[100px]">
                        {product.supplier_name || 'Verified Supplier'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 pb-5 pt-2 border-t border-[#EAE3D9]/60 flex items-center justify-between text-xs mt-auto">
                <span className="text-[11px] text-[#5A6588] font-bold">
                  MOQ: <strong className="text-[#20284F]">{product.moq || 1} {product.unit || 'units'}</strong>
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProduct(product);
                  }}
                  className="px-3.5 py-1.5 bg-[#7668D8]/10 hover:bg-[#7668D8]/20 text-[#7668D8] font-extrabold rounded-xl transition-colors text-xs flex items-center space-x-1"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

            </motion.div>
          ))}
        </div>
      )}

      {/* ================= PRODUCT DETAILS MODAL (LARGER IMAGE & FULL DETAILS) ================= */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#20284F]/60 backdrop-blur-xs overflow-y-auto font-sans">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-[#EAE3D9] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 space-y-0"
            >
              {/* Modal Header with Close Button */}
              <div className="relative">
                {/* Larger Product Image Container */}
                <div className="h-72 sm:h-80 w-full bg-[#FAF6F0] relative overflow-hidden border-b border-[#EAE3D9]">
                  <ProductImage
                    src={selectedProduct.imageUrl || selectedProduct.image}
                    alt={selectedProduct.name}
                    name={selectedProduct.name}
                    category={selectedProduct.category}
                    className="w-full h-full object-cover"
                    containerClassName="w-full h-full"
                  />
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-[#20284F]/80 hover:bg-[#20284F] text-white backdrop-blur-md flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="absolute bottom-4 left-4 z-10 flex items-center space-x-2">
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-white text-[#20284F] shadow-md border border-[#EAE3D9]">
                      {selectedProduct.category}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#7668D8] text-white shadow-md">
                      SKU: {selectedProduct.sku || 'OG-KB-001'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#20284F]">{selectedProduct.name}</h2>
                  <p className="text-[#5A6588] text-xs sm:text-sm mt-2 leading-relaxed font-normal">
                    {selectedProduct.description || 'High quality verified hardware product. Ready for automated multi-seller negotiation with custom discount rules.'}
                  </p>
                </div>

                {/* Key Specifications Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#FAF6F0] rounded-2xl border border-[#EAE3D9] text-xs">
                  <div>
                    <span className="text-[#5A6588] font-bold block text-[11px]">List Price</span>
                    <strong className="text-[#20284F] font-mono text-base">
                      ₹{(selectedProduct.list_price || selectedProduct.price || 0).toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#5A6588] font-bold block text-[11px]">Min Order Qty</span>
                    <strong className="text-[#20284F] text-sm">
                      {selectedProduct.moq || 1} {selectedProduct.unit || 'pcs'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#5A6588] font-bold block text-[11px]">Standard Lead Time</span>
                    <strong className="text-[#20284F] text-sm">
                      {selectedProduct.standard_lead_time_days || selectedProduct.standardLeadTimeDays || 3} Days
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#5A6588] font-bold block text-[11px]">Current Stock</span>
                    <strong className="text-emerald-700 text-sm font-extrabold">
                      {selectedProduct.stock || 100} units
                    </strong>
                  </div>
                </div>

                {/* Supplier info box */}
                <div className="p-4 rounded-2xl bg-[#7668D8]/10 border border-[#7668D8]/20 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#20284F] to-[#7668D8] text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {(selectedProduct.supplier_name || 'S')[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-[#20284F]">{selectedProduct.supplier_name || 'Verified Supplier'}</h4>
                      <p className="text-[11px] text-[#5A6588]">Participating in AI automated rule negotiations</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Verified Partner
                  </span>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="w-full sm:w-auto px-5 py-3 bg-white border border-[#EAE3D9] hover:bg-[#FAF6F0] text-[#5A6588] font-bold text-xs rounded-2xl transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreateRequestForProduct(selectedProduct)}
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] hover:from-[#7668D8] hover:to-[#E88AAE] text-white font-extrabold text-xs rounded-2xl shadow-md shadow-[#20284F]/10 transition-all flex items-center justify-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4 text-[#E88AAE]" />
                    <span>Create Procurement Request for this Item</span>
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

