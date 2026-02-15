import React, { useState, useMemo, useEffect } from 'react';
import { X, Calendar, Plus, Trash2, PhilippinePeso, Pencil } from 'lucide-react';
import AddItemModal from './AddItemModal';
import EditItemModal from './EditItemModal';
import { supabase } from "../../lib/supabase";

const recentOrders = [
    { id: 'ORD-1001', customer: 'John Doe', product: 'Wireless Headphones', amount: '$99.99', status: 'Fully Paid', date: '2026-01-11' },
    { id: 'ORD-1002', customer: 'Jane Smith', product: 'Smart Watch', amount: '$199.99', status: 'With Balance', date: '2026-01-10' },
    { id: 'ORD-1003', customer: 'Mike Johnson', product: 'Gaming Laptop', amount: '$1299.99', status: 'Unpaid', date: '2026-01-09' },
];

function AddPurchaseModal({ isOpen, onClose }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [purchaseItems, setPurchaseItems] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [receiptFile, setReceiptFile] = useState(null);
    const [receiptFileName, setReceiptFileName] = useState('No file chosen');

    const formatInputCurrency = (value) => {
        if (!value || value === '0') return '';
        const cleanValue = value.toString().replace(/[^0-9.]/g, '');
        const parts = cleanValue.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        if (parts.length > 1) {
            return `${parts[0]}.${parts[1].substring(0, 2)}`;
        }
        return parts[0];
    };

    const [formValues, setFormValues] = useState({
        PONumber: '',
        customer: '',
        transactionDate: '',
        remarks: '',
        amount: '',
        remainingBalance: '',
    });

    const customerList = useMemo(() => {
        const names = [...new Set(recentOrders.map(order => order.customer))];
        return names.sort((a, b) => a.localeCompare(b));
    }, []);

    const totalAmount = useMemo(() => {
        return purchaseItems.reduce((sum, item) => sum + item.total, 0);
    }, [purchaseItems]);

    useEffect(() => {
        const rawAmountString = formValues.amount.toString().replace(/,/g, '');
        const payment = parseFloat(rawAmountString) || 0;
        const balance = totalAmount - payment;
        
        setFormValues(prev => ({
            ...prev,
            remainingBalance: totalAmount > 0 ? formatInputCurrency(balance.toString()) : ''
        }));
    }, [totalAmount, formValues.amount]);

    const filteredCustomers = customerList.filter(name =>
        (name || '').toLowerCase().includes((formValues.customer || '').toLowerCase())
    );

    useEffect(() => {
        const prepareModal = async () => {
            if (isOpen) {
                try {
                    const { data } = await supabase
                        .from('SalesTable')
                        .select('order_id')
                        .order('order_id', { ascending: false })
                        .limit(1);

                    let nextIdNum = 1001;
                    if (data && data.length > 0) {
                        nextIdNum = parseInt(data[0].order_id) + 1;
                    }

                    setFormValues({
                        PONumber: `ORD-${nextIdNum.toString().padStart(4, '0')}`,
                        customer: '',
                        transactionDate: new Date().toISOString().split('T')[0],
                        remarks: '',
                        amount: '',
                        remainingBalance: '',
                    });
                    setPurchaseItems([]);
                    setReceiptFile(null);
                    setReceiptFileName('No file chosen');
                } catch (e) {
                    console.error("Initialization Error:", e);
                }
            }
        };
        prepareModal();
    }, [isOpen]);

    if (!isOpen) return null;

    const handleAddItem = (newItems) => {
        setPurchaseItems(prev => {
            const updatedList = [...prev];
            newItems.forEach(newItem => {
                const existingIndex = updatedList.findIndex(item => item.id === newItem.id);
                if (existingIndex > -1) {
                    const existingItem = updatedList[existingIndex];
                    const newQty = existingItem.quantity + newItem.quantity;
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

    const handleEditItem = (id) => {
        const item = purchaseItems.find(item => item.id === id);
        if (item) {
            setItemToEdit(item);
            setIsEditModalOpen(true);
        }
    };

    // ADD THIS - Handle saving edited item
    const handleSaveEditedItem = (editedItem) => {
        setPurchaseItems(prev => 
            prev.map(item => 
                item.id === editedItem.id ? editedItem : item
            )
        );
    };

    const handleRemoveItem = (id) => {
        setPurchaseItems(prev => prev.filter(item => item.id !== id));
    };

    const formatDateDisplay = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'long', day: 'numeric', year: 'numeric'
        }).format(date);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'amount') {
            setFormValues(prev => ({ ...prev, [name]: formatInputCurrency(value) }));
            return;
        }
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

    const handleFileChange = (event) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            setReceiptFile(files[0]);
            setReceiptFileName(files[0].name);
        } else {
            setReceiptFile(null);
            setReceiptFileName('No file chosen');
        }
    };

    const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
        let receiptFilename = null;

        // Upload receipt to 'receipts' bucket and store only filename
        if (receiptFile) {
            const fileExt = receiptFile.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('receipts')
                .upload(fileName, receiptFile);

            if (uploadError) throw uploadError;

            receiptFilename = fileName;
        }

        const parseNum = (val) => parseFloat(val.toString().replace(/,/g, '')) || 0;
        const totalToInsert = parseNum(formValues.amount);

        const { data: saleData, error: saleError } = await supabase
            .from('SalesTable')
            .insert([{
                customer: formValues.customer,
                date: formValues.transactionDate,
                amount: totalToInsert,
                remaining_balance: parseNum(formValues.remainingBalance),
                remarks: formValues.remarks,
                receipt_image: receiptFilename,
                status: parseNum(formValues.remainingBalance) <= 0 ? "Fully Paid" : "With Balance",
                purchased_items: purchaseItems.map(i => `${i.quantity}x ${i.name}`).join(', ')
            }])
            .select()
            .single();

        if (saleError) throw new Error(`SalesTable Error: ${saleError.message}`);

        const itemsToInsert = purchaseItems.map(item => ({
            order_id: saleData.order_id,
            product_name: item.name,
            amount: item.price,
            quantity: item.quantity
        }));

        const { error: itemsError } = await supabase
            .from('purchasedItems')
            .insert(itemsToInsert);

        if (itemsError) throw new Error(`ItemsTable Error: ${itemsError.message}`);

        // --- UPDATE INVENTORY (SUBTRACT) ---
        const inventoryData = purchaseItems.map(item => ({
            product_name: item.name,
            qty: item.quantity,
            price: item.price
        }));

        const { data: rpcResult, error: rpcError } = await supabase
            .rpc('update_inventory_from_sale', { items: inventoryData });

        if (rpcError) throw new Error(`Inventory Update Error: ${rpcError.message}`);

        // Check if stock validation passed
        if (rpcResult && !rpcResult.success) {
            // Build error message
            const errorMessages = rpcResult.errors.map(err => 
                `${err.product}: ${err.reason} (Need ${err.requested}, Have ${err.available})`
            ).join('\n');
            
            throw new Error(`Cannot complete sale:\n\n${errorMessages}`);
        }
        // --- END UPDATE INVENTORY ---

        onClose();
    } catch (err) {
        alert("Failed to save: " + err.message);
    } finally {
        setIsSaving(false);
    }
};

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex py-2 items-center justify-center overflow-y-auto p-2 overflow-x-hidden">
            <div 
                className="flex flex-col h-full md:max-h-[80vh] bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl shadow-2xl w-full max-w-lg md:max-w-4xl mx-2 border border-slate-200 dark:border-slate-800" 
                onClick={e => e.stopPropagation()}
            >
                <div className="w-full flex items-center justify-between mb-5 pb-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">New Purchase</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all group">
                        <X className="w-6 h-6 text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200 cursor-pointer"/>
                    </button>
                </div>

                <form id="purchaseForm" onSubmit={handleFormSubmit} className="flex-grow overflow-y-auto space-y-9 md:pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className = "max-w-[83vw]">
                            <label htmlFor="PONumber" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">PO No.</label>
                            <input type="text" id="PONumber" name="PONumber" value={formValues.PONumber} readOnly className="w-full text-slate-700 dark:text-slate-200 px-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 cursor-not-allowed outline-none" />
                        </div>

                        <div className="relative max-w-[83vw]">
                            <label htmlFor="CustomerName" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Customer Name</label>
                            <input type="text" id="CustomerName" name="customer" value={formValues.customer || ''} onChange={handleCustomerChange} onFocus={() => setIsDropdownOpen(true)} onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)} placeholder='select or type a customer' autoComplete="off" className="w-full text-slate-700 dark:text-slate-200 px-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                            {isDropdownOpen && filteredCustomers.length > 0 && (
                                <ul className="absolute z-30 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto py-2">
                                    {filteredCustomers.map((name, index) => (
                                        <li key={index} onClick={() => selectCustomer(name)} className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors">{name}</li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className = "max-w-[83vw]">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Transaction Date</label>
                            <div className="relative h-10 w-full group">
                                <div className="absolute inset-0 flex items-center justify-between px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 overflow-hidden">
                                    <span className={`truncate mr-2 ${formValues.transactionDate ? "text-slate-700 dark:text-slate-200" : "text-slate-400"}`}>
                                        {formValues.transactionDate ? formatDateDisplay(formValues.transactionDate) : "Select Date"}
                                    </span>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button type="button" onClick={(e) => { e.stopPropagation(); setToday(); }} className="relative z-20 px-2 py-1 text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 rounded hover:bg-blue-600 hover:text-white transition-all shadow-sm whitespace-nowrap">Today</button>
                                        <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                    </div>
                                </div>
                                <input type="date" name="transactionDate" value={formValues.transactionDate} onChange={handleInputChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col space-y-4 text-slate-800 dark:text-slate-200 pr-5 md:pr-0">
                        <div className="flex items-center justify-between">
                            <h1 className="text-xl font-bold">Item List</h1>
                            <button type="button" onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md active:scale-95 cursor-pointer">
                                <Plus className="w-5 h-5" /> <span>Add Item</span>
                            </button>
                        </div>
                        <div className="block overflow-x-auto mb-1 rounded-lg border border-slate-200 dark:border-slate-800">
                            <table className="w-full">
                                <thead className="bg-slate-100 dark:bg-slate-800">
                                    <tr>
                                        <th className="p-4 md:pl-10 text-left text-sm font-semibold text-slate-600 dark:text-slate-200">Product</th>
                                        <th className="p-4 text-center text-sm font-semibold text-slate-600 dark:text-slate-200">Unit Price</th>
                                        <th className="p-4 text-center text-sm font-semibold text-slate-600 dark:text-slate-200">Quantity</th>
                                        <th className="p-4 text-center text-sm font-semibold text-slate-600 dark:text-slate-200">Total</th>
                                        <th className="p-4 text-center text-sm font-semibold text-slate-600 dark:text-slate-200">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {purchaseItems.length > 0 ? (
                                        <>
                                            {purchaseItems.map((item) => (
                                                <tr key={item.id} className="border-b border-slate-200 dark:border-slate-800 text-center transition-colors">
                                                    <td className="p-4 md:pl-10 text-left text-sm text-slate-700 dark:text-slate-200">{item.name}</td>
                                                    <td className="p-4 text-sm text-slate-700 dark:text-slate-200">₱{item.price.toLocaleString()}</td>
                                                    <td className="p-4 text-sm text-slate-700 dark:text-slate-200">{item.quantity}</td>
                                                    <td className="p-4 text-sm text-slate-700 dark:text-slate-200">₱{item.total.toLocaleString()}</td>
                                                    <td className="p-4 text-center">
                                                        <button type="button" onClick={() => handleEditItem(item.id)} className="text-blue-500 hover:text-blue-700 p-1 cursor-pointer">
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700 p-1 cursor-pointer">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="bg-blue-50/50 dark:bg-blue-900/10 font-bold">
                                                <td colSpan="3" className="p-4 text-right text-slate-600 dark:text-slate-400 uppercase text-xs tracking-wider">Grand Total:</td>
                                                <td className="p-4 text-center text-blue-600 dark:text-blue-400 text-lg">₱{totalAmount.toLocaleString()}</td>
                                                <td></td>
                                            </tr>
                                        </>
                                    ) : (
                                        <tr><td colSpan="5" className="p-8 text-center text-sm text-slate-400 italic">No products added yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pr-5 md:pr-0 pb-4">
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="file_input">Upload Receipt</label>
                            <div className="relative flex rounded-lg overflow-hidden w-full bg-white border border-slate-300 dark:bg-slate-700 dark:border-slate-600 hover:border-blue-400 shadow-xs">
                                <span className="bg-slate-400/20 dark:bg-slate-600/90 text-slate-600/80 dark:text-slate-400/80 px-3 py-2 text-sm font-medium flex items-center select-none cursor-pointer">Choose File</span>
                                <span className="text-slate-500 dark:text-slate-400 px-4 py-2 text-sm flex items-center truncate min-w-0">{receiptFileName}</span>
                                <input type="file" id="file_input" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange}/>
                            </div>
                        </div>
                        <div className="col-span-2 space-y-5">
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
                                        <input type="text" id="remainingBalance" name="remainingBalance" value={formValues.remainingBalance} readOnly placeholder='0.00' 
                                        className="w-full text-red-500 dark:text-red-500 pl-9 pr-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 cursor-not-allowed outline-none font-medium" />
                                    </div>
                                </div>
                            </div>
                            <label htmlFor="remarks" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Remarks</label>
                            <textarea id="remarks" name="remarks" rows="3" value={formValues.remarks} onChange={handleInputChange} placeholder="Add transaction notes..." className="w-full text-slate-700 dark:text-slate-200 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none" />
                        </div>
                    </div>
                </form>

                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-3 flex-shrink-0 pr-5 md:pr-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer">Cancel</button>
                    <button 
                        type="submit"
                        form="purchaseForm" 
                        disabled={purchaseItems.length === 0 || !formValues.customer || isSaving} 
                        className="px-4 py-2 text-sm font-bold rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isSaving ? "Saving..." : "Save Purchase"}
                    </button>
                </div>
            </div>
            <AddItemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddItem} />
            <EditItemModal 
                isOpen={isEditModalOpen} 
                onClose={() => setIsEditModalOpen(false)} 
                item={itemToEdit}
                onSave={handleSaveEditedItem}
            />
        </div>
    );
}

export default AddPurchaseModal;