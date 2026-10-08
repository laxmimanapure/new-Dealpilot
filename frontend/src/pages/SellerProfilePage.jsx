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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans text-[#20284F]">
      {/* Profile Header Banner */}
      <div className="bg-white rounded-2xl border border-[#EAE3D9] p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] text-white flex items-center justify-center font-bold text-2xl shadow-md border-2 border-white">
              {profileData.companyName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-[#20284F]">{profileData.companyName}</h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#7668D8]/10 text-[#7668D8] border border-[#7668D8]/20">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#7668D8]" /> Verified Supplier
                </span>
              </div>
              <p className="text-[#20284F]/70 text-sm mt-1 flex items-center gap-2">
                <span>{profileData.businessType}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#7668D8]" /> Austin, TX
                </span>
              </p>
            </div>
          </div>

          <div>
            {isEditing ? (
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] hover:opacity-95 text-white font-medium text-sm rounded-xl transition-all shadow-md"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FAF6F0] text-[#20284F] border border-[#EAE3D9] hover:bg-[#EAE3D9]/50 font-medium text-sm rounded-xl transition-all shadow-xs"
              >
                <Edit3 className="w-4 h-4 text-[#7668D8]" /> Edit Company Profile
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Business Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* General Information */}
          <div className="bg-white rounded-2xl border border-[#EAE3D9] p-6 shadow-sm">
            <h2 className="text-base font-semibold text-[#20284F] mb-4 pb-3 border-b border-[#EAE3D9]/60 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#7668D8]" /> Business Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-[#20284F]/50 uppercase tracking-wider mb-1">Company Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.companyName}
                    onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                    className="w-full text-sm border border-[#EAE3D9] rounded-xl p-2.5 bg-white text-[#20284F] focus:ring-2 focus:ring-[#7668D8]/20 focus:border-[#7668D8] focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-[#20284F]">{profileData.companyName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#20284F]/50 uppercase tracking-wider mb-1">Tax ID / EIN / GST</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.taxId}
                    onChange={(e) => setProfileData({ ...profileData, taxId: e.target.value })}
                    className="w-full text-sm border border-[#EAE3D9] rounded-xl p-2.5 bg-white text-[#20284F] focus:ring-2 focus:ring-[#7668D8]/20 focus:border-[#7668D8] focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-[#20284F]">{profileData.taxId}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#20284F]/50 uppercase tracking-wider mb-1">Business Type</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.businessType}
                    onChange={(e) => setProfileData({ ...profileData, businessType: e.target.value })}
                    className="w-full text-sm border border-[#EAE3D9] rounded-xl p-2.5 bg-white text-[#20284F] focus:ring-2 focus:ring-[#7668D8]/20 focus:border-[#7668D8] focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-[#20284F]">{profileData.businessType}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#20284F]/50 uppercase tracking-wider mb-1">Year Established</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.yearEstablished}
                    onChange={(e) => setProfileData({ ...profileData, yearEstablished: e.target.value })}
                    className="w-full text-sm border border-[#EAE3D9] rounded-xl p-2.5 bg-white text-[#20284F] focus:ring-2 focus:ring-[#7668D8]/20 focus:border-[#7668D8] focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-[#20284F]">{profileData.yearEstablished}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-2xl border border-[#EAE3D9] p-6 shadow-sm">
            <h2 className="text-base font-semibold text-[#20284F] mb-4 pb-3 border-b border-[#EAE3D9]/60 flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#7668D8]" /> Contact Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-[#20284F]/50 uppercase tracking-wider mb-1">Primary Representative</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.contactPerson}
                    onChange={(e) => setProfileData({ ...profileData, contactPerson: e.target.value })}
                    className="w-full text-sm border border-[#EAE3D9] rounded-xl p-2.5 bg-white text-[#20284F] focus:ring-2 focus:ring-[#7668D8]/20 focus:border-[#7668D8] focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-[#20284F]">{profileData.contactPerson}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#20284F]/50 uppercase tracking-wider mb-1">Work Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full text-sm border border-[#EAE3D9] rounded-xl p-2.5 bg-white text-[#20284F] focus:ring-2 focus:ring-[#7668D8]/20 focus:border-[#7668D8] focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-[#20284F]">{profileData.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#20284F]/50 uppercase tracking-wider mb-1">Phone Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full text-sm border border-[#EAE3D9] rounded-xl p-2.5 bg-white text-[#20284F] focus:ring-2 focus:ring-[#7668D8]/20 focus:border-[#7668D8] focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-[#20284F]">{profileData.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#20284F]/50 uppercase tracking-wider mb-1">Website</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.website}
                    onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                    className="w-full text-sm border border-[#EAE3D9] rounded-xl p-2.5 bg-white text-[#20284F] focus:ring-2 focus:ring-[#7668D8]/20 focus:border-[#7668D8] focus:outline-none"
                  />
                ) : (
                  <a href={profileData.website} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#7668D8] hover:underline">
                    {profileData.website}
                  </a>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#20284F]/50 uppercase tracking-wider mb-1">Registered Address</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    className="w-full text-sm border border-[#EAE3D9] rounded-xl p-2.5 bg-white text-[#20284F] focus:ring-2 focus:ring-[#7668D8]/20 focus:border-[#7668D8] focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-[#20284F]">{profileData.address}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Trust & Badges */}
        <div className="space-y-8">
          {/* Verification & Trust */}
          <div className="bg-white rounded-2xl border border-[#EAE3D9] p-6 shadow-sm">
            <h2 className="text-base font-semibold text-[#20284F] mb-4 pb-3 border-b border-[#EAE3D9]/60 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" /> Trust & Certifications
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF6F0] border border-[#EAE3D9]/60">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h4 className="text-xs font-semibold text-[#20284F]">Tax Identity Verified</h4>
                    <p className="text-[11px] text-[#20284F]/60">Government Record Match</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Active</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF6F0] border border-[#EAE3D9]/60">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-[#7668D8]" />
                  <div>
                    <h4 className="text-xs font-semibold text-[#20284F]">ISO 9001:2015 Certified</h4>
                    <p className="text-[11px] text-[#20284F]/60">Quality Management</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold text-[#7668D8] bg-[#7668D8]/10 px-2 py-0.5 rounded border border-[#7668D8]/20">Verified</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF6F0] border border-[#EAE3D9]/60">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-[#E88AAE]" />
                  <div>
                    <h4 className="text-xs font-semibold text-[#20284F]">Verified Escrow Account</h4>
                    <p className="text-[11px] text-[#20284F]/60">Bank Account Linked</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold text-[#E88AAE] bg-[#E88AAE]/10 px-2 py-0.5 rounded border border-[#E88AAE]/20">Linked</span>
              </div>
            </div>
          </div>

          {/* Product Categories */}
          <div className="bg-white rounded-2xl border border-[#EAE3D9] p-6 shadow-sm">
            <h2 className="text-base font-semibold text-[#20284F] mb-4 pb-3 border-b border-[#EAE3D9]/60 flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-[#7668D8]" /> Supply Capabilities
            </h2>

            <div className="flex flex-wrap gap-2">
              {profileData.categories.map((cat, idx) => (
                <span key={idx} className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#FAF6F0] text-[#20284F] border border-[#EAE3D9]">
                  {cat}
                </span>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-[#EAE3D9]/60">
              <span className="block text-xs font-semibold text-[#20284F]/50 uppercase tracking-wider mb-1">Standard Payment Terms</span>
              <p className="text-xs font-medium text-[#20284F]">{profileData.paymentTerms}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerProfilePage;
