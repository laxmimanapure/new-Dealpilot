import React, { useState } from 'react';
import { 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  CheckCircle2, 
  ShieldCheck, 
  Edit3, 
  Save, 
  Award,
  CreditCard,
  PackageCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SellerProfilePage = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const [profileData, setProfileData] = useState({
    companyName: user?.companyName || user?.name || 'Apex Office & Tech Supplies Ltd',
    contactPerson: user?.name || 'Alex Morgan',
    email: user?.email || 'seller@apexsupplies.com',
    phone: '+1 (555) 392-8801',
    website: 'https://www.apexsupplies-example.com',
    address: '104 Innovation Way, Suite 400, Austin, TX 78701',
    taxId: 'US-94-8291034',
    businessType: 'Manufacturer & Authorized Distributor',
    yearEstablished: '2012',
    categories: ['Office Equipment', 'IT Hardware', 'Ergonomic Furniture', 'Stationery Bulk'],
    paymentTerms: 'Net 30 / Escrow / Credit Card'
  });

  const handleSave = () => {
    setIsEditing(false);
    // Submit edits logic if needed
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-2xl shadow-md border-2 border-white">
              {profileData.companyName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-[#0F1E3A]">{profileData.companyName}</h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Verified Supplier
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                <span>{profileData.businessType}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Austin, TX
                </span>
              </p>
            </div>
          </div>

          <div>
            {isEditing ? (
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-all shadow-sm"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-medium text-sm rounded-xl transition-all shadow-sm"
              >
                <Edit3 className="w-4 h-4 text-slate-500" /> Edit Company Profile
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Business Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* General Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-[#0F1E3A] mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" /> Business Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Company Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.companyName}
                    onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-[#0F1E3A]">{profileData.companyName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Tax ID / EIN / GST</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.taxId}
                    onChange={(e) => setProfileData({ ...profileData, taxId: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-[#0F1E3A]">{profileData.taxId}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Business Type</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.businessType}
                    onChange={(e) => setProfileData({ ...profileData, businessType: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-[#0F1E3A]">{profileData.businessType}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Year Established</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.yearEstablished}
                    onChange={(e) => setProfileData({ ...profileData, yearEstablished: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-[#0F1E3A]">{profileData.yearEstablished}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-[#0F1E3A] mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" /> Contact Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Primary Representative</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.contactPerson}
                    onChange={(e) => setProfileData({ ...profileData, contactPerson: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-[#0F1E3A]">{profileData.contactPerson}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Work Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-[#0F1E3A]">{profileData.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Phone Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-[#0F1E3A]">{profileData.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Website</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.website}
                    onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                ) : (
                  <a href={profileData.website} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline">
                    {profileData.website}
                  </a>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Registered Address</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-[#0F1E3A]">{profileData.address}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Trust & Badges */}
        <div className="space-y-8">
          {/* Verification & Trust */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-[#0F1E3A] mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" /> Trust & Certifications
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h4 className="text-xs font-semibold text-[#0F1E3A]">Tax Identity Verified</h4>
                    <p className="text-[11px] text-slate-500">Government Record Match</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Active</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-blue-600" />
                  <div>
                    <h4 className="text-xs font-semibold text-[#0F1E3A]">ISO 9001:2015 Certified</h4>
                    <p className="text-[11px] text-slate-500">Quality Management</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">Verified</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <div>
                    <h4 className="text-xs font-semibold text-[#0F1E3A]">Verified Escrow Account</h4>
                    <p className="text-[11px] text-slate-500">Bank Account Linked</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">Linked</span>
              </div>
            </div>
          </div>

          {/* Product Categories */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-[#0F1E3A] mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-blue-600" /> Supply Capabilities
            </h2>

            <div className="flex flex-wrap gap-2">
              {profileData.categories.map((cat, idx) => (
                <span key={idx} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  {cat}
                </span>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Standard Payment Terms</span>
              <p className="text-xs font-medium text-[#0F1E3A]">{profileData.paymentTerms}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerProfilePage;
