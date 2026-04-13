import React, { useState } from 'react';
import { swalSuccess, swalError, swalWarning, swalInfo, swalConfirm, swalCredentials, swalCopied } from '../../utils/swal';
import { useData } from '../../context/GlobalDataContext';
import { ShoppingCart, Search, Filter, Plus, Minus, X, Check, Package, DollarSign, FileText, ChevronRight, Zap, Truck, Tag, Trash2, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

const ClientStore = () => {
    const { inventory, cart, addToCart, removeFromCart, clearCart, addOrder, currentUser, clients, fetchInventory } = useData();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('catalog');
    const [customItems, setCustomItems] = useState([{ name: '', qty: 1, price: 0 }]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [destination, setDestination] = useState(currentUser?.location || 'Port Hercule');

    React.useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    React.useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab === 'sheet' || tab === 'custom') {
            setActiveTab('sheet');
        } else if (tab === 'catalog') {
            setActiveTab('catalog');
        }
    }, [location]);

    const marketplaceInventory = inventory.filter(item => item.inventoryType === 'Marketplace' || !item.inventoryType);

    const filteredInventory = marketplaceInventory.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const addCustomRow = () => setCustomItems([...customItems, { name: '', qty: 1, price: 0 }]);
    const removeCustomRow = (index) => setCustomItems(customItems.filter((_, i) => i !== index));
    const updateCustomItem = (index, field, value) => {
        const newItems = [...customItems];
        newItems[index][field] = value;
        setCustomItems(newItems);
    };

    const cartTotal = activeTab === 'catalog'
        ? cart.reduce((acc, item) => acc + (item.price * item.qty), 0)
        : customItems.reduce((acc, item) => acc + (parseFloat(item.price || 0) * (parseInt(item.qty) || 0)), 0);

    const [deliveryMode, setDeliveryMode] = useState('Road');

    const myClient = (clients || []).find(c => {
        const cId = String(c.id).replace('CLT-', '');
        const uId = String(currentUser?.clientId).replace('CLT-', '');
        return (currentUser?.clientId && cId === uId) ||
            (currentUser?.email && c.email?.toLowerCase() === currentUser.email?.toLowerCase()) ||
            (currentUser?.name && c.name?.toLowerCase() === currentUser.name?.toLowerCase());
    });

    const handleCheckout = () => {
        const items = activeTab === 'catalog'
            ? cart.map(i => ({ name: i.name, qty: i.qty, price: i.price, vendorName: i.vendorName }))
            : customItems.filter(i => i.name.trim() !== '').map(i => ({ name: i.name, qty: parseInt(i.qty), price: parseFloat(i.price || 0), custom: true }));

        if (items.length === 0) {
            swalWarning('Empty Manifest', 'Manifest must contain at least one item.');
            return;
        }

        const isBespoke = activeTab === 'sheet';
        const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

        const orderData = {
            id: orderId,
            client: myClient?.name || currentUser?.name || 'Client',
            clientId: myClient?.id || currentUser.clientId || 1,
            items: items,
            total: cartTotal,
            status: 'Pending Review',
            deliveryType: deliveryMode,
            location: isBespoke ? destination : (currentUser.location || 'Client Hub'),
            date: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
            orderType: isBespoke ? 'Bespoke Manifest' : 'Marketplace Protocol'
        };

        addOrder(orderData);
        if (activeTab === 'catalog') clearCart();
        else setCustomItems([{ name: '', qty: 1, price: 0 }]);

        setIsCartOpen(false);
        swalSuccess('Order Submitted', 'Order submitted for review.');
        navigate('/dashboard/client-orders');
    };

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="space-y-6 sm:space-y-10 pb-20">
            {/* Header section... */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-white italic uppercase leading-none">
                        ZaneZion <span className="text-accent underline decoration-white/10 underline-offset-8">Concierge</span> Portal
                    </h1>
                    <p className="text-secondary text-[10px] sm:text-xs mt-4 font-black uppercase tracking-[0.4em] opacity-80 italic">Global Logistics & Bespoke Procurement Network</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex flex-col items-end px-6 border-r border-white/10">
                        <span className="text-[10px] font-black text-muted uppercase tracking-widest">Client Identity</span>
                        <span className="text-sm font-bold text-accent uppercase italic">{currentUser?.name || 'Client'}</span>
                    </div>
                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="relative p-5 sm:p-6 bg-accent/10 border border-accent/30 rounded-[2rem] text-accent hover:bg-accent hover:text-black transition-all shadow-2xl shadow-accent/5 group"
                    >
                        <ShoppingCart size={24} className="group-hover:scale-110 transition-transform" />
                        {cart.length > 0 && (
                            <span className="absolute top-2 right-2 w-6 h-6 bg-white text-black border-2 border-accent text-[10px] font-black rounded-full flex items-center justify-center animate-bounce">
                                {cart.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-4 bg-white/5 p-2 rounded-[2.5rem] border border-white/5 w-fit">
                <button
                    onClick={() => setActiveTab('catalog')}
                    className={`px-8 py-3.5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'catalog' ? 'bg-accent text-black shadow-xl shadow-accent/20' : 'text-muted hover:text-white'}`}
                >
                    Elite Catalog
                </button>
                <button
                    onClick={() => setActiveTab('sheet')}
                    className={`px-8 py-3.5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'sheet' ? 'bg-accent text-black shadow-xl shadow-accent/20' : 'text-muted hover:text-white'}`}
                >
                    Bespoke Manifest
                </button>
            </div>

            {activeTab === 'catalog' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {filteredInventory.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden group hover:border-accent/30 transition-all duration-500 shadow-xl"
                        >
                            <div className="aspect-[4/3] sm:aspect-square bg-white/5 border-b border-white/5 flex items-center justify-center relative">
                                <Package size={48} className="text-accent/20 group-hover:text-accent/40 group-hover:scale-110 transition-all duration-700" />
                                <div className="absolute top-4 right-4 px-3 py-1.5 bg-background/80 backdrop-blur-md border border-white/10 rounded-xl text-xs font-black text-accent shadow-2xl">
                                    ${parseFloat(item.price).toLocaleString()}
                                </div>
                            </div>

                            <div className="p-4 sm:p-5">
                                <h3 className="font-extrabold text-white truncate text-sm sm:text-base group-hover:text-accent transition-colors italic">{item.name}</h3>
                                <p className="text-[9px] sm:text-[10px] text-muted uppercase font-black tracking-widest mt-1 opacity-60">{item.category} <span className="mx-2 text-white/10">•</span> {item.location}</p>

                                <button
                                    onClick={() => addToCart(item)}
                                    className="w-full mt-5 py-3.5 sm:py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-accent hover:text-black hover:border-accent transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                >
                                    <Plus size={14} /> Add to Manifest
                                </button>
                            </div>
                        </div>
                    ))}


                    {filteredInventory.length === 0 && (
                        <div className="col-span-full py-32 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                            <Search size={64} strokeWidth={1} className="text-muted" />
                            <p className="text-sm font-black uppercase tracking-[0.3em]">No Assets Match Protocol</p>
                        </div>
                    )}
                </div>
            ) : (
                /* Custom Manifest Section - UPGRADED TO MATCH SCREENSHOT */
                <div className="bg-card/40 border border-white/5 rounded-[2.5rem] p-4 sm:p-10 space-y-10 backdrop-blur-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/30 to-transparent"></div>

                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        <div className="space-y-4 w-full lg:w-auto">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center text-accent">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-3">
                                        Custom <span className="text-accent">Aspirational</span> Manifest
                                    </h3>
                                    <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em] mt-1">Manual asset requisition protocol for non-catalog items.</p>
                                </div>
                            </div>

                            <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl max-w-md">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest block mb-2">Requesting Client</label>
                                <p className="text-sm font-bold text-accent italic uppercase">{currentUser?.name || 'Client'}</p>
                            </div>
                        </div>
                        <button
                            onClick={addCustomRow}
                            className="w-full lg:w-auto px-8 py-4 bg-accent/10 border border-accent/30 rounded-2xl text-accent text-[10px] font-black uppercase tracking-[0.25em] hover:bg-accent hover:text-black transition-all flex items-center justify-center gap-3 shadow-xl shadow-accent/5 group"
                        >
                            <Plus size={16} className="group-hover:rotate-90 transition-transform" /> ADD ITEM PROTOCOL
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-4">
                            {customItems.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ x: -10, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl group hover:border-accent/40 transition-all relative"
                                >
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                                        <div className="lg:col-span-5 space-y-2">
                                            <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-1">Item Name / Strategic Specs</label>
                                            <div className="relative">
                                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={14} />
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Vintage 1996 Dom Perignon..."
                                                    className="w-full bg-background border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:border-accent/50 outline-none font-bold transition-all"
                                                    value={item.name}
                                                    onChange={(e) => updateCustomItem(idx, 'name', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="lg:col-span-2 space-y-2">
                                            <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-1 text-center block">QTY</label>
                                            <div className="flex items-center gap-1 bg-background border border-white/10 rounded-2xl p-1">
                                                <button
                                                    onClick={() => updateCustomItem(idx, 'qty', Math.max(1, item.qty - 1))}
                                                    className="w-10 h-10 flex items-center justify-center text-muted hover:text-accent hover:bg-accent/10 rounded-xl transition-all"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <input
                                                    type="number"
                                                    className="w-full bg-transparent border-none p-0 text-center text-sm font-black text-white focus:ring-0"
                                                    value={item.qty}
                                                    onChange={(e) => updateCustomItem(idx, 'qty', parseInt(e.target.value) || 1)}
                                                />
                                                <button
                                                    onClick={() => updateCustomItem(idx, 'qty', item.qty + 1)}
                                                    className="w-10 h-10 flex items-center justify-center text-muted hover:text-accent hover:bg-accent/10 rounded-xl transition-all"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="lg:col-span-2 space-y-2">
                                            <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-1">Unit Price</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={14} />
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    className="w-full bg-background border border-white/5 rounded-2xl pl-10 pr-4 py-4 text-sm text-white focus:border-accent/50 outline-none font-bold transition-all"
                                                    value={item.price}
                                                    onChange={(e) => updateCustomItem(idx, 'price', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="lg:col-span-2 space-y-2">
                                            <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-1">Line Total</label>
                                            <div className="w-full bg-accent/5 border border-accent/10 rounded-2xl px-5 py-4 text-sm text-accent font-black">
                                                ${(parseFloat(item.price || 0) * (parseInt(item.qty) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>

                                        <div className="lg:col-span-1">
                                            <button
                                                onClick={() => removeCustomRow(idx)}
                                                className="w-full h-14 flex items-center justify-center text-muted hover:text-danger hover:bg-danger/10 rounded-2xl transition-all group/del"
                                                disabled={customItems.length === 1}
                                            >
                                                <Trash2 size={20} className="group-hover/del:scale-110 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-8 pt-8 border-t border-white/5">
                        <div className="flex-1 max-w-md space-y-2">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Destination Address / Port</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-accent" size={16} />
                                <input
                                    type="text"
                                    placeholder="Enter secure drop location..."
                                    className="w-full bg-background border border-white/10 rounded-3xl pl-12 pr-4 py-4 text-sm text-white focus:border-accent/50 outline-none font-bold transition-all shadow-inner"
                                    value={destination}
                                    onChange={(e) => setDestination(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-6 bg-accent/[0.03] border border-accent/20 p-6 rounded-[2rem] min-w-[300px] justify-between">
                            <div>
                                <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-1 italic">Grand Total (Estimated)</p>
                                <div className="flex items-center gap-1.5 text-success font-bold text-[10px]">
                                    <Zap size={10} className="fill-success" /> Institutional Rate
                                </div>
                            </div>
                            <p className="text-4xl font-black text-white italic tracking-tighter">${cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>

                    <div className="pt-10 flex flex-col xl:flex-row items-center justify-between gap-10">
                        <div className="w-full xl:w-auto space-y-5">
                            <div className="flex items-center gap-3">
                                <Truck size={18} className="text-accent" />
                                <label className="text-[10px] font-black text-accent uppercase tracking-[0.4em]">Logistics Protocol Selection</label>
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                                {['Road', 'Sea', 'Air'].map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => setDeliveryMode(mode)}
                                        className={`px-10 py-5 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.25em] border transition-all duration-300 relative overflow-hidden group ${deliveryMode === mode
                                            ? 'bg-accent/10 border-accent text-accent shadow-lg shadow-accent/5'
                                            : 'bg-white/[0.02] border-white/5 text-muted/60 hover:border-white/20 hover:text-white'
                                            }`}
                                    >
                                        {deliveryMode === mode && (
                                            <span className="absolute top-0 left-0 w-1.5 h-full bg-accent"></span>
                                        )}
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={customItems.every(i => i.name.trim() === '')}
                            className="w-full xl:w-auto px-14 py-6 bg-accent text-black rounded-[2.2rem] font-black uppercase tracking-[0.3em] text-xs hover:shadow-[0_25px_50px_-12px_rgba(200,169,106,0.6)] active:scale-[0.98] transition-all disabled:opacity-20 flex items-center justify-center gap-5 group"
                        >
                            SUBMIT REQUISITION <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            )}


            {/* Cart Drawer */}
            <AnimatePresence>
                {isCartOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCartOpen(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 right-0 w-full sm:max-w-[450px] bg-sidebar border-l border-white/5 z-[101] flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] h-screen overflow-hidden"
                        >
                            <div className="p-6 sm:p-8 border-b border-white/5 flex items-center justify-between shrink-0 bg-gradient-to-br from-white/[0.02] to-transparent">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-extrabold flex items-center gap-3 text-white">
                                        <ShoppingCart size={22} className="text-accent" /> Checkout <span className="text-accent">Manifest</span>
                                    </h3>
                                    <p className="text-[9px] font-black text-muted uppercase tracking-[0.3em]">Institutional Procurement</p>
                                </div>
                                <button onClick={() => setIsCartOpen(false)} className="w-12 h-12 flex items-center justify-center hover:bg-white/5 rounded-2xl text-muted transition-all border border-transparent hover:border-white/10 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-5 custom-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(200,169,106,0.03),transparent)]">
                                {cart.length > 0 ? cart.map((item) => (
                                    <motion.div
                                        layout
                                        key={item.id}
                                        className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-between gap-4 group hover:border-accent/20 transition-all shadow-xl"
                                    >
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="w-12 h-12 bg-background border border-white/5 rounded-xl flex items-center justify-center text-accent/40 group-hover:text-accent shrink-0 transition-colors">
                                                <Package size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-[13px] font-bold text-white truncate group-hover:text-accent transition-colors">{item.name}</h4>
                                                <p className="text-[9px] text-muted/60 uppercase font-black tracking-widest truncate mt-0.5">{item.vendorName}</p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="text-[11px] font-black text-accent bg-accent/10 px-2 py-0.5 rounded-md self-start font-mono">${item.price.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 bg-background/80 p-1 rounded-xl border border-white/10 shadow-inner">
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="w-8 h-8 flex items-center justify-center hover:bg-danger/20 hover:text-danger rounded-lg transition-all text-muted/40"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="text-[11px] font-black w-6 text-center text-white">{item.qty}</span>
                                            <button
                                                onClick={() => addToCart(item)}
                                                className="w-8 h-8 flex items-center justify-center hover:bg-success/20 hover:text-success rounded-lg transition-all text-muted/40"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </motion.div>
                                )) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                                        <div className="w-24 h-24 bg-white/[0.02] border border-white/5 rounded-full flex items-center justify-center text-muted/20">
                                            <Package size={48} strokeWidth={1} />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted italic">Manifest is Empty</p>
                                            <p className="text-[10px] text-muted/40 uppercase tracking-widest max-w-[180px]">Requisition required to proceed with logistics portal.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 sm:p-8 border-t border-white/5 bg-sidebar shrink-0 space-y-6 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 blur-[80px] -mr-20 -mt-20"></div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between ml-1">
                                        <p className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">Logistics Protocol</p>
                                        <span className="text-[8px] text-muted font-black uppercase tracking-widest">{deliveryMode} Selected</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-white">
                                        {['Road', 'Sea', 'Air'].map(mode => (
                                            <button
                                                key={mode}
                                                onClick={() => setDeliveryMode(mode)}
                                                className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all relative overflow-hidden ${deliveryMode === mode
                                                    ? 'bg-accent text-black border-accent'
                                                    : 'bg-white/[0.03] border-white/5 text-muted hover:border-white/10 hover:text-white'
                                                    }`}
                                            >
                                                {mode}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center bg-white/[0.03] p-5 rounded-3xl border border-white/5 shadow-inner">
                                    <div className="space-y-1">
                                        <span className="text-muted text-[9px] uppercase font-black tracking-[0.3em] ml-1">Manifest Valuation</span>
                                        <div className="flex items-center gap-1.5 text-success font-bold text-[10px] ml-1">
                                            <Zap size={10} className="fill-success" /> Institutional Rate
                                        </div>
                                    </div>
                                    <span className="text-3xl font-black text-white tracking-tight">${cartTotal.toLocaleString()}</span>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    disabled={cart.length === 0}
                                    className="w-full py-5 bg-accent text-black rounded-[1.8rem] font-black uppercase tracking-[0.3em] text-[11px] hover:shadow-[0_20px_40px_-10px_rgba(200,169,106,0.4)] transition-all disabled:opacity-20 active:scale-[0.98] flex items-center justify-center gap-4 group"
                                >
                                    Confirm Dispatch <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div >
    );
};

export default ClientStore;
