import React, { useState, useEffect } from 'react';
import { swalSuccess, swalError, swalWarning, swalInfo, swalConfirm, swalCredentials, swalCopied } from '../../utils/swal';
import { User, Shield, Bell, Globe, CreditCard, Save, CheckCircle, Smartphone, Lock, LogOut, RotateCcw, Info, Map, Truck, DollarSign } from 'lucide-react';

import { useData } from '../../context/GlobalDataContext';

const Settings = () => {
  const { currentUser, setCurrentUser, updateUser, deliveryPricing, setDeliveryPricing, clients, updateClientBranding } = useData();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({ ...currentUser });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  // Get current client data if it's a client
  const clientData = ['client', 'saas_client'].includes(currentUser?.role) ? clients.find(c => c.id === (currentUser?.clientId || currentUser?.company_id)) : null;

  const [branding, setBranding] = useState({
    businessName: '',
    tagline: '',
    logo: ''
  });

  useEffect(() => {
    if (clientData) {
      setBranding({
        businessName: clientData.business_name || 'ZaneZion',
        tagline: clientData.tagline || 'Institutional management and luxury asset tracking.',
        logo: clientData.logo_url || '/logo.png'
      });
    }
  }, [clientData]);

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushNotifications: false,
    orderUpdates: true,
    securityLogs: true
  });

  const handleSync = () => {
    swalSuccess('Sync Successful', 'Permission Matrix deployed.');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedUser = { ...currentUser, ...profile };
      const success = await updateUser(updatedUser.id, updatedUser);
      if (success) {
        setCurrentUser(updatedUser);
        swalSuccess('Profile Updated', 'Institutional profile updated successfully.');
      }
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwords.current || !passwords.new) {
      swalWarning('Missing Fields', 'Please enter current and new passwords.');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      swalWarning('Mismatch', 'New passwords do not match.');
      return;
    }

    try {
      const success = await updateUser(currentUser.id, { password: passwords.new });
      if (success) {
        setPasswords({ current: '', new: '', confirm: '' });
        swalSuccess('Password Changed', 'Security protocol updated.');
      }
    } catch (error) {
      console.error("Password change failed:", error);
    }
  };

  const allTabs = [
    { id: 'profile', label: 'Profile', icon: User, roles: ['superadmin', 'client', 'saas_client', 'operations', 'logistics', 'procurement', 'inventory', 'concierge', 'finance', 'field_staff'] },
    { id: 'logistics', label: 'Logistics Protocol', icon: Truck, roles: ['superadmin', 'logistics'] },
    { id: 'security', label: 'Security', icon: Lock, roles: ['superadmin', 'client', 'saas_client', 'operations', 'logistics', 'procurement', 'inventory', 'concierge', 'finance', 'field_staff'] },
    { id: 'branding', label: 'White-Label Branding', icon: Globe, roles: ['superadmin', 'client', 'saas_client'] },
    { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['superadmin', 'client', 'saas_client'] },
    { id: 'billing', label: 'Billing', icon: CreditCard, roles: ['superadmin', 'client', 'saas_client'] },
  ];

  const userRole = localStorage.getItem('userRole');
  const tabs = allTabs.filter(tab => tab.roles.includes(userRole));

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-secondary mt-1">Manage institutional configurations and personal account preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="w-full lg:w-64 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === tab.id
                ? 'bg-accent text-black font-bold shadow-lg shadow-accent/20'
                : 'text-secondary hover:bg-white/5'
                }`}
            >
              <tab.icon size={20} />
              <span className="text-sm">{tab.label}</span>
            </button>
          ))}
          <div className="pt-4 mt-4 border-t border-border">
            <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="w-full flex items-center gap-3 px-4 py-3 text-danger hover:bg-danger/10 rounded-xl transition-all">
              <LogOut size={20} />
              <span className="text-sm font-bold">Log Out Session</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="glass-card p-6 lg:p-8">
                <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                  <User size={22} className="text-accent" /> Account Information
                </h3>

                <div className="flex flex-col md:flex-row gap-10 items-start">
                  <div className="relative group mx-auto md:mx-0">
                    <div className="w-32 h-32 bg-accent/10 border-2 border-accent/20 rounded-2xl flex items-center justify-center text-accent font-black text-4xl shadow-inner overflow-hidden">
                      {profile.name?.split(' ').map(n => n[0]).join('') || 'ZN'}
                    </div>
                    <button className="absolute -bottom-2 -right-2 p-2 bg-accent text-black rounded-lg shadow-xl hover:scale-110 transition-transform">
                      <Smartphone size={16} />
                    </button>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest">Full Name</label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="w-full bg-background border border-border rounded-xl px-5 py-3 text-sm focus:border-accent outline-none font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest">Email Address</label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="w-full bg-background border border-border rounded-xl px-5 py-3 text-sm focus:border-accent outline-none font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest">Organization Unit</label>
                      <input
                        type="text"
                        value={profile.location}
                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        className="w-full bg-background border border-border rounded-xl px-5 py-3 text-sm focus:border-accent outline-none font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest">Access Protocol</label>
                      <div className="w-full bg-white/[0.03] border border-border rounded-xl px-5 py-3 text-sm text-secondary font-bold flex items-center gap-2">
                        <Lock size={14} className="text-accent" /> {profile.role}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-2 text-muted">
                    <CheckCircle size={14} className="text-success" />
                    <span className="text-xs">Identity verified through enterprise AD</span>
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-primary flex items-center gap-3 px-8 shadow-lg shadow-accent/10"
                  >
                    {isSaving ? 'Processing...' : <><Save size={18} /> Update Profile</>}
                  </button>
                </div>
              </div>
            </div>
          )}


          {activeTab === 'logistics' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Truck size={22} className="text-accent" /> Delivery Pricing Settings
                    </h3>
                    <p className="text-xs text-secondary mt-1">Configure distance-based pricing protocols for institutional logistics.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4 pb-2 border-b border-white/5 text-[10px] font-black text-muted uppercase tracking-[0.2em]">
                    <div className="col-span-1">Min Distance (km)</div>
                    <div className="col-span-1">Max Distance (km)</div>
                    <div className="col-span-1 text-center">Protocol Rate ($)</div>
                    <div className="col-span-1 text-right">Actions</div>
                  </div>

                  {deliveryPricing.map((tier) => (
                    <div key={tier.id} className="grid grid-cols-4 gap-4 items-center p-4 bg-white/[0.02] border border-border rounded-xl group hover:border-accent/30 transition-all">
                      <div className="col-span-1 font-bold text-white">{tier.min} km</div>
                      <div className="col-span-1 font-bold text-white">{tier.max} km</div>
                      <div className="col-span-1 flex justify-center">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent font-bold">$</span>
                          <input
                            type="number"
                            value={tier.price}
                            onChange={(e) => {
                              const newPrice = e.target.value;
                              updateDeliveryPricing(tier.id, newPrice);
                            }}
                            className="bg-background border border-border rounded-lg pl-7 pr-4 py-2 w-32 text-sm font-black text-white focus:border-accent outline-none"
                          />
                        </div>
                      </div>
                      <div className="col-span-1 text-right">
                        <span className="text-[9px] font-black text-secondary uppercase tracking-widest italic">Institutional Tier</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-accent/5 border border-accent/20 rounded-xl flex items-start gap-4">
                  <div className="p-2 bg-accent/10 rounded-lg text-accent">
                    <Map size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Geospatial Intelligence Integration</p>
                    <p className="text-xs text-secondary leading-relaxed">System is configured to bridge with the <b>Google Maps Distance Matrix API</b>. Distance calculations will automatically apply the matching protocol rate upon dispatch initialization.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="glass-card p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                <Bell size={22} className="text-accent" /> Communication Matrix
              </h3>
              <div className="space-y-4">
                {[
                  { key: 'emailAlerts', title: 'High-Value Order Alerts', desc: 'Instant email for orders exceeding $10k threshold.' },
                  { key: 'pushNotifications', title: 'Real-time Logistics Pushes', desc: 'Critical updates on driver positioning and delays.' },
                  { key: 'orderUpdates', title: 'Vendor Confirmations', desc: 'Receipt of digital signatures from supply partners.' },
                  { key: 'securityLogs', title: 'Terminal Access Logs', desc: 'Weekly audit of system logins and sensitive modifications.' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-5 bg-white/[0.02] border border-border rounded-2xl hover:border-accent/10 transition-all">
                    <div>
                      <p className="font-bold text-white">{item.title}</p>
                      <p className="text-xs text-secondary mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                      className={`w-12 h-6 rounded-full transition-all relative ${notifications[item.key] ? 'bg-accent' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${notifications[item.key] ? 'right-1 bg-black' : 'left-1 bg-secondary'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="glass-card p-8">
                <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                  <Lock size={22} className="text-accent" /> Authentication & Security
                </h3>

                <form onSubmit={handlePasswordChange} className="max-w-md space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Current Encryption Key (Password)</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-5 py-3 text-sm focus:border-accent outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest">New Protocol Key</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={passwords.new}
                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                        className="w-full bg-background border border-border rounded-xl px-5 py-3 text-sm focus:border-accent outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest">Confirm New Key</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                        className="w-full bg-background border border-border rounded-xl px-5 py-3 text-sm focus:border-accent outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border mt-6">
                    <button type="submit" className="btn-primary w-full md:w-auto px-8">Update Security Key</button>
                  </div>
                </form>

                <div className="mt-12 p-6 bg-warning/5 border border-warning/10 rounded-2xl flex items-start gap-4">
                  <div className="p-2 bg-warning/10 rounded-lg text-warning">
                    <Shield size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">Security Recommendation</p>
                    <p className="text-xs text-secondary leading-relaxed mt-1">
                      Institutional accounts should use at least 12 characters with a mix of alphanumeric and special symbols.
                      Multi-Factor Authentication (MFA) is managed by the Super Admin level.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'branding' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="glass-card p-6 lg:p-8">
                <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                  <Globe size={22} className="text-accent" /> Institutional Branding (White-Label)
                </h3>
                <p className="text-xs text-secondary mb-8 -mt-6">Configure how your platform appears to your sub-users and staff.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest">Business Display Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Goldwynn Residences"
                        className="w-full bg-background border border-border rounded-xl px-5 py-3 text-sm focus:border-accent outline-none font-medium"
                        value={branding.businessName}
                        onChange={(e) => setBranding({ ...branding, businessName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest">Platform Tagline</label>
                      <input
                        type="text"
                        placeholder="e.g. Ultra-Luxury Living"
                        className="w-full bg-background border border-border rounded-xl px-5 py-3 text-sm focus:border-accent outline-none font-medium"
                        value={branding.tagline}
                        onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.01]">
                    <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mb-4 overflow-hidden shadow-2xl p-2">
                      <img src={branding.logo} className="w-full h-full object-contain brightness-0" alt="Logo Preview" />
                    </div>
                    <input
                      type="file"
                      id="logo-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setBranding({ ...branding, logo: reader.result });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <button
                      onClick={() => document.getElementById('logo-upload').click()}
                      className="text-[10px] font-black uppercase tracking-widest text-accent hover:underline"
                    >
                      Upload Custom Logo
                    </button>
                    <p className="text-[9px] text-muted mt-2 uppercase tracking-tight">SVG or PNG Preferred (Max 2MB)</p>
                  </div>
                </div>

                <div className="mt-12 pt-8 border-t border-border flex justify-end">
                  <button
                    onClick={() => {
                      if (['client', 'saas_client'].includes(currentUser?.role)) {
                        updateClientBranding(currentUser.clientId, branding);
                        swalSuccess('Success', "✅ Institutional Branding Updated: Changes are now live across your enterprise nodes.");
                      } else {
                        swalError('Access Denied', 'White-labeling is only for SaaS accounts.');
                      }
                    }}
                    className="btn-primary px-10"
                  >
                    Apply Branding
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="glass-card p-8 text-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CreditCard size={48} className="text-accent mx-auto mb-4 opacity-40" />
              <h3 className="text-xl font-bold">Financial Statements</h3>
              <p className="text-secondary text-sm max-w-sm mx-auto mt-2">Consolidated billing for all logistics and lifestyle services.</p>
              <button className="mt-8 btn-secondary">Request Statement PDF</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
