import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Zap, 
  Package, 
  Store, 
  Globe, 
  ExternalLink,
  Edit3,
  HelpCircle
} from 'lucide-react';

export default function NewRequestPage() {
  const [promptText, setPromptText] = useState(
    'I need 50 Dell keyboards, 20 wireless mice and 10 monitors for my office. My total budget is ₹1,00,000 and I need delivery within 7 days.'
  );

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // AI Analyzed & Editable Form State
  const [analysisResult, setAnalysisResult] = useState(null);
  const [items, setItems] = useState([]);
  const [totalBudget, setTotalBudget] = useState(100000);
  const [deadlineDays, setDeadlineDays] = useState(7);

  const navigate = useNavigate();

  // Helper: Find DB product MOQ for a line item
  const getMatchedProductMoq = (itemName) => {
    if (!itemName || !analysisResult?.dbMatches?.products) return null;
    const clean = itemName.trim().toLowerCase();
    if (!clean) return null;
    const match = analysisResult.dbMatches.products.find(p => 
      p.name?.toLowerCase().includes(clean) || clean.includes(p.name?.toLowerCase() || '')
    );
    return match ? (match.moq || 1) : null;
  };

  // Helper: Get quantity validation error for an item
  const getItemQuantityError = (item) => {
    const rawQty = item.quantity;
    if (rawQty === '' || rawQty === null || rawQty === undefined) {
      return 'Required Quantity is required.';
    }
    const numQty = Number(rawQty);
    if (isNaN(numQty) || numQty <= 0) {
      return 'Required Quantity must be a positive number (minimum 1 unit).';
    }
    if (!Number.isInteger(numQty)) {
      return 'Required Quantity must be a whole integer (no decimals).';
    }
    const moq = getMatchedProductMoq(item.item_name);
    if (moq && numQty < moq) {
      return `Quantity (${numQty} units) is below seller Minimum Order Quantity (MOQ: ${moq} units).`;
    }
    return null;
  };

  // Step 1: Run AI Analysis
  const handleAnalyzeRequirement = async (e) => {
    if (e) e.preventDefault();
    if (!promptText.trim()) return;

    setIsAnalyzing(true);
    setError('');

    try {
      const res = await api.post('/ai/analyze-procurement', { promptText });
      setAnalysisResult(res.data);

      const parsedItems = (res.data.analysis?.items || []).map(i => ({
        item_name: i.item_name || '',
        quantity: i.quantity && !isNaN(Number(i.quantity)) && Number(i.quantity) > 0 ? parseInt(i.quantity, 10) : 1
      }));

      setItems(parsedItems.length > 0 ? parsedItems : [{ item_name: '', quantity: 1 }]);
      setTotalBudget(res.data.analysis?.total_budget || 100000);
      setDeadlineDays(res.data.analysis?.deadline_days || 7);
    } catch (err) {
      console.error('AI Analysis error:', err);
      setError('AI Analysis failed. You can still confirm and submit your requirement manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handlers for editable line items
  const handleItemNameChange = (index, value) => {
    const updated = [...items];
    updated[index].item_name = value;
    setItems(updated);
  };

  const handleQuantityChange = (index, value) => {
    const updated = [...items];
    updated[index].quantity = value;
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([...items, { item_name: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Step 2: Confirm & Create Procurement Request in MongoDB
  const handleConfirmAndCreate = async () => {
    setIsSubmitting(true);
    setError('');

    const errors = [];
    const formattedItems = items.map((item, idx) => {
      const name = (item.item_name || '').trim();
      if (!name) {
        errors.push(`Product line item #${idx + 1} name cannot be empty.`);
      }

      const qErr = getItemQuantityError(item);
      if (qErr) {
        errors.push(`Product "${name || '#' + (idx + 1)}": ${qErr}`);
      }

      return {
        item_name: name,
        quantity: parseInt(item.quantity, 10)
      };
    });

    if (errors.length > 0) {
      setError(errors.join(' '));
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await api.post('/buyer/requests', {
        promptText,
        total_budget: Number(totalBudget) || 100000,
        deadline_days: Number(deadlineDays) || 7,
        items: formattedItems
      });

      const { requirement } = res.data;
      const reqId = requirement.id || requirement._id;
      navigate(`/buyer/requests/${reqId}/plans`);
    } catch (err) {
      console.error('Submit requirement error:', err);
      setError(err.response?.data?.error || 'Failed to submit requirement and create procurement order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 font-sans text-[#20284F] bg-[#FBF8F3]">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#7668D8]/10 text-[#7668D8] border border-[#7668D8]/20 text-xs font-extrabold mb-3 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[#E88AAE] animate-pulse" />
          <span>AI Multi-Item Procurement Assistant</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#20284F] tracking-tight">
          Create Procurement Requirement
        </h1>
        <p className="text-[#5A6588] text-sm mt-1 max-w-2xl leading-relaxed font-normal">
          Describe your purchasing needs in plain text. DealPilot's AI will parse items, search DealPilot suppliers & web market info, and prepare automated policy negotiations.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-extrabold flex items-center space-x-2 shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. AI INTAKE INPUT CARD */}
      <form onSubmit={handleAnalyzeRequirement} className="bg-white border border-[#EAE3D9] rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#EAE3D9] pb-3">
          <label className="block text-xs sm:text-sm font-extrabold text-[#20284F]">
            ✨ Describe Requirement in Your Own Words
          </label>
          <span className="text-xs text-[#5A6588] font-bold">Natural Language NLP Input</span>
        </div>

        <textarea
          rows={4}
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="e.g., I need 50 Dell keyboards, 20 wireless mice and 10 monitors for my office under ₹1,00,000 within 7 days."
          className="w-full bg-[#FAF6F0] hover:bg-white focus:bg-white border border-[#EAE3D9] focus:border-[#7668D8] rounded-2xl p-4 text-xs sm:text-sm text-[#20284F] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#7668D8]/20 font-sans leading-relaxed transition-all"
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="text-xs text-[#5A6588] flex items-center space-x-1.5 font-medium">
            <Zap className="w-4 h-4 text-[#E88AAE] shrink-0" />
            <span>AI extracts items, quantities, target budget & conducts web research</span>
          </div>

          <button
            type="submit"
            disabled={isAnalyzing || !promptText.trim()}
            className="px-6 py-3 bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] hover:from-[#7668D8] hover:to-[#E88AAE] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md shadow-[#20284F]/10 hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 shrink-0"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Analyzing Requirement...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#E88AAE]" />
                <span>✨ Analyze Requirement</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* 2. AI ANALYSIS & EDITABLE QUANTITY REQUIREMENT SECTION */}
      {analysisResult && (
        <div className="space-y-6">
          {/* AI Structured Requirement Card */}
          <div className="bg-white border border-[#EAE3D9] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE3D9] pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 font-bold">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#20284F] text-base">AI Understood Your Requirement</h3>
                  <p className="text-xs text-[#5A6588] font-normal">{analysisResult.analysis?.parsed_summary}</p>
                </div>
              </div>

              <div className="text-xs text-[#5A6588] font-bold px-3 py-1.5 rounded-xl bg-[#FAF6F0] border border-[#EAE3D9]">
                Review & Edit Required Quantities
              </div>
            </div>

            {/* Extracted & Editable Product Line Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-[#5A6588] uppercase tracking-wider">
                  Product Line Items & Required Quantities
                </h4>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-xs font-extrabold text-[#7668D8] hover:text-[#20284F] flex items-center space-x-1 px-3 py-1 rounded-xl bg-[#7668D8]/10 border border-[#7668D8]/20 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((item, idx) => {
                  const qErr = getItemQuantityError(item);
                  const moqVal = getMatchedProductMoq(item.item_name);

                  return (
                    <div key={idx} className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EAE3D9] space-y-3 relative transition-all hover:border-[#7668D8]/40">
                      
                      {/* Product Name & Delete */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <label className="block text-[10px] font-extrabold text-[#5A6588] uppercase tracking-wider mb-1">
                            Product Name
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              value={item.item_name}
                              onChange={(e) => handleItemNameChange(idx, e.target.value)}
                              placeholder="Product name (e.g. Pencils)"
                              className="w-full bg-white border border-[#EAE3D9] focus:border-[#7668D8] rounded-xl px-3 py-1.5 text-xs font-extrabold text-[#20284F] focus:outline-none focus:ring-1 focus:ring-[#7668D8]"
                            />
                          </div>
                        </div>
                        
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors mt-4"
                            title="Remove product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Required Quantity Input */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-extrabold text-[#20284F] flex items-center justify-between">
                          <span className="flex items-center space-x-1">
                            <Package className="w-3.5 h-3.5 text-[#7668D8]" />
                            <span>Required Quantity</span>
                            <span className="text-rose-500 font-bold">*</span>
                          </span>
                          {moqVal && (
                            <span className="text-[10px] text-[#5A6588] font-semibold">
                              MOQ: {moqVal} units
                            </span>
                          )}
                        </label>
                        
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(idx, e.target.value)}
                            placeholder="Enter quantity"
                            className={`w-full bg-white border rounded-xl pl-3.5 pr-16 py-2 text-xs sm:text-sm font-extrabold font-mono text-[#20284F] focus:outline-none focus:ring-2 transition-all ${
                              qErr
                                ? 'border-rose-300 bg-rose-50/50 focus:border-rose-500 focus:ring-rose-200'
                                : 'border-[#EAE3D9] focus:border-[#7668D8] focus:ring-[#7668D8]/20 hover:border-[#7668D8]/50'
                            }`}
                          />
                          <span className="absolute right-3 text-xs font-extrabold text-[#7668D8] bg-[#7668D8]/10 px-2 py-0.5 rounded-md border border-[#7668D8]/20 pointer-events-none">
                            units
                          </span>
                        </div>

                        {qErr && (
                          <div className="text-[11px] font-extrabold text-rose-600 flex items-center space-x-1 pt-0.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{qErr}</span>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* Extracted Budget & Timeline Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-[#FAF6F0] rounded-2xl border border-[#EAE3D9] text-xs font-medium text-[#20284F]">
              <div className="space-y-1">
                <label className="text-[#5A6588] block text-[11px] font-extrabold uppercase tracking-wider">Total Target Budget (₹)</label>
                <input
                  type="number"
                  min={1}
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                  placeholder="Target budget"
                  className="w-full bg-white border border-[#EAE3D9] focus:border-[#7668D8] rounded-xl px-3 py-1.5 text-xs font-extrabold font-mono text-[#20284F] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#5A6588] block text-[11px] font-extrabold uppercase tracking-wider">Delivery Timeframe (Days)</label>
                <input
                  type="number"
                  min={1}
                  value={deadlineDays}
                  onChange={(e) => setDeadlineDays(e.target.value)}
                  placeholder="Delivery timeframe in days"
                  className="w-full bg-white border border-[#EAE3D9] focus:border-[#7668D8] rounded-xl px-3 py-1.5 text-xs font-extrabold text-[#20284F] focus:outline-none"
                />
              </div>

              <div className="flex flex-col justify-end">
                <span className="text-[#5A6588] block text-[11px] font-extrabold uppercase tracking-wider mb-1">Feasibility Status</span>
                <span className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-extrabold ${
                  analysisResult.feasibility?.isFeasible ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  <span>{analysisResult.feasibility?.isFeasible ? '✓ Budget Feasible' : '⚠ High Value Request'}</span>
                </span>
              </div>
            </div>

            {/* AI Clarifications Panel (if available) */}
            {analysisResult.analysis?.clarification_questions?.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex items-center space-x-2 text-amber-800 text-xs font-extrabold">
                  <HelpCircle className="w-4 h-4 text-amber-700" />
                  <span>AI Suggestions for Better Seller Quotes:</span>
                </div>
                <div className="space-y-1">
                  {analysisResult.analysis.clarification_questions.map((q, idx) => (
                    <p key={idx} className="text-xs text-amber-900 italic pl-6">
                      • {q}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Confirmation CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-[#EAE3D9]">
              <button
                type="button"
                onClick={handleConfirmAndCreate}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] hover:from-[#7668D8] hover:to-[#E88AAE] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-[#20284F]/10 hover:shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>{isSubmitting ? 'Creating Procurement Order...' : 'Confirm & Create Procurement Request'}</span>
                <ArrowRight className="w-4 h-4 text-[#E88AAE]" />
              </button>
            </div>
          </div>

          {/* 3. MARKET RESEARCH & DEALPILOT SUPPLIERS SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* DealPilot Database Matches */}
            <div className="bg-white border border-[#EAE3D9] rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#EAE3D9] pb-3">
                <div className="flex items-center space-x-2">
                  <Store className="w-4 h-4 text-[#7668D8]" />
                  <h4 className="font-extrabold text-[#20284F] text-sm">DealPilot Registered Suppliers</h4>
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#7668D8]/10 text-[#7668D8] border border-[#7668D8]/20">
                  {analysisResult.dbMatches?.suppliers?.length || 0} Matched
                </span>
              </div>

              {analysisResult.dbMatches?.suppliers?.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#5A6588] bg-[#FAF6F0] rounded-2xl">
                  No registered DealPilot suppliers match this item currently. The policy engine will broadcast your RFQ to all network suppliers.
                </div>
              ) : (
                <div className="space-y-3">
                  {analysisResult.dbMatches?.suppliers?.map((sup) => (
                    <div key={sup.id} className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#EAE3D9] flex items-center justify-between">
                      <div>
                        <div className="font-extrabold text-xs text-[#20284F]">{sup.company_name}</div>
                        <div className="text-[11px] text-[#5A6588]">Contact: {sup.contact_name}</div>
                      </div>
                      <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Verified
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* External Web Market Research */}
            <div className="bg-[#white] bg-white border border-[#EAE3D9] rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#EAE3D9] pb-3">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-[#7668D8]" />
                  <h4 className="font-extrabold text-[#20284F] text-sm">Web Results (Market Research)</h4>
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#7668D8]/10 text-[#7668D8] border border-[#7668D8]/20">
                  Live Market Search
                </span>
              </div>

              {analysisResult.webResults?.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#5A6588] bg-[#FAF6F0] rounded-2xl">
                  No external web search results found for this query.
                </div>
              ) : (
                <div className="space-y-3">
                  {analysisResult.webResults?.map((res, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#EAE3D9] space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <a 
                          href={res.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="font-extrabold text-xs text-[#7668D8] hover:underline line-clamp-1 flex items-center space-x-1"
                        >
                          <span>{res.title}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                        <span className="text-[10px] font-mono text-[#5A6588] shrink-0">{res.source}</span>
                      </div>
                      <p className="text-[11px] text-[#5A6588] line-clamp-2">{res.snippet}</p>
                      {res.approxPrice && (
                        <div className="text-[11px] font-mono font-extrabold text-emerald-700 pt-0.5">
                          Est. Price: ₹{res.approxPrice.toLocaleString('en-IN')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
