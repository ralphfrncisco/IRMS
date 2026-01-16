import React, { useState, useMemo, useEffect } from 'react';
import { X, Calendar, Plus, Trash2 } from 'lucide-react';

function AddSupplierModal({ isOpen, onClose }) {
    // 1. STATE HOOKS (All Hooks MUST be at the very top)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [receiptFileName, setReceiptFileName] = useState('No file chosen');
    
    const [formValues, setFormValues] = useState({
        supplier: '',
        contactNumber: '',
        Address: '',
        remarks: '',
    });

    // 2. INPUT HANDLER (Missing in your original code)
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormValues(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        onClose();
    };

    const handleFileChange = (event) => {
        const files = event.target.files;
        if (files.length > 0) {
            setReceiptFileName(files[0].name);
        } else {
            setReceiptFileName('No file chosen');
        }
    };

    // 3. EARLY RETURN (Must come AFTER all Hook declarations)
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex py-2 items-center justify-center overflow-y-auto">
            <div 
                className="flex flex-col h-full md:max-h-[80vh] bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl shadow-2xl w-full max-w-2xl mx-2 border border-slate-200 dark:border-slate-800" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="w-full flex items-center justify-between mb-5 pb-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">New Supplier</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all group">
                        <X className="w-6 h-6 text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200 cursor-pointer"/>
                    </button>
                </div>

                <form onSubmit={handleFormSubmit} className="flex-grow overflow-y-auto space-y-9 md:pr-2">
                    
                    {/* Input Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-85 md:max-w-full">
                        <div className="relative max-w-80 md:w-full">
                            <label htmlFor="supplier" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Supplier Name</label>
                            <input
                                type="text" 
                                id="supplier"
                                name="supplier"
                                value={formValues.supplier}
                                onChange={handleInputChange}
                                className="w-full text-slate-700 dark:text-slate-200 px-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>

                        <div className="relative max-w-80 md:w-full">
                            <label htmlFor="contactNumber" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Number</label>
                            <input
                                type="text" 
                                id="contactNumber"
                                name="contactNumber"
                                value={formValues.contactNumber}
                                onChange={handleInputChange}
                                className="w-full text-slate-700 dark:text-slate-200 px-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div className= "w-full col-span-2">
                            <label htmlFor="address" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Number</label>
                            <input
                                type="text" 
                                id="address"
                                name="address"
                                value={formValues.Address}
                                onChange={handleInputChange}
                                className="w-full text-slate-700 dark:text-slate-200 px-3 py-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col space-y-4 text-slate-800 dark:text-slate-200 pr-5 md:pr-0">
                        <div className="flex items-center justify-between">
                            <h1 className="text-xl font-bold">Retail Products</h1>
                            <button 
                                type="button"
                                // onClick={() => setIsModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md active:scale-95 cursor-pointer"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Add Item</span>
                            </button>
                        </div>
                        <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                            <table className="w-full">
                                <thead className="bg-slate-100 dark:bg-slate-800">
                                    <tr>
                                        <th className="p-4 text-center text-sm font-semibold text-slate-600 dark:text-slate-200">Product</th>
                                        <th className="p-4 text-center text-sm font-semibold text-slate-600 dark:text-slate-200">Unit Price</th>
                                        <th className="p-4 text-center text-sm font-semibold text-slate-600 dark:text-slate-200">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* {purchaseItems.length > 0 ? (
                                        <>
                                            {purchaseItems.map((item) => (
                                                <tr key={item.id} className="border-b border-slate-200 dark:border-slate-800 text-center transition-colors">
                                                    <td className="p-4 md:pl-10 text-left text-sm text-slate-700 dark:text-slate-200">{item.name}</td>
                                                    <td className="p-4 text-sm text-slate-700 dark:text-slate-200">₱{item.price.toLocaleString()}</td>
                                                    <td className="p-4 text-sm text-slate-700 dark:text-slate-200">{item.quantity}</td>
                                                    <td className="p-4 text-sm text-slate-700 dark:text-slate-200">₱{item.total.toLocaleString()}</td>
                                                    <td className="p-4 text-center">
                                                        <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700 p-1 cursor-pointer">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="bg-blue-50/50 dark:bg-blue-900/10 font-bold">
                                                <td colSpan="3" className="p-4 text-right text-slate-600 dark:text-slate-400 uppercase text-xs tracking-wider">Grand Total:</td>
                                                <td className="p-4 text-center text-blue-600 dark:text-blue-400 text-lg">
                                                    ₱{totalAmount.toLocaleString()}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </>
                                    ) : ( */}
                                        <tr>
                                            <td colSpan="5" className="p-8 text-center text-sm text-slate-400 italic">No products added yet.</td>
                                        </tr>
                                    {/* )} */}
                                </tbody>
                            </table>
                        </div>
                        {/* <div className="block md:hidden space-y-4 mb-5">
                            {purchaseItems.length > 0 ? (
                                <>
                                    {purchaseItems.map((item) => (
                                        <div key={item.id} className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm">
                                            
                                            <div className="bg-slate-100 dark:bg-slate-700/50 px-4 py-3 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                                                <span className="font-bold text-blue-600 dark:text-blue-400 truncate pr-4">{item.name}</span>
                                                <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-500 p-1 active:scale-90 transition-transform">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            
                                            <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                                <div className="flex justify-between px-4 py-2.5">
                                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-tighter">Unit Price</span>
                                                    <span className="text-sm font-medium">₱{item.price.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between px-4 py-2.5">
                                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-tighter">Quantity</span>
                                                    <span className="text-sm font-medium">{item.quantity}</span>
                                                </div>
                                                <div className="flex justify-between px-4 py-2.5 bg-blue-50/30 dark:bg-blue-900/10">
                                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tighter">Subtotal</span>
                                                    <span className="text-sm font-black text-blue-600">₱{item.total.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    <div className="p-4 rounded-xl bg-blue-600 text-white flex justify-between items-center shadow-lg">
                                        <span className="text-xs font-black uppercase tracking-widest">Grand Total</span>
                                        <span className="text-xl font-bold">₱{totalAmount.toLocaleString()}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="p-8 text-center text-sm text-slate-400 italic border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                    No products added yet.
                                </div>
                            )}
                        </div> */}
                    </div>
                        
                    <div>
                        <label htmlFor="remarks" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Remarks</label>
                        <textarea
                            id="remarks"
                            name="remarks"
                            rows="3"
                            value={formValues.remarks}
                            onChange={handleInputChange}
                            placeholder="Add notes..."
                            className="w-full text-slate-700 dark:text-slate-200 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                        ></textarea>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-3 flex-shrink-0 pr-5 md:pr-0">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="px-4 py-2 text-sm font-bold rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md active:scale-95"
                        >
                            Save Supplier
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddSupplierModal;