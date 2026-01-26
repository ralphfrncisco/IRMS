import React, { useState, useMemo, useEffect } from 'react';
import { X, Calendar, Plus, Trash2, PhilippinePeso, Image as ImageIcon } from 'lucide-react';
import AddItemModal from './AddItemModal';

// --- ASSET IMPORTS ---
import testImage from '../../assets/test.jpg';
import pigImage from '../../assets/pig.png';

const recentOrders = [
    { id: 'ORD-1001', customer: 'John Doe', product: 'Wireless Headphones', status: 'Fully Paid', date: '2026-01-11', amount: 99.99, remainingBalance: 0 },
    { id: 'ORD-1002', customer: 'Jane Smith', product: 'Smart Watch', amount: '$199.99', status: 'With Balance', date: '2026-01-10', remainingBalance: 50.00 },
    { id: 'ORD-1003', customer: 'Mike Johnson', product: 'Gaming Laptop', amount: '$1299.99', status: 'Unpaid', date: '2026-01-09', remainingBalance: 1299.99 },
];

function EditPurchaseModal({ isOpen, onClose, orderData }) {
    // 1. STATE HOOKS
    const [isAddItemOpen, setIsAddItemOpen] = useState(false);
    const [purchaseItems, setPurchaseItems] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [receiptPreview, setReceiptPreview] = useState(null);
    const [receiptFileName, setReceiptFileName] = useState('No file chosen');
    const [formValues, setFormValues] = useState({
        PONumber: '',
        customer: '',
        transactionDate: '',
        remarks: '',
        amount: '',
        remainingBalance: '',
    });

    // 2. MEMO HOOKS
    const customerList = useMemo(() => {
        const names = [...new Set(recentOrders.map(order => order.customer))];
        return names.sort((a, b) => a.localeCompare(b));
    }, []);

    const totalAmount = useMemo(() => {
        return purchaseItems.reduce((sum, item) => sum + (item.total || 0), 0);
    }, [purchaseItems]);

    const filteredCustomers = customerList.filter(name =>
        (name || '').toLowerCase().includes((formValues.customer || '').toLowerCase())
    );

    // --- AUTO-CALCULATION LOGIC ---
    // This effect ensures the balance updates whenever items are added/removed 
    // or when the payment amount is manually edited.
    useEffect(() => {
        const amountPaid = parseFloat(formValues.amount) || 0;
        const newBalance = totalAmount - amountPaid;
        setFormValues(prev => ({
            ...prev,
            remainingBalance: newBalance > 0 ? newBalance.toFixed(2) : '0.00'
        }));
    }, [totalAmount, formValues.amount]);

    // 3. EFFECT HOOKS - Population Logic
    useEffect(() => {
        if (isOpen && orderData) {
            // Sanitize amount: remove symbols like '$' so math functions work
            const rawAmount = orderData.amount || '';
            const cleanAmount = typeof rawAmount === 'string' 
                ? rawAmount.replace(/[^0-9.-]+/g, "") 
                : rawAmount;

            setFormValues({
                PONumber: orderData.id || '',
                customer: orderData.customer || '',
                transactionDate: orderData.date || '',
                remarks: orderData.remarks || 'No specific remarks recorded.',
                amount: cleanAmount,
                remainingBalance: orderData.remainingBalance || '',
            });

            // Mocked items for the demo
            setPurchaseItems([
                { id: 'PID-1001', name: 'Pre-Starter Pellets', price: 1450.00, quantity: 2, total: 2900.00 },
                { id: 'PID-1002', name: 'Hog-Grower Pellets', price: 2150.00, quantity: 1, total: 2150.00 }
            ]);
            
            if (orderData.id === 'ORD-1001') {
                setReceiptPreview(testImage);
                setReceiptFileName('test.jpg');
            } else if (orderData.id === 'ORD-1002') {
                setReceiptPreview(pigImage);
                setReceiptFileName('pig.png');
            } else {
                setReceiptPreview(null);
                setReceiptFileName('No receipt available');
            }
        }
    }, [isOpen, orderData]);

    if (!isOpen) return null;

    // 5. HANDLERS
    const handleAddItem = (newItems) => {
        setPurchaseItems(prev => {
            const updatedList = [...prev];
            newItems.forEach(newItem => {
                const existingIndex = updatedList.findIndex(item => item.id === newItem.id);
                if (existingIndex > -1) {
                    const existingItem = updatedList[existingIndex];
                    const newQty = Number(existingItem.quantity) + Number(newItem.quantity);
                    updatedList[existingIndex] = {
                        ...existingItem,
                        quantity: newQty,
                        total: existingItem.price * newQty
                    };
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

    const formatDateDisplay = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'long', day: 'numeric', year: 'numeric'
        }).format(date).toUpperCase();
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormValues(prev => ({ ...prev, [name]: value }));
    };

    const handleCustomerChange = (e) => {
        const value = e.target.value;
        setFormValues(prev => ({ ...prev, customer: value }));
        setIsDropdownOpen(true);
    };

    const selectCustomer = (name) => {
        setFormValues(prev => ({ ...prev, customer: name }));
        setIsDropdownOpen(false);
    };

    const setToday = () => {
        const today = new Date().toISOString().split('T')[0];
        setFormValues(prev => ({ ...prev, transactionDate: today }));
    };

    const handleViewFullImage = () => {
        if (receiptPreview) {
            const newTab = window.open();
            newTab.document.body.innerHTML = `
                <body style="margin:0; background: #0f172a; display: flex; align-items: center; justify-content: center;">
                    <img src="${receiptPreview}" style="max-width: 100%; max-height: 100vh; object-fit: contain;" />
                </body>
            `;
            newTab.document.title = `Receipt - ${formValues.PONumber}`;
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        console.log("Saving updated data:", { ...formValues, items: purchaseItems, totalAmount });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex py-4 items-center justify-center">
            <div 
                className="flex flex-col h-full md:max-h-[94vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl mx-2 border border-slate-200 dark:border-slate-800 overflow-hidden" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="w-full flex items-center justify-between p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Invoice Details</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">View or modify transaction for {formValues.PONumber}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all group">
                        <X className="w-6 h-6 text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200 cursor-pointer"/>
                    </button>
                </div>

                {/* Form Body */}
                <form id="purchase-form" onSubmit={handleFormSubmit} className="flex-grow overflow-y-auto p-4 md:p-6 space-y-8 pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className = "max-w-[87vw]">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Order ID</label>
                            <input type="text" value={formValues.PONumber} readOnly className="w-full text-slate-700 dark:text-slate-200 px-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 cursor-not-allowed outline-none font-mono" />
                        </div>
                        
                        <div className="relative max-w-[87vw]">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Customer Name</label>
                            <input type="text" name="customer" value={formValues.customer} onChange={handleCustomerChange} onFocus={() => setIsDropdownOpen(true)} onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)} className="w-full text-slate-700 dark:text-slate-200 px-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                            {isDropdownOpen && filteredCustomers.length > 0 && (
                                <ul className="absolute z-30 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-40 overflow-y-auto py-2">
                                    {filteredCustomers.map((name, index) => (
                                        <li key={index} onClick={() => selectCustomer(name)} className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer">{name}</li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className = "max-w-[87vw]">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                            <div className="relative h-10 w-full group">
                                <div className="absolute inset-0 flex items-center justify-between px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200">
                                    <span className="truncate mr-2">{formValues.transactionDate ? formatDateDisplay(formValues.transactionDate) : "Select Date"}</span>
                                    <div className="flex items-center gap-2">
                                        <button type="button" onClick={setToday} className="px-2 py-1 text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 rounded hover:bg-blue-600 hover:text-white transition-all">Today</button>
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                    </div>
                                </div>
                                <input type="date" name="transactionDate" value={formValues.transactionDate} onChange={handleInputChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                            </div>
                        </div>
                    </div>

                    {/* Item List */}
                    <div className="space-y-4 max-w-[87vw]">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Purchased Products</h3>
                            <button type="button" onClick={() => setIsAddItemOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md active:scale-95 cursor-pointer">
                                <Plus className="w-5 h-5" />
                                <span>Add Item</span>
                            </button>
                        </div>
                        
                        <div className="overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
                            <table className="w-full py-2">
                                <thead className="bg-slate-50 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider pl-6">Product</th>
                                        <th className="p-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Price</th>
                                        <th className="p-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Qty</th>
                                        <th className="p-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
                                        <th className="p-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {purchaseItems.map((item) => (
                                        <tr key={item.id} className="dark:text-slate-300">
                                            <td className="p-3 pl-6 text-sm">{item.name}</td>
                                            <td className="p-3 text-center text-sm">₱{item.price.toLocaleString()}</td>
                                            <td className="p-3 text-center text-sm">{item.quantity}</td>
                                            <td className="p-3 text-center text-sm font-semibold">₱{item.total.toLocaleString()}</td>
                                            <td className="p-3 text-center">
                                                <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors">
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

                    {/* Receipt & Remarks Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[87vw]">
                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Receipt Preview</label>
                            <div className="relative aspect-[4/3] w-full rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center overflow-hidden group">
                                {receiptPreview ? (
                                    <>
                                        <img src={receiptPreview} alt="Receipt" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button type="button" onClick={handleViewFullImage} className="bg-white text-slate-900 px-4 py-2 rounded-lg text-xs font-bold shadow-lg hover:bg-slate-100 transition-all active:scale-95">View Image</button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-4">
                                        <ImageIcon className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-50" />
                                        <p className="text-xs text-slate-500">No receipt image uploaded</p>
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-400 truncate italic">Filename: {receiptFileName}</p>
                        </div>

                        <div className="col-span-2 space-y-3">
                            <div className="flex items-center gap-4">
                                <div className="relative w-full">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount Paid</label>
                                    <div className="relative">
                                        <PhilippinePeso className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
                                        <input type="text" name="amount" value={formValues.amount} onChange={handleInputChange} placeholder="0.00" autoComplete="off" className="w-full text-slate-700 dark:text-slate-200 pl-9 pr-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                                    </div>
                                </div>

                                <div className="relative w-full">
                                    <label htmlFor="remainingBalance" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Remaining Balance</label>
                                    <div className="relative">
                                        <PhilippinePeso className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
                                        <input type="text" id="remainingBalance" name="remainingBalance" value={formValues.remainingBalance} readOnly placeholder='0.00' className="w-full text-red-500 dark:text-red-500 pl-9 pr-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 cursor-not-allowed outline-none font-medium" />
                                    </div>
                                </div>
                            </div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Admin Remarks</label>
                            <textarea name="remarks" rows="6" value={formValues.remarks} onChange={handleInputChange} placeholder="Discrepancies, payment notes, or internal updates..." className="w-full text-slate-700 dark:text-slate-200 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"></textarea>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-4 md:p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-3 flex-shrink-0">
                    <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors">Close</button>
                    <button type="submit" form="purchase-form" className="px-6 py-2 text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-lg active:scale-95 transition-all">Update Invoice</button>
                </div>
            </div>
            <AddItemModal isOpen={isAddItemOpen} onClose={() => setIsAddItemOpen(false)} onAdd={handleAddItem} />
        </div>
    );
}

export default EditPurchaseModal;