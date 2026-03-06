import React, { useState, useMemo, useEffect } from 'react';
import { X, Calendar, Plus, Trash2, PhilippinePeso, Pencil, AlertTriangle, CheckCircle, UserPlus, Phone } from 'lucide-react';
import AddItemModal from './AddItemModal';
import EditItemModal from './EditItemModal';
import { supabase } from "../../lib/supabase";

// ─── Overpayment Confirmation Modal ───────────────────────────────────────────
function OverpaymentModal({ isOpen, onConfirm, onDecline, extraAmount, customerName }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Overpayment Detected</h3>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    The amount paid has an extra of{' '}
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        ₱{extraAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>{' '}
                    beyond the total amount. Would you like to apply this to reduce{' '}
                    <span className="font-semibold text-slate-800 dark:text-white">{customerName}</span>'s
                    overall remaining balance?
                </p>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onDecline}
                        className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        No, skip it
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2.5 text-sm font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                    >
                        Yes, apply it
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
function AddPurchaseModal({ isOpen, onClose }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [purchaseItems, setPurchaseItems] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // ✅ Overpayment modal state
    const [showOverpaymentModal, setShowOverpaymentModal] = useState(false);
    const [pendingSavePayload, setPendingSavePayload] = useState(null);

    const [receiptFile, setReceiptFile] = useState(null);
    const [receiptFileName, setReceiptFileName] = useState('No file chosen');

    const [customerList, setCustomerList] = useState([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    // ✅ New customer inline registration
    const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
    const [newCustomerForm, setNewCustomerForm] = useState({ contact_number: '', address: '' });
    const [isRegisteringCustomer, setIsRegisteringCustomer] = useState(false);

    const getPHDate = () => {
        return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
    };

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
        customerId: null,
        transactionDate: getPHDate(),
        remarks: '',
        amount: '',
        remainingBalance: '',
        currentCustomerBalance: 0,
        creditLimit: 0
    });

    useEffect(() => {
        const fetchCustomers = async () => {
            setLoadingCustomers(true);
            try {
                const { data, error } = await supabase
                    .from('customers')
                    .select('customer_id, full_name, contact_number, credit_limit, remaining_balance')
                    .order('full_name', { ascending: true });
                if (error) throw error;
                setCustomerList(data || []);
            } catch (err) {
                console.error('Error fetching customers:', err);
            } finally {
                setLoadingCustomers(false);
            }
        };
        if (isOpen) fetchCustomers();
    }, [isOpen]);

    const totalAmount = useMemo(() => {
        return purchaseItems.reduce((sum, item) => sum + item.total, 0);
    }, [purchaseItems]);

    // ✅ Fixed: handle overpayment (negative balance) properly
    useEffect(() => {
        const rawAmountString = formValues.amount.toString().replace(/,/g, '');
        const payment = parseFloat(rawAmountString) || 0;
        const balance = totalAmount - payment;

        if (totalAmount <= 0) {
            setFormValues(prev => ({ ...prev, remainingBalance: '' }));
            return;
        }

        if (balance <= 0) {
            // Overpaid or exact — remaining balance for THIS order is 0
            setFormValues(prev => ({ ...prev, remainingBalance: '0' }));
        } else {
            setFormValues(prev => ({ ...prev, remainingBalance: formatInputCurrency(balance.toString()) }));
        }
    }, [totalAmount, formValues.amount]);

    // ✅ Derived: extra amount paid beyond total (only positive when overpaid)
    const overpaymentAmount = useMemo(() => {
        const payment = parseFloat(formValues.amount.toString().replace(/,/g, '')) || 0;
        const extra = payment - totalAmount;
        return extra > 0 ? extra : 0;
    }, [formValues.amount, totalAmount]);

    const filteredCustomers = useMemo(() => {
        return customerList.filter(customer =>
            customer.full_name.toLowerCase().includes((formValues.customer || '').toLowerCase())
        );
    }, [customerList, formValues.customer]);

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
                        customerId: null,
                        transactionDate: getPHDate(),
                        remarks: '',
                        amount: '',
                        remainingBalance: '',
                        currentCustomerBalance: 0,
                        creditLimit: 0
                    });
                    setPurchaseItems([]);
                    setSelectedCustomer(null);
                    setReceiptFile(null);
                    setReceiptFileName('No file chosen');
                    setShowOverpaymentModal(false);
                    setPendingSavePayload(null);
                    setShowNewCustomerForm(false);
                    setNewCustomerForm({ contact_number: '', address: '' });
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

    const handleSaveEditedItem = (editedItem) => {
        setPurchaseItems(prev => prev.map(item => item.id === editedItem.id ? editedItem : item));
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
        setFormValues(prev => ({
            ...prev,
            customer: value,
            customerId: null,
            currentCustomerBalance: 0,
            creditLimit: 0
        }));
        setSelectedCustomer(null);
        setShowNewCustomerForm(false);
        setIsDropdownOpen(true);
    };

    const selectCustomer = async (customer) => {
        setSelectedCustomer(customer);
        setFormValues(prev => ({
            ...prev,
            customer: customer.full_name,
            customerId: customer.customer_id,
            currentCustomerBalance: customer.remaining_balance,
            creditLimit: customer.credit_limit
        }));
        setIsDropdownOpen(false);
    };

    // ✅ Register a brand new customer and auto-select them
    const registerNewCustomer = async () => {
        if (!formValues.customer.trim()) return;
        setIsRegisteringCustomer(true);
        try {
            const parseNum = (val) => parseFloat(val.toString().replace(/,/g, '')) || 0;
            const remainingBalanceVal = parseNum(formValues.remainingBalance);

            const { data, error } = await supabase
                .from('customers')
                .insert([{
                    full_name: formValues.customer.trim(),
                    contact_number: newCustomerForm.contact_number.trim() || null,
                    address: newCustomerForm.address.trim() || null,
                    credit_limit: 20000,
                    remaining_balance: remainingBalanceVal
                }])
                .select()
                .single();

            if (error) throw error;

            // Auto-select the newly created customer
            setSelectedCustomer(data);
            setFormValues(prev => ({
                ...prev,
                customerId: data.customer_id,
                currentCustomerBalance: data.remaining_balance,
                creditLimit: data.credit_limit
            }));
            // Refresh customer list
            setCustomerList(prev => [...prev, data].sort((a, b) => a.full_name.localeCompare(b.full_name)));
            setShowNewCustomerForm(false);
            setIsDropdownOpen(false);
        } catch (err) {
            alert('Failed to register customer: ' + err.message);
        } finally {
            setIsRegisteringCustomer(false);
        }
    };

    const setToday = () => {
        setFormValues(prev => ({ ...prev, transactionDate: getPHDate() }));
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

    // ─── Core save logic (called after overpayment decision) ──────────────────
    const executeSave = async (applyOverpaymentToBalance = false) => {
        setIsSaving(true);
        try {
            const parseNum = (val) => parseFloat(val.toString().replace(/,/g, '')) || 0;

            const totalAmount_value = totalAmount;
            const paidAmount_value = parseNum(formValues.amount);
            // ✅ This order's remaining balance is always 0 if fully/over paid
            const remainingBalance_value = Math.max(0, totalAmount_value - paidAmount_value);

            // Credit limit check
            if (remainingBalance_value > 0 && formValues.currentCustomerBalance > 0) {
                const { data: creditCheck, error: creditError } = await supabase
                    .rpc('check_customer_credit_limit', {
                        p_customer_id: formValues.customerId,
                        p_new_balance: remainingBalance_value
                    });

                if (creditError) throw creditError;

                if (!creditCheck.allowed) {
                    const message = `❌ Credit Limit Exceeded!\n\n` +
                        `Customer: ${formValues.customer}\n` +
                        `Credit Limit: ₱${creditCheck.credit_limit?.toLocaleString()}\n` +
                        `Current Balance: ₱${creditCheck.current_balance?.toLocaleString()}\n` +
                        `New Sale Balance: ₱${remainingBalance_value.toLocaleString()}\n` +
                        `Total Would Be: ₱${creditCheck.total_would_be?.toLocaleString()}\n\n` +
                        `Please collect the remaining balance first before creating a new sale.`;
                    alert(message);
                    return;
                }
            }

            // Inventory validation
            const inventoryData = purchaseItems.map(item => ({
                product_name: item.name,
                qty: item.quantity,
                price: item.price
            }));

            const { data: rpcResult, error: rpcError } = await supabase
                .rpc('update_inventory_from_sale', { items: inventoryData });

            if (rpcError) throw new Error(`Inventory Update Error: ${rpcError.message}`);

            if (rpcResult && !rpcResult.success) {
                const errorMessages = rpcResult.errors.map(err =>
                    `${err.product}: ${err.reason} (Need ${err.requested}, Have ${err.available})`
                ).join('\n');
                throw new Error(`\n${errorMessages}`);
            }

            // Upload receipt
            let receiptFilename = null;
            if (receiptFile) {
                const fileExt = receiptFile.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('receipts')
                    .upload(fileName, receiptFile);
                if (uploadError) throw uploadError;
                receiptFilename = fileName;
            }

            // Insert sale
            const { data: saleData, error: saleError } = await supabase
                .from('SalesTable')
                .insert([{
                    customer_id: formValues.customerId,
                    total_amount: totalAmount_value,
                    paid_amount: paidAmount_value,
                    remaining_balance: remainingBalance_value,
                    remarks: formValues.remarks,
                    receipt_image: receiptFilename,
                    status: remainingBalance_value <= 0
                        ? "Fully Paid"
                        : paidAmount_value === 0
                            ? "Unpaid"
                            : "With Balance",
                    purchased_items: purchaseItems.map(i => `${i.quantity}x ${i.name}`).join(', ')
                }])
                .select()
                .single();

            if (saleError) throw new Error(`SalesTable Error: ${saleError.message}`);

            // Insert purchased items
            const itemsToInsert = purchaseItems.map(item => ({
                order_id: saleData.order_id,
                product_name: item.name,
                amount: item.price,
                quantity: item.quantity
            }));

            const { error: itemsError } = await supabase.from('purchasedItems').insert(itemsToInsert);
            if (itemsError) throw new Error(`ItemsTable Error: ${itemsError.message}`);

            // Insert payment history
            if (paidAmount_value > 0) {
                await supabase.from('paymentHistory').insert([{
                    order_id: saleData.order_id,
                    payment_amount: paidAmount_value,
                    payment_date: formValues.transactionDate
                }]);
            }

            // ✅ Update customer balance:
            // - Always add this order's remaining balance
            // - If user confirmed overpayment, also subtract the extra from their overall balance
            const balanceToAdd = remainingBalance_value;
            const balanceToSubtract = applyOverpaymentToBalance ? overpaymentAmount : 0;
            const netBalanceChange = balanceToAdd - balanceToSubtract;

            const { error: balanceError } = await supabase.rpc('update_customer_balance', {
                p_customer_id: formValues.customerId,
                p_new_balance: netBalanceChange
            });

            if (balanceError) throw new Error(`Failed to update customer balance: ${balanceError.message}`);

            onClose();
        } catch (err) {
            alert("Failed to save: " + err.message);
        } finally {
            setIsSaving(false);
            setShowOverpaymentModal(false);
            setPendingSavePayload(null);
        }
    };

    // ─── Form submit: check for overpayment first ─────────────────────────────
    const handleFormSubmit = async (e) => {
        e.preventDefault();

        if (!formValues.customerId) {
            alert('Please select a valid customer from the dropdown');
            return;
        }

        // ✅ If amount paid > total AND customer has existing balance, show overpayment modal
        if (overpaymentAmount > 0 && formValues.currentCustomerBalance > 0) {
            setShowOverpaymentModal(true);
            return;
        }

        // Otherwise proceed directly
        await executeSave(false);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex py-2 items-center justify-center overflow-y-auto p-2 overflow-x-hidden">
            <div className="flex flex-col h-full lg:max-h-[100vh] 2xl:max-h-[80vh] bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl shadow-2xl w-full max-w-2xl md:max-w-4xl mx-2 border border-slate-200 dark:border-slate-800">
                <div className="w-full flex items-center justify-between mb-5 pb-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">New Purchase</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all group">
                        <X className="w-6 h-6 text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200 cursor-pointer"/>
                    </button>
                </div>

                <form id="purchaseForm" onSubmit={handleFormSubmit} className="flex-grow overflow-y-auto space-y-9 md:pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id = "input-form-83vw">
                        <div>
                            <label htmlFor="PONumber" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">PO No.</label>
                            <input type="text" id="PONumber" name="PONumber" value={formValues.PONumber} readOnly className="w-full text-slate-700 dark:text-slate-200 px-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 cursor-not-allowed outline-none" />
                        </div>

                        <div className="relative">
                            <label htmlFor="CustomerName" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Customer Name</label>
                            <input
                                type="text"
                                id="CustomerName"
                                name="customer"
                                value={formValues.customer || ''}
                                onChange={handleCustomerChange}
                                onFocus={() => setIsDropdownOpen(true)}
                                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                                placeholder={loadingCustomers ? 'Loading customers...' : 'Select a customer'}
                                autoComplete="off"
                                className="w-full text-slate-700 dark:text-slate-200 px-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />

                            {isDropdownOpen && filteredCustomers.length > 0 && (
                                <ul onMouseDown={e => e.preventDefault()} className="absolute z-30 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto py-2 custom-scrollbar">
                                    {filteredCustomers.map((customer) => (
                                        <li
                                            key={customer.customer_id}
                                            onClick={() => selectCustomer(customer)}
                                            className="px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{customer.full_name}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{customer.contact_number}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Balance</p>
                                                    <p className={`text-sm font-semibold ${customer.remaining_balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                        ₱{customer.remaining_balance.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {isDropdownOpen && formValues.customer && filteredCustomers.length === 0 && !loadingCustomers && (
                                <div onMouseDown={e => e.preventDefault()} className="absolute z-30 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50">
                                    {!showNewCustomerForm ? (
                                        <div className="p-3">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-3">
                                                No customer named <span className="font-semibold text-slate-700 dark:text-slate-200">"{formValues.customer}"</span> found.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setShowNewCustomerForm(true)}
                                                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors border border-blue-200 dark:border-blue-800"
                                            >
                                                <UserPlus className="w-4 h-4" />
                                                Register "{formValues.customer}" as new customer
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="p-4 space-y-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-sm font-bold text-slate-700 dark:text-white">New Customer</p>
                                                <button type="button" onClick={() => setShowNewCustomerForm(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                                                    <X className="w-3.5 h-3.5 text-slate-500" />
                                                </button>
                                            </div>
                                            <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{formValues.customer}</p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">Credit limit: ₱20,000 (default)</p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={registerNewCustomer}
                                                disabled={isRegisteringCustomer}
                                                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isRegisteringCustomer ? 'Registering...' : (
                                                    <><UserPlus className="w-4 h-4" /> Register & Select</>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div>
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

                    {selectedCustomer && selectedCustomer.remaining_balance > 0 && (
                        <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">Customer has outstanding balance</p>
                                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                                    Current Balance: ₱{formValues.currentCustomerBalance.toLocaleString()} |
                                    Credit Limit: ₱{formValues.creditLimit.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    )}

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
                                    {/* Tooltip wrapper */}
                                    <div className="relative">
                                        <PhilippinePeso className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${overpaymentAmount > 0 ? 'text-emerald-500' : 'text-slate-500 dark:text-slate-400'}`} />
                                        <input
                                            type="text"
                                            name="amount"
                                            value={formValues.amount}
                                            onChange={handleInputChange}
                                            placeholder="0.00"
                                            autoComplete="off"
                                            className={`w-full pl-9 pr-3 py-1.5 h-10 rounded-lg border outline-none transition-all ${
                                                overpaymentAmount > 0
                                                    ? 'border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 focus:ring-2 focus:ring-emerald-400/30'
                                                    : 'border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                                            }`}
                                        />
                                        {/* ✅ Persistent tooltip — stays until overpaymentAmount drops to 0 */}
                                        {overpaymentAmount > 0 && (
                                            <div className="absolute bottom-full left-0 mb-2 z-50 w-max max-w-[220px] px-3 py-2 rounded-lg bg-emerald-600 dark:bg-emerald-700 text-white text-xs font-medium shadow-lg pointer-events-none">
                                                ₱{overpaymentAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} over the total — you'll be asked to apply this to the customer's balance.
                                                <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-emerald-600 dark:border-t-emerald-700" />
                                            </div>
                                        )}
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
                            <div>
                                <label htmlFor="remarks" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Remarks</label>
                                <textarea id="remarks" name="remarks" rows="3" value={formValues.remarks} onChange={handleInputChange} placeholder="Add transaction notes..." className="w-full text-slate-700 dark:text-slate-200 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none" />
                            </div>
                        </div>
                    </div>
                </form>

                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-3 flex-shrink-0 pr-5 md:pr-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer">Cancel</button>
                    <button type="submit" form="purchaseForm" disabled={purchaseItems.length === 0 || !formValues.customerId || isSaving} className="px-4 py-2 text-sm font-bold rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                        {isSaving ? "Saving..." : "Save Purchase"}
                    </button>
                </div>
            </div>

            <AddItemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddItem} />
            <EditItemModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} item={itemToEdit} onSave={handleSaveEditedItem} />

            {/* ✅ Overpayment confirmation modal */}
            <OverpaymentModal
                isOpen={showOverpaymentModal}
                extraAmount={overpaymentAmount}
                customerName={formValues.customer}
                onConfirm={() => executeSave(true)}
                onDecline={() => executeSave(false)}
            />
        </div>
    );
}

export default AddPurchaseModal;