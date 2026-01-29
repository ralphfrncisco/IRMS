import React, { useState, useMemo, useEffect } from 'react';
import { X, Calendar, Plus, Trash2, PhilippinePeso, Image as ImageIcon, Loader2 } from 'lucide-react';
import AddItemModal from './AddItemModal';
import { supabase } from "../../lib/supabase";

function EditPurchaseModal({ isOpen, onClose, orderData }) {
    const [isAddItemOpen, setIsAddItemOpen] = useState(false);
    const [purchaseItems, setPurchaseItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [receiptPreview, setReceiptPreview] = useState(null);
    const [formValues, setFormValues] = useState({
        PONumber: '',
        customer: '',
        transactionDate: '',
        remarks: '',
        amount: '',
        remainingBalance: '',
    });

    const formatInputCurrency = (value) => {
        if (!value || value === '0') return '';
        const cleanValue = value.toString().replace(/[^0-9.]/g, '');
        const parts = cleanValue.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        if (parts.length > 1) return `${parts[0]}.${parts[1].substring(0, 2)}`;
        return parts[0];
    };

    const formatDisplayDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Helper function to generate image URL from filename
    const getImageUrl = (path) => {
        if (!path) return null;
        
        // If it's already a full URL (legacy records), return it
        if (path.startsWith('http')) return path; 
        
        // Generate public URL from filename stored in 'receipts' bucket
        const { data } = supabase.storage
            .from('receipts')
            .getPublicUrl(path);
        
        return data?.publicUrl || null;
    };

    useEffect(() => {
        const fetchOrderData = async () => {
            if (!orderData?.order_id || !isOpen) return;
            
            try {
                setLoading(true);
                
                // Fetch sale data
                const { data: sale, error: saleError } = await supabase
                    .from('SalesTable')
                    .select('*')
                    .eq('order_id', orderData.order_id)
                    .single();

                if (saleError) throw saleError;

                // Fetch purchased items
                const { data: items, error: itemsError } = await supabase
                    .from('purchasedItems')
                    .select('*')
                    .eq('order_id', orderData.order_id);

                if (itemsError) throw itemsError;

                if (sale) {
                    setFormValues({
                        PONumber: `ORD-${sale.order_id.toString().padStart(4, '0')}`,
                        customer: sale.customer || '',
                        transactionDate: sale.date || '',
                        remarks: sale.remarks || '',
                        amount: formatInputCurrency(sale.amount || 0),
                        remainingBalance: sale.remaining_balance || 0,
                    });

                    // Generate image URL from filename
                    const imageUrl = getImageUrl(sale.receipt_image);
                    setReceiptPreview(imageUrl);
                    
                    setPurchaseItems(items.map(item => ({
                        id: item.id,
                        name: item.product_name,
                        price: item.amount,
                        quantity: item.quantity,
                        total: (item.amount * item.quantity)
                    })));
                }
            } catch (err) {
                console.error("Error fetching order details:", err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOrderData();
    }, [isOpen, orderData]);

    const handleViewFullImage = () => {
        if (receiptPreview) {
            const newTab = window.open();
            newTab.document.body.innerHTML = `
                <body style="margin:0; background: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 100vh;">
                    <img src="${receiptPreview}" style="max-width: 100%; max-height: 100vh; object-fit: contain; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);" />
                </body>
            `;
            newTab.document.title = `Receipt - ${formValues.PONumber}`;
        }
    };

    const totalAmount = useMemo(() => {
        return purchaseItems.reduce((sum, item) => sum + (item.total || 0), 0);
    }, [purchaseItems]);

    // Update Remaining Balance automatically
    useEffect(() => {
        const parseNum = (val) => parseFloat(val.toString().replace(/,/g, '')) || 0;
        const amountPaid = parseNum(formValues.amount);
        const newBalance = totalAmount - amountPaid;
        setFormValues(prev => ({
            ...prev,
            remainingBalance: newBalance > 0 ? formatInputCurrency(newBalance.toFixed(2)) : '0.00'
        }));
    }, [totalAmount, formValues.amount]);

    const handleAddItem = (newItems) => {
        setPurchaseItems(prev => {
            const updatedList = [...prev];
            newItems.forEach(newItem => {
                const existingIndex = updatedList.findIndex(item => item.name === newItem.name);
                if (existingIndex > -1) {
                    const existingItem = updatedList[existingIndex];
                    const newQty = Number(existingItem.quantity) + Number(newItem.quantity);
                    updatedList[existingIndex] = { ...existingItem, quantity: newQty, total: existingItem.price * newQty };
                } else {
                    updatedList.push(newItem);
                }
            });
            return updatedList;
        });
    };

    const handleRemoveItem = (id) => {
        setPurchaseItems(prev => prev.filter(item => item.id !== id));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'amount') {
            setFormValues(prev => ({ ...prev, [name]: formatInputCurrency(value) }));
            return;
        }
        setFormValues(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsUpdating(true); // Start "Updating" status
            const parseNum = (val) => parseFloat(val.toString().replace(/,/g, '')) || 0;
            const parsedAmount = parseNum(formValues.amount);
            const parsedBalance = parseNum(formValues.remainingBalance);

            // Update sale record
            const { error: updateError } = await supabase
                .from('SalesTable')
                .update({
                    customer: formValues.customer,
                    date: formValues.transactionDate,
                    amount: parsedAmount,
                    remaining_balance: parsedBalance,
                    remarks: formValues.remarks,
                    status: parsedBalance <= 0 ? "Fully Paid" : "With Balance",
                    purchased_items: purchaseItems.map(i => `${i.quantity}x ${i.name}`).join(', ')
                })
                .eq('order_id', orderData.order_id);

            if (updateError) throw updateError;
            
            // Delete existing items
            await supabase.from('purchasedItems').delete().eq('order_id', orderData.order_id);
            
            // Insert updated items
            const itemsToInsert = purchaseItems.map(item => ({
                order_id: orderData.order_id,
                product_name: item.name,
                amount: item.price,
                quantity: item.quantity
            }));
            await supabase.from('purchasedItems').insert(itemsToInsert);
            
            onClose();
        } catch (err) {
            alert("Error updating transaction: " + err.message);
        } finally {
            setIsUpdating(false); // Reset status
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex py-4 items-center justify-center">
            <div className="flex flex-col h-full md:max-h-[100vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl mx-2 border border-slate-200 dark:border-slate-800 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="w-full flex items-center justify-between p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Invoice Details</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Reviewing {formValues.PONumber}</p>
                    </div>
                    <button 
                        type = "button"
                        onClick={(e) => {
                        e.preventDefault();
                        onClose();
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all cursor-pointer">
                        <X className="w-6 h-6 text-slate-500 dark:text-slate-400"/>
                    </button>
                </div>

                {loading ? (
                    <div className="flex-grow flex flex-col items-center justify-center">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                        <p className="text-slate-500 text-sm">Loading Order Data...</p>
                    </div>
                ) : (
                    <form id="purchase-form" onSubmit={handleFormSubmit} className="flex-grow overflow-y-auto p-4 md:p-6 space-y-8">
                        {/* Top Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Order ID</label>
                                <input type="text" value={formValues.PONumber} readOnly className="w-full text-slate-700 dark:text-slate-200 px-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Customer</label>
                                <input type="text" name="customer" value={formValues.customer} onChange={handleInputChange} className="w-full text-slate-700 dark:text-slate-200 px-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                                <input 
                                    type="text" 
                                    name="transactionDate" 
                                    value={formatDisplayDate(formValues.transactionDate)}
                                    onChange={handleInputChange} 
                                    onClick={(e) => e.stopPropagation()}
                                    readOnly
                                className="w-full text-slate-700 dark:text-slate-200 px-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800" />
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Purchased Products</h3>
                                <button type="button" onClick={() => setIsAddItemOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 cursor-pointer">
                                    <Plus className="w-5 h-5" /> Add Item
                                </button>
                            </div>
                            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                                <table className="w-full">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                                        <tr className="text-xs font-bold text-slate-500 uppercase">
                                            <th className="p-3 text-left pl-6">Product</th>
                                            <th className="p-3 text-center">Price</th>
                                            <th className="p-3 text-center">Qty</th>
                                            <th className="p-3 text-center">Total</th>
                                            <th className="p-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {purchaseItems.map((item) => (
                                            <tr key={item.id || item.name} className="text-sm dark:text-slate-300">
                                                <td className="p-3 pl-6">{item.name}</td>
                                                <td className="p-3 text-center">₱{Number(item.price).toLocaleString()}</td>
                                                <td className="p-3 text-center">{item.quantity}</td>
                                                <td className="p-3 text-center font-semibold">₱{Number(item.total).toLocaleString()}</td>
                                                <td className="p-3 text-center">
                                                    <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-blue-50/30 dark:bg-blue-900/10 font-bold">
                                            <td colSpan="3" className="p-3 text-right text-xs uppercase text-slate-500 pr-4">Grand Total</td>
                                            <td className="p-3 text-center text-blue-600 dark:text-blue-400 text-base">₱{totalAmount.toLocaleString()}</td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Bottom Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Receipt Image</label>
                                <div className="relative aspect-[4/3] w-full rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center overflow-hidden group">
                                    {receiptPreview ? (
                                        <>
                                            <img 
                                                src={receiptPreview} 
                                                alt="Receipt" 
                                                onError={(e) => {
                                                    console.error('Image failed to load:', receiptPreview);
                                                    e.target.style.display = 'none';
                                                }}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button type="button" onClick={handleViewFullImage} className="bg-white text-slate-900 px-4 py-2 rounded-lg text-xs font-bold shadow-lg hover:bg-slate-100 transition-all cursor-pointer">
                                                    View Full Size
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center p-4">
                                            <ImageIcon className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-50" />
                                            <p className="text-xs text-slate-500">No receipt found</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="col-span-2 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount Paid</label>
                                        <div className="relative">
                                            <PhilippinePeso className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                            <input type="text" name="amount" value={formValues.amount} onChange={handleInputChange} className="w-full text-slate-700 dark:text-slate-200 pl-9 pr-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 outline-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Remaining Balance</label>
                                        <div className="relative">
                                            <PhilippinePeso className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                            <input type="text" value={formValues.remainingBalance} readOnly className="w-full text-red-500 pl-9 pr-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-medium" />
                                        </div>
                                    </div>
                                </div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Admin Remarks</label>
                                <textarea name="remarks" rows="4" value={formValues.remarks} onChange={handleInputChange} className="w-full text-slate-700 dark:text-slate-200 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 outline-none resize-none"></textarea>
                            </div>
                        </div>
                    </form>
                )}

                {/* Footer Buttons */}
                <div className="p-4 md:p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-3 flex-shrink-0">
                    <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800/80 transition-colors cursor-pointer">Close</button>
                    <button 
                        type="submit" 
                        form="purchase-form" 
                        disabled={isUpdating}
                        className="flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-lg active:scale-95 transition-all cursor-pointer disabled:bg-blue-500 disabled:cursor-not-allowed"
                    >
                        {isUpdating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            'Update Invoice'
                        )}
                    </button>                
                </div>
            </div>
            <AddItemModal isOpen={isAddItemOpen} onClose={() => setIsAddItemOpen(false)} onAdd={handleAddItem} />
        </div>
    );
}

export default EditPurchaseModal;