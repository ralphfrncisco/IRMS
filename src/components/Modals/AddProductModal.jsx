import React, { useState, useRef } from 'react'
import { X, Upload } from 'lucide-react'

function AddProductModal({ isOpen, onClose }) {
    const [selectedImage, setSelectedImage] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    // Handlers for image upload
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) setSelectedImage(URL.createObjectURL(file));
    };

    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) setSelectedImage(URL.createObjectURL(file));
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex py-2 items-center justify-center overflow-y-auto">
            <div 
                className="flex flex-col h-auto max-h-[90vh] bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl shadow-2xl w-full max-w-4xl mx-2 border border-slate-200 dark:border-slate-800" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="w-full flex items-center justify-between mb-5 pb-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">New Product</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all group">
                        <X className="w-6 h-6 text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200 cursor-pointer"/>
                    </button>
                </div>

                <form className="flex flex-col h-full overflow-hidden">
                    {/* Main Content Area: Split into Left and Right */}
                    <div className="flex flex-col md:flex-row gap-8 overflow-y-auto pb-6">
                        
                        {/* LEFT SIDE: Image Upload */}
                        <div className="w-full md:w-1/2 space-y-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Product Image</label>
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current.click()}
                                className={`relative group cursor-pointer flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl transition-all
                                    ${isDragging 
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                        : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/50'
                                    }`}
                            >
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

                                {selectedImage ? (
                                    <div className="relative w-full h-full p-2">
                                        <img src={selectedImage} alt="Preview" className="w-full h-full object-contain rounded-xl" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                                            <p className="text-white text-sm font-medium">Click to Change Image</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center p-4">
                                        <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-sm mb-3">
                                            <Upload className="w-6 h-6 text-blue-500" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 text-center">Click to upload or drag and drop</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">PNG, JPG or WebP (Max 5MB)</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT SIDE: Input Fields */}
                        <div className="w-full md:w-1/2 space-y-4">
                            <div>
                                <label className="text-sm font-semibold dark:text-slate-300">Product Name</label>
                                <input type="text" className="mt-2 w-full px-4 py-2.5 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="Enter product name" />
                            </div>
                            <div>
                                <label className="text-sm font-semibold dark:text-slate-300">Price</label>
                                <input type="number" className="mt-2 w-full px-4 py-2.5 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="0.00" />
                            </div>
                            <div>
                                <label className="text-sm font-semibold dark:text-slate-300">Stock</label>
                                <input type="number" className="mt-2 w-full px-4 py-2.5 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="0.00" />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons: Fixed at bottom of form */}
                    <div className="pt-5 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 flex-shrink-0">
                        <button type="button" onClick={onClose} className="px-8 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-md active:scale-95 transition-all">
                            Save Product
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AddProductModal;