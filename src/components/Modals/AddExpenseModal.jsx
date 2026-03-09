import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Plus, Trash2, PhilippinePeso, Calendar, Upload, Pencil } from 'lucide-react';
import AddExpenseItemModal from './AddExpenseItemModal';
import EditItemModal from './EditItemModal';
import { supabase } from "../../lib/supabase";

const expenseCategories = ["Stock Expense", "Electrical Bill", "Water Bill", "Miscellaneous"];

function AddExpenseModal({isOpen, onClose}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [purchaseItems, setPurchaseItems] = useState([]);
    const fileInputRef = useRef(null);

    const getPHDate = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });

    const formatInputCurrency = (value) => {
        if (!value || value === '0') return '';
        const cleanValue = value.toString().replace(/[^0-9.]/g, '');
        const parts = cleanValue.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        if (parts.length > 1) return `${parts[0]}.${parts[1].substring(0, 2)}`;
        return parts[0];
    };

    const [formValues, setFormValues] = useState({
        amount: '', expenseType: '', remarks: '',
        transactionDate: getPHDate(), receiptImage: null, supplierName: '',
    });

    const isStockExpense = formValues.expenseType === "Stock Expense";

    const totalAmount = useMemo(() => purchaseItems.reduce((sum, item) => sum + item.total, 0), [purchaseItems]);

    useEffect(() => {
        if (isOpen) {
            setFormValues({ amount: '', expenseType: '', remarks: '', transactionDate: getPHDate(), receiptImage: null, supplierName: '' });
            setImagePreview(null);
            setPurchaseItems([]);
        }
    }, [isOpen]);

    const filteredCategories = useMemo(() =>
        expenseCategories.filter(type => type.toLowerCase().includes((formValues.expenseType || '').toLowerCase())),
        [formValues.expenseType]
    );

    const handleImageChange = (file) => {
        if (file && file.type.startsWith('image/')) {
            setFormValues(prev => ({ ...prev, receiptImage: file }));
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
        else if (e.type === "dragleave") setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        if (e.dataTransfer.files?.[0]) handleImageChange(e.dataTransfer.files[0]);
    };

    const formatDateDisplay = (dateString) => {
        if (!dateString) return "";
        return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(dateString));
    };

    const setToday = () => setFormValues(prev => ({ ...prev, transactionDate: getPHDate() }));

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'amount') { setFormValues(prev => ({ ...prev, [name]: formatInputCurrency(value) })); return; }
        setFormValues(prev => ({ ...prev, [name]: value }));
    };

    const handleTypeChange = (e) => {
        const value = e.target.value;
        setFormValues(prev => ({ ...prev, expenseType: value, supplierName: value !== 'Stock Expense' ? '' : prev.supplierName }));
        if (value !== "Stock Expense") setPurchaseItems([]);
        setIsDropdownOpen(true);
    };

    const selectType = (type) => {
        setFormValues(prev => ({ ...prev, expenseType: type, supplierName: type !== 'Stock Expense' ? '' : prev.supplierName }));
        if (type !== "Stock Expense") setPurchaseItems([]);
        setIsDropdownOpen(false);
    };

    const handleAddItem = (newItems) => {
        setPurchaseItems(prev => {
            const updatedList = [...prev];
            newItems.forEach(newItem => {
                const existingIndex = updatedList.findIndex(item => item.id === newItem.id);
                if (existingIndex > -1) {
                    const ei = updatedList[existingIndex];
                    const newQty = ei.quantity + newItem.quantity;
                    updatedList[existingIndex] = { ...ei, quantity: newQty, total: ei.price * newQty };
                } else { updatedList.push(newItem); }
            });
            return updatedList;
        });
    };

    const handleEditItem = (id) => {
        const item = purchaseItems.find(item => item.id === id);
        if (item) { setItemToEdit(item); setIsEditModalOpen(true); }
    };

    const handleSaveEditedItem = (editedItem) => setPurchaseItems(prev => prev.map(item => item.id === editedItem.id ? editedItem : item));
    const handleRemoveItem = (id) => setPurchaseItems(prev => prev.filter(item => item.id !== id));

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            let receiptFilename = null;
            if (formValues.receiptImage) {
                const fileExt = formValues.receiptImage.name.split('.').pop();
                const fileName = `expense_${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('receipts').upload(fileName, formValues.receiptImage);
                if (uploadError) throw uploadError;
                receiptFilename = fileName;
            }

            const parseNum = (val) => parseFloat(val.toString().replace(/,/g, '')) || 0;
            const finalAmount = isStockExpense ? totalAmount : parseNum(formValues.amount);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No authenticated user found');

            const { data: accountData, error: accountError } = await supabase.from('account').select('full_name').eq('user_id', user.id).single();
            if (accountError) throw accountError;


            const initialStatus = isStockExpense ? 'Just Ordered' : 'Paid';

            const { data: expenseData, error: expenseError } = await supabase
                .from('ExpensesTable')
                .insert([{
                    expense_type: formValues.expenseType,
                    supplier_name: isStockExpense ? formValues.supplierName : null,
                    amount: finalAmount,
                    remarks: formValues.remarks,
                    receipt_image: receiptFilename,
                    recorded_by: accountData?.full_name || 'Unknown User',
                    purchased_items: isStockExpense ? purchaseItems.map(i => `${i.quantity}x ${i.name}`).join(', ') : null,
                    status: initialStatus
                }])
                .select()
                .single();

            if (expenseError) throw new Error(`Expense Error: ${expenseError.message}`);

            if (isStockExpense && purchaseItems.length > 0) {
                const { error: itemsError } = await supabase.from('ExpenseItems').insert(
                    purchaseItems.map(item => ({ expense_id: expenseData.expense_id, product_name: item.name, amount: item.price, quantity: item.quantity }))
                );
                if (itemsError) throw new Error(`Items Error: ${itemsError.message}`);

                const { error: rpcError } = await supabase.rpc('update_inventory_from_expense', {
                    items: purchaseItems.map(item => ({ product_name: item.name, qty: item.quantity, price: item.price, category: item.category, sub_category: item.subCategory }))
                });
                if (rpcError) throw new Error(`Inventory Update Error: ${rpcError.message}`);
            }

            onClose();
        } catch (err) {
            alert("Something went wrong. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex py-2 items-center justify-center overflow-y-auto overflow-x-hidden">
            <div className="flex flex-col h-auto max-h-[83vh] bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl shadow-2xl w-full max-w-4xl mx-2 border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                <div className="w-full flex items-center justify-between mb-5 pb-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Add Expense</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all group">
                        <X className="w-6 h-6 text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200 cursor-pointer"/>
                    </button>
                </div>

                <form id="expenseForm" onSubmit={handleFormSubmit} className="flex-grow overflow-y-auto space-y-6 md:pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="w-[85vw] md:w-full">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Receipt Image</label>
                            <div onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative h-52 border-2 border-dashed rounded-xl transition-all cursor-pointer overflow-hidden ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-300 dark:border-slate-700 hover:border-blue-400'}`}>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e.target.files[0])} />
                                {imagePreview ? (
                                    <div className="relative w-full h-full group">
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-contain bg-slate-50 dark:bg-slate-800" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <p className="text-white text-sm font-medium">Click to change</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 space-y-2">
                                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full"><Upload className="w-6 h-6 text-blue-500" /></div>
                                        <div className="text-center px-4">
                                            <p className="text-xs font-medium">Upload Receipt</p>
                                            <p className="text-xs opacity-60">PNG, JPG (Max 5MB)</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="relative max-w-[83vw]">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Type of Expense</label>
                                <input type="text" name="expenseType" value={formValues.expenseType} onChange={handleTypeChange}
                                    onFocus={() => setIsDropdownOpen(true)} onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                                    placeholder='Select or type expense type' autoComplete="off"
                                    className="w-full text-slate-700 dark:text-slate-200 px-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                                {isDropdownOpen && filteredCategories.length > 0 && (
                                    <ul className="absolute z-30 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto py-2">
                                        {filteredCategories.map((type, index) => (
                                            <li key={index} onClick={() => selectType(type)} className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors">{type}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* ✅ Initial status preview */}
                            {formValues.expenseType && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Initial Status:</span>
                                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${isStockExpense ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'}`}>
                                        {isStockExpense ? 'Just Ordered' : 'Paid'}
                                    </span>
                                </div>
                            )}

                            {isStockExpense && (
                                <div className="max-w-[83vw]">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Supplier Name</label>
                                    <input type="text" name="supplierName" value={formValues.supplierName} onChange={handleInputChange}
                                        placeholder="Enter supplier name" autoComplete="off"
                                        className="w-full text-slate-700 dark:text-slate-200 px-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                                </div>
                            )}

                            {!isStockExpense && (
                                <div className="relative w-full max-w-[83vw]">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount</label>
                                    <div className="relative">
                                        <PhilippinePeso className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
                                        <input type="text" name="amount" value={formValues.amount} onChange={handleInputChange} placeholder="0.00" autoComplete="off"
                                            className="w-full text-slate-700 dark:text-slate-200 pl-9 pr-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                                    </div>
                                </div>
                            )}

                            <div className="relative max-w-[83vw]">
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

                            <div className="max-w-[83vw] md:w-full">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Remarks</label>
                                <textarea name="remarks" value={formValues.remarks} onChange={handleInputChange} rows="3" placeholder="Add notes..."
                                    className="w-full text-slate-700 dark:text-slate-200 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none" />
                            </div>
                        </div>
                    </div>

                    {isStockExpense && (
                        <div className="max-w-[88vw] md:w-full flex flex-col space-y-4 text-slate-800 dark:text-slate-200">
                            <div className="flex items-center justify-between">
                                <h1 className="text-xl font-bold">Items Bought</h1>
                                <button type="button" onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md active:scale-95 cursor-pointer">
                                    <Plus className="w-5 h-5" /> <span>Add Item</span>
                                </button>
                            </div>
                            <div className="block overflow-x-auto mb-1 rounded-lg border border-slate-200 dark:border-slate-800">
                                <table className="w-full">
                                    <thead className="bg-slate-100 dark:bg-slate-800">
                                        <tr>
                                            <th className="p-4 md:pl-10 text-left text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-200">Product</th>
                                            <th className="p-4 text-center text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-200">Unit Price</th>
                                            <th className="p-4 text-center text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-200">Quantity</th>
                                            <th className="p-4 text-center text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-200">Total</th>
                                            <th className="p-4 text-center text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-200">Action</th>
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
                                                            <button type="button" onClick={() => handleEditItem(item.id)} className="text-blue-500 hover:text-blue-700 p-1 cursor-pointer"><Pencil className="w-4 h-4" /></button>
                                                            <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700 p-1 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
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
                    )}
                </form>

                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-3 flex-shrink-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer">Cancel</button>
                    <button type="submit" form="expenseForm"
                        disabled={!formValues.expenseType || (isStockExpense ? purchaseItems.length === 0 : !formValues.amount) || isSaving}
                        className="px-4 py-2 text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                        {isSaving ? "Saving..." : "Save Expense"}
                    </button>
                </div>
            </div>
            <AddExpenseItemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddItem} />
            <EditItemModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} item={itemToEdit} onSave={handleSaveEditedItem} />
        </div>
    );
}

export default AddExpenseModal;