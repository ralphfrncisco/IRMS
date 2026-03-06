import React, { useState, useMemo, useEffect } from 'react';
import { X, Calendar, Plus, Trash2, PhilippinePeso, Image as ImageIcon, Loader2 } from 'lucide-react';
import AddItemModal from './AddItemModal';
import PaymentHistoryModal from './PaymentHistoryModal';
import { supabase } from "../../lib/supabase";

import { formatDateTime } from '../../utils/dateTimeFormatter';

function EditPurchaseModal({ isOpen, onClose, orderData }) {
    const [isAddItemOpen, setIsAddItemOpen] = useState(false);
    const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState(false);
    const [purchaseItems, setPurchaseItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [receiptPreview, setReceiptPreview] = useState(null);
    
    // ✅ Store original values (NEVER modified)
    const [originalValues, setOriginalValues] = useState({
        paidAmount: 0,
        remainingBalance: 0,
        totalAmount: 0
    });

    const [formValues, setFormValues] = useState({
        PONumber: '',
        customer: '',
        customerId: null,
        transactionDate: '',
        remarks: '',
        additionalPayment: '',
    });

    // ✅ Customer info (separate from sale)
    const [customerInfo, setCustomerInfo] = useState({
        full_name: '',
        total_balance: 0,
        credit_limit: 0
    });

    const formatInputCurrency = (value) => {
        if (!value || value === '0') return '';
        const cleanValue = value.toString().replace(/[^0-9.]/g, '');
        const parts = cleanValue.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        if (parts.length > 1) return `${parts[0]}.${parts[1].substring(0, 2)}`;
        return parts[0];
    };

    const formatDisplayDateTime = (dateTimeString) => {
        return formatDateTime(dateTimeString);
    };

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path; 
        
        const { data } = supabase.storage
            .from('receipts')
            .getPublicUrl(path);
        
        return data?.publicUrl || null;
    };

    // ✅ Calculate remaining balance using useMemo
    const calculatedRemainingBalance = useMemo(() => {
        const parseNum = (val) => {
            if (!val) return 0;
            return parseFloat(val.toString().replace(/,/g, '')) || 0;
        };
        
        const additionalPayment = parseNum(formValues.additionalPayment);
        
        if (formValues.additionalPayment !== '') {
            const newBalance = originalValues.remainingBalance - additionalPayment;
            return Math.max(0, newBalance);
        }
        
        return originalValues.remainingBalance;
    }, [formValues.additionalPayment, originalValues.remainingBalance]);

    // ✅ Calculate total paid using useMemo
    const calculatedTotalPaid = useMemo(() => {
        const parseNum = (val) => {
            if (!val) return 0;
            return parseFloat(val.toString().replace(/,/g, '')) || 0;
        };
        
        return originalValues.paidAmount + parseNum(formValues.additionalPayment);
    }, [formValues.additionalPayment, originalValues.paidAmount]);

    useEffect(() => {
        const fetchOrderData = async () => {
            if (!orderData?.order_id || !isOpen) return;
            
            try {
                setLoading(true);

                const { data: saleData, error: saleError } = await supabase
                    .from('SalesTable')
                    .select(`
                        *,
                        customers:customer_id (
                            customer_id,
                            full_name,
                            contact_number,
                            remaining_balance,
                            credit_limit
                        )
                    `)
                    .eq('order_id', orderData.order_id)
                    .single();

                if (saleError) throw saleError;

                const { data: items, error: itemsError } = await supabase
                    .from('purchasedItems')
                    .select('*')
                    .eq('order_id', orderData.order_id);

                if (itemsError) throw itemsError;

                setCustomerInfo({
                    full_name: saleData.customers?.full_name || 'Unknown Customer',
                    total_balance: saleData.customers?.remaining_balance || 0,
                    credit_limit: saleData.customers?.credit_limit || 0
                });

                // ✅ Store original values
                setOriginalValues({
                    paidAmount: saleData.paid_amount || 0,
                    remainingBalance: saleData.remaining_balance || 0,
                    totalAmount: saleData.total_amount || 0
                });

                setFormValues({
                    PONumber: `ORD-${saleData.order_id.toString().padStart(4, '0')}`,
                    customer: saleData.customers?.full_name || '',
                    customerId: saleData.customer_id,
                    transactionDate: saleData.created_at || '',
                    remarks: saleData.remarks || '',
                    additionalPayment: '',
                });

                const imageUrl = getImageUrl(saleData.receipt_image);
                setReceiptPreview(imageUrl);
                
                setPurchaseItems(items.map(item => ({
                    id: item.id,
                    name: item.product_name,
                    price: item.amount,
                    quantity: item.quantity,
                    total: (item.amount * item.quantity)
                })));

            } catch (err) {
                console.error("❌ Error fetching order details:", err);
                alert('Error loading order: ' + err.message);
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
        if (name === 'additionalPayment') {
            setFormValues(prev => ({ ...prev, [name]: formatInputCurrency(value) }));
            return;
        }
        setFormValues(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsUpdating(true);
            const parseNum = (val) => parseFloat(val.toString().replace(/,/g, '')) || 0;
            
            const additionalPayment = formValues.additionalPayment === '' ? 0 : parseNum(formValues.additionalPayment);
            
            // ✅ Use calculated values
            const newTotalPaid = calculatedTotalPaid;
            const newBalance = calculatedRemainingBalance;

            const { error: updateError } = await supabase
                .from('SalesTable')
                .update({
                    total_amount: totalAmount,
                    paid_amount: newTotalPaid,
                    remaining_balance: newBalance,
                    remarks: formValues.remarks,
                    status: newBalance <= 0 
                        ? "Fully Paid" 
                        : calculatedTotalPaid === 0 
                            ? "Unpaid" 
                            : "With Balance",
                    purchased_items: purchaseItems.map(i => `${i.quantity}x ${i.name}`).join(', ')
                })
                .eq('order_id', orderData.order_id);

            if (updateError) throw updateError;

            if (additionalPayment > 0) {
                const today = new Date().toISOString().split('T')[0];
                
                const { error: paymentError } = await supabase
                    .from('paymentHistory')
                    .insert([{
                        order_id: orderData.order_id,
                        payment_amount: additionalPayment,
                        payment_date: today
                    }]);

                if (paymentError) {
                    console.error("❌ Payment history error:", paymentError);
                }

                // ✅ FIX: Subtract the additional payment from the customer's overall remaining balance
                const { error: balanceError } = await supabase.rpc('update_customer_balance', {
                    p_customer_id: formValues.customerId,
                    p_new_balance: -additionalPayment  // negative = subtract from balance
                });

                if (balanceError) {
                    console.error("❌ Balance update error:", balanceError);
                }
            }
            
            await supabase.from('purchasedItems').delete().eq('order_id', orderData.order_id);
            
            const itemsToInsert = purchaseItems.map(item => ({
                order_id: orderData.order_id,
                product_name: item.name,
                amount: item.price,
                quantity: item.quantity
            }));
            await supabase.from('purchasedItems').insert(itemsToInsert);
            
            onClose();
        } catch (err) {
            console.error('❌ Update error:', err);
            alert("Error updating transaction: " + err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex py-4 items-center justify-center">
            <div className="flex flex-col h-full md:max-h-[100vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl mx-2 border border-slate-200 dark:border-slate-800 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="w-full flex items-center justify-between p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Invoice Details</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Reviewing {formValues.PONumber} • Customer: {customerInfo.full_name}
                        </p>
                    </div>
                    <button 
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            onClose();
                        }}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all cursor-pointer"
                    >
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
                                <input 
                                    type="text" 
                                    value={formValues.customer} 
                                    readOnly 
                                    className="w-full text-slate-700 dark:text-slate-200 px-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 cursor-not-allowed" 
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Total Balance: ₱{customerInfo.total_balance.toLocaleString()} | 
                                    Credit Limit: ₱{customerInfo.credit_limit.toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                                <input 
                                    type="text" 
                                    value={formatDisplayDateTime(formValues.transactionDate)}
                                    readOnly
                                    className="w-full text-slate-700 dark:text-slate-200 px-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 cursor-not-allowed" 
                                />
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
                                <div className="relative w-85 h-80 md:w-75 md:h-55 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center overflow-hidden group">
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

                            <div className="col-span-2 space-y-4 mt-1">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Additional Payment</label>
                                            <a 
                                                className="text-blue-500 hover:underline cursor-pointer text-xs mt-[-5px]" 
                                                onClick={() => setIsPaymentHistoryOpen(true)}
                                            >
                                                Payment History
                                            </a>
                                        </div>
                                        <div className="relative">
                                            <PhilippinePeso className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                            <input 
                                                type="text" 
                                                name="additionalPayment" 
                                                value={formValues.additionalPayment} 
                                                placeholder={formatInputCurrency(originalValues.paidAmount.toString())}
                                                onChange={handleInputChange} 
                                                autoComplete="off"
                                                className="w-full text-slate-700 dark:text-slate-200 pl-9 pr-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 outline-none" 
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                            Total Paid: ₱{calculatedTotalPaid.toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                            Remaining Balance (This Sale)
                                        </label>
                                        <div className="relative">
                                            <PhilippinePeso className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                            <input 
                                                type="text" 
                                                value={formatInputCurrency(calculatedRemainingBalance.toString())} 
                                                readOnly 
                                                className="w-full text-red-500 pl-9 pr-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-medium cursor-not-allowed" 
                                            />
                                        </div>
                                    </div>
                                </div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Admin Remarks</label>
                                <textarea 
                                    name="remarks" 
                                    rows="4" 
                                    value={formValues.remarks} 
                                    onChange={handleInputChange} 
                                    placeholder="The user didn't leave any remarks."
                                    className="w-full text-slate-700 dark:text-slate-200 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 outline-none resize-none"
                                />
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
            <PaymentHistoryModal 
                isOpen={isPaymentHistoryOpen} 
                onClose={() => setIsPaymentHistoryOpen(false)} 
                orderData={orderData}
            />
        </div>
    );
}

export default EditPurchaseModal;