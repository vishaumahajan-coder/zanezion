import React, { useState } from 'react';
import { swalSuccess, swalError, swalWarning, swalInfo, swalConfirm, swalCredentials, swalCopied } from '../../utils/swal';
import { LIFESTYLE_SERVICES } from '../../utils/data';
import { Check, Star, Shield, Home, Building2, ChevronRight, Zap, Loader2, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import Modal from '../../components/Modal';

import { useData } from '../../context/GlobalDataContext';

const Plans = () => {
    const { activePlan, setActivePlan, addLog, accessPlans, fetchAccessPlans, dispatchSubscriptionRequest } = useData();
    const [activatingPlan, setActivatingPlan] = useState(null);
    const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'yearly'
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [requestFormData, setRequestFormData] = useState({ companyName: '', contactPerson: '', email: '', phone: '', country: '', requirements: '' });

    const handleActivate = (plan) => {
        if (plan.name === activePlan) return;
        setSelectedPlan(plan);
        setRequestFormData({ ...requestFormData, email: '', requirements: '' });
        setIsRequestModalOpen(true);
    };

    const handleRequestSubmit = (e) => {
        e.preventDefault();
        setActivatingPlan(selectedPlan.name);

        dispatchSubscriptionRequest({
            clientName: requestFormData.companyName,
            companyName: requestFormData.companyName,
            plan: selectedPlan.name,
            contactPerson: requestFormData.contactPerson,
            email: requestFormData.email,
            phone: requestFormData.phone,
            country: requestFormData.country,
            requirements: requestFormData.requirements
        });

        setTimeout(() => {
            setIsRequestModalOpen(false);
            setActivatingPlan(null);
            swalSuccess('Request Submitted', 'Our auditors will review your application within 24 hours.');
        }, 1500);
    };

    React.useEffect(() => {
        fetchAccessPlans();
    }, [fetchAccessPlans]);

    return (
        <div className="space-y-12 pb-12">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sidebar to-background p-8 lg:p-12 border border-accent/10 min-h-[300px] flex items-center">
                <div className="absolute inset-0 z-0">
                    <img
                        src="/luxury_lifestyle_1.png"
                        alt="Luxury Lifestyle"
                        className="w-full h-full object-cover opacity-30 mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-sidebar via-sidebar/80 to-transparent"></div>
                </div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10 max-w-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-[0_0_18px_rgba(200,169,106,0.45)] overflow-hidden shrink-0 ring-2 ring-[#C8A96A] ring-offset-2 ring-offset-sidebar">
                            <img src="/logo.png" alt="ZaneZion" className="w-full h-full object-contain scale-[2.4]" />
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-bold text-white tracking-tight">
                            ZaneZion <span className="text-accent underline decoration-accent/30 underline-offset-8">Lifestyle</span>
                        </h1>
                    </div>
                    <p className="text-secondary text-lg leading-relaxed">
                        Elevated logistics and lifestyle coordination tailored for the most discerning clients.
                    </p>
                </div>
            </div>

            {/* Services Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-white">
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {LIFESTYLE_SERVICES.map((section, idx) => (
                        <div key={idx} className="glass-card p-8 border-accent/10 relative overflow-hidden group h-full">
                            <div className="absolute top-0 left-0 w-1 h-full bg-accent scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top"></div>
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                                <Star className="text-accent fill-accent" size={20} /> {section.category}
                            </h2>
                            <div className="space-y-4">
                                {section.services.map((service) => (
                                    <div key={service.id} className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:border-accent/30 transition-all hover:translate-x-1 duration-300">
                                        <h3 className="font-bold text-white text-sm mb-1">{service.title}</h3>
                                        <p className="text-[11px] text-secondary leading-relaxed">{service.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Access Plans Header */}
            <div className="text-center space-y-4 pt-12">
                <h2 className="text-3xl font-bold text-white tracking-tight">SaaS Subscription Plans</h2>
                <p className="text-secondary max-w-xl mx-auto">
                    Professional logistics and concierge management software at every scale.
                </p>

                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-4 mt-8">
                    <span className={`text-sm font-bold ${billingCycle === 'monthly' ? 'text-accent' : 'text-muted'}`}>Monthly</span>
                    <button
                        onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                        className="w-14 h-7 bg-white/10 rounded-full relative p-1 transition-all"
                    >
                        <div className={`w-5 h-5 bg-accent rounded-full transition-all ${billingCycle === 'yearly' ? 'translate-x-7' : 'translate-x-0'}`} />
                    </button>
                    <span className={`text-sm font-bold ${billingCycle === 'yearly' ? 'text-accent' : 'text-muted'}`}>
                        Yearly <span className="text-[10px] bg-success/20 text-success px-2 py-0.5 rounded-full ml-1">Save 20%</span>
                    </span>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accessPlans.map((plan) => (
                    <motion.div
                        key={plan.id}
                        whileHover={{ y: -8 }}
                        className={`flex flex-col glass-card p-6 border-accent/10 relative h-full ${plan.id === 'professional' ? 'border-accent/40 shadow-[0_20px_40px_-15px_rgba(200,169,106,0.15)] bg-white/[0.04]' : ''
                            }`}
                    >
                        {plan.id === 'professional' && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent rounded-full text-[10px] font-black text-black uppercase tracking-wider z-20">
                                Best Value
                            </div>
                        )}

                        <div className="mb-8">
                            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center overflow-hidden mb-5 shadow-[0_0_18px_rgba(200,169,106,0.45)] ring-2 ring-[#C8A96A] ring-offset-2 ring-offset-card">
                                <img src="/logo.png" className="w-full h-full object-contain scale-[2.4]" alt="Logo" />
                            </div>
                            <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none mb-2">{plan.tier}</p>
                            <h3 className="text-xl font-bold text-white uppercase">{plan.name}</h3>
                        </div>

                        <div className="mb-6 pb-6 border-b border-white/5">
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-white">
                                    {billingCycle === 'monthly' ? plan.price : plan.yearlyPrice}
                                </span>
                                <span className="text-[10px] text-muted font-bold uppercase tracking-wider">
                                    / {billingCycle === 'monthly' ? 'month' : 'year'}
                                </span>
                            </div>
                            <p className="text-xs text-secondary mt-3 min-h-[40px] italic">
                                {plan.description}
                            </p>
                        </div>

                        <div className="flex-1 space-y-3 mb-8">
                            {plan.features.slice(0, 6).map((feature, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <Check className="text-accent shrink-0 mt-0.5" size={14} />
                                    <span className="text-xs text-secondary leading-tight">{feature}</span>
                                </div>
                            ))}
                            {plan.features.length > 6 && (
                                <p className="text-[10px] text-accent font-bold pl-5">+ Additional Premium Benefits</p>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                                <p className="text-[10px] text-muted font-bold tracking-tight mb-1">Commitment</p>
                                <p className="text-xs text-white font-medium">{plan.commitment}</p>
                            </div>
                            <button
                                onClick={() => handleActivate(plan)}
                                disabled={activatingPlan === plan.name || activePlan === plan.name}
                                className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activePlan === plan.name
                                    ? 'bg-success/20 text-success border border-success/30 cursor-default'
                                    : plan.id === 'exclusive'
                                        ? 'bg-accent text-black hover:bg-white shadow-lg'
                                        : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                                    }`}>
                                {activatingPlan === plan.name ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Processing Request...
                                    </>
                                ) : activePlan === plan.name ? (
                                    <>
                                        <Shield size={14} />
                                        Active Protocol
                                    </>
                                ) : (
                                    'Request Activation'
                                )}
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Clarification Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12">
                <div className="glass-card p-8 border-accent/20 bg-accent/[0.02]">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                        <Shield className="text-accent" size={24} /> Activation Protocol
                    </h3>
                    <p className="text-sm text-secondary leading-relaxed mb-4">
                        Upon activation, your ZaneZion Institutional instance is provisioned within 24 hours. The subscription facilitates:
                    </p>
                    <ul className="space-y-3">
                        <li className="flex gap-3 text-xs text-secondary">
                            <Zap size={14} className="text-accent shrink-0 mt-0.5" />
                            <span><strong>Full Portal Access:</strong> Clients see real-time inventory, fleet tracking, and lifestyle concierge tools.</span>
                        </li>
                        <li className="flex gap-3 text-xs text-secondary">
                            <Zap size={14} className="text-accent shrink-0 mt-0.5" />
                            <span><strong>Automated Billing:</strong> Institutional fees are calculated based on your asset volume and throughput.</span>
                        </li>
                    </ul>
                </div>

                <div className="glass-card p-8 border-accent/20 bg-accent/[0.02]">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                        <Building2 className="text-accent" size={24} /> Multi-Entity Support
                    </h3>
                    <p className="text-sm text-secondary leading-relaxed mb-4">
                        Manage disparate business interests under a single institutional umbrella:
                    </p>
                    <ul className="space-y-3">
                        <li className="flex gap-3 text-xs text-secondary">
                            <Check size={14} className="text-accent shrink-0 mt-0.5" />
                            <span><strong>Isolated Businesses:</strong> Charge institutional fees to separate legal entities (S-Corps, Trusts, LLPs).</span>
                        </li>
                        <li className="flex gap-3 text-xs text-secondary">
                            <Check size={14} className="text-accent shrink-0 mt-0.5" />
                            <span><strong>Custom Dashboards:</strong> Each sub-entity has its own filtered view of fleet, inventory, and procurement.</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="text-center">
            </div>

            <Modal
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                title={`Protocol Activation Request: ${selectedPlan?.name}`}
            >
                <form onSubmit={handleRequestSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-secondary">Institutional Name</label>
                            <input
                                type="text"
                                required
                                value={requestFormData.companyName}
                                onChange={(e) => setRequestFormData({ ...requestFormData, companyName: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent outline-none"
                                placeholder="Legal Entity Name"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-secondary">Audit Delegate</label>
                            <input
                                type="text"
                                required
                                value={requestFormData.contactPerson}
                                onChange={(e) => setRequestFormData({ ...requestFormData, contactPerson: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent outline-none"
                                placeholder="Head of Operations"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-secondary">Communication SSL</label>
                            <input
                                type="email"
                                required
                                value={requestFormData.email}
                                onChange={(e) => setRequestFormData({ ...requestFormData, email: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent outline-none"
                                placeholder="secure@institution.com"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-secondary">HQ Jurisdiction</label>
                            <input
                                type="text"
                                required
                                value={requestFormData.country}
                                onChange={(e) => setRequestFormData({ ...requestFormData, country: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent outline-none"
                                placeholder="e.g. Bahamas / USA"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-secondary">Operational Requirements</label>
                        <textarea
                            rows={3}
                            value={requestFormData.requirements}
                            onChange={(e) => setRequestFormData({ ...requestFormData, requirements: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent outline-none resize-none"
                            placeholder="Specify fleet volume, item categories, or custom mission protocols..."
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={activatingPlan}
                            className="w-full py-4 bg-accent text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white transition-all shadow-xl shadow-accent/10 flex items-center justify-center gap-2"
                        >
                            {activatingPlan ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            Dispatch Protocol Request
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Plans;
