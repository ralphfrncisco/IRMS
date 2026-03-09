import React, { useState, useRef, useMemo, useEffect } from 'react'
import { X, Upload, PhilippinePeso } from 'lucide-react'
import CustomFormSelect from './../Filters/CustomFormSelect'
import { supabase } from "../../lib/supabase";

// Dropdown Options
const productTypeOptions = [
    { label: 'Hog Pellets', value: 'Hog Pellets' },
    { label: 'Medication', value: 'Medication' },
    { label: 'Equipments', value: 'Equipments' },
];

const medicationUsageOptions = [
    { label: 'Antibiotics', value: 'Antibiotics' },
    { label: 'Vaccines', value: 'Vaccines' },
    { label: 'Parasiticides', value: 'Parasiticides' },
    { label: 'Hormones', value: 'Hormones' },
];

function AddProductModal({ isOpen, onClose }) {
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    const [suppliers, setSuppliers] = useState([]); 
    const [dbProductSrpList, setDbProductSrpList] = useState([]); // Dynamic SRP data
    const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
    const [isSrpDropdownOpen, setIsSrpDropdownOpen] = useState(false);
    
    const [formValues, setFormValues] = useState({
        supplierName: '',
        supplierId: null,
        productType: '',
        sub_category: '', 
        productName: '',
        srp: '', 
        stock: ''
    });

    // --- FETCH DATA FROM DATABASE ---
    useEffect(() => {
        const fetchData = async () => {
            if (!isOpen) return;
            setLoading(true);
            try {
                // 1. Fetch real suppliers
                const { data: supplierData } = await supabase
                    .from('supplier')
                    .select('id, supplierName')
                    .order('supplierName', { ascending: true });
                
                if (supplierData) {
                    setSuppliers(supplierData.map(s => ({ id: s.id, name: s.supplierName })));
                }

                // 2. Fetch retailProducts joined with supplier to get the names for SRP suggestions
                const { data: retailData } = await supabase
                    .from('retailProducts')
                    .select(`
                        netUnitPrice,
                        productName,
                        supplier:supplier_id ( supplierName )
                    `);
                
                if (retailData) {
                    const formattedSrp = retailData.map(item => ({
                        supplier: item.supplier?.supplierName || 'Unknown',
                        productName: item.productName,
                        srp: item.netUnitPrice
                    }));
                    setDbProductSrpList(formattedSrp);
                }
            } catch (err) {
                alert("Something went wrong. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isOpen]);

    // --- HELPERS ---
    const formatNumberWithCommas = (value) => {
        if (!value) return '';
        const cleanValue = value.toString().replace(/[^0-9.]/g, '');
        const parts = cleanValue.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0];
    };

    const formatCurrency = (value) => {
        if (!value && value !== 0) return '0.00';
        return new Intl.NumberFormat('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    const filteredSuppliers = useMemo(() => {
        return suppliers.filter(s => 
            (s.name || '').toLowerCase().includes((formValues.supplierName || '').toLowerCase())
        ).sort((a, b) => a.name.localeCompare(b.name));
    }, [formValues.supplierName, suppliers]);

    // Updated to use the dynamic dbProductSrpList
    const srpSuggestions = useMemo(() => {
        if (!formValues.productName) return [];
        return dbProductSrpList.filter(item => 
            item.productName.toLowerCase().includes(formValues.productName.toLowerCase())
        );
    }, [formValues.productName, dbProductSrpList]);

    // --- HANDLERS ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormValues(prev => ({ ...prev, [name]: value }));
    };

    const handleSrpChange = (e) => {
        const rawValue = e.target.value.replace(/,/g, '');
        if (/^\d*\.?\d*$/.test(rawValue)) {
            setFormValues(prev => ({ ...prev, srp: formatNumberWithCommas(rawValue) }));
        }
    };

    const handleSelectChange = (value, name) => {
        setFormValues(prev => {
            const newValues = { ...prev, [name]: value };
            if (name === 'productType' && value !== 'Medication') {
                newValues.sub_category = '';
            }
            return newValues;
        });
    };

    const handleSupplierSearch = (e) => {
        const value = e.target.value;
        const match = suppliers.find(s => s.name.toLowerCase() === value.toLowerCase());
        setFormValues(prev => ({ 
            ...prev, 
            supplierName: value, 
            supplierId: match ? match.id : null 
        }));
        setIsSupplierDropdownOpen(true);
    };

    const selectSupplier = (supplier) => {
        setFormValues(prev => ({ 
            ...prev, 
            supplierName: supplier.name, 
            supplierId: supplier.id 
        }));
        setIsSupplierDropdownOpen(false);
    };

    const selectSrp = (price) => {
        setFormValues(prev => ({ ...prev, srp: formatNumberWithCommas(price.toString()) }));
        setIsSrpDropdownOpen(false);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let imagePath = null;

            if (selectedImage) {
                const fileExt = selectedImage.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
                
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(fileName, selectedImage);

                if (uploadError) throw new Error("Storage Error: Failed to upload image.");
                imagePath = uploadData?.path || fileName;
            }

            const { error: insertError } = await supabase
                .from('products')
                .insert([{
                    name: formValues.productName,
                    price: parseFloat(formValues.srp.replace(/,/g, '')) || 0,
                    quantity: formValues.stock.toString(),
                    category: formValues.productType,
                    sub_category: formValues.sub_category,
                    image: imagePath,
                    supplier_name: formValues.supplierName,
                    supplier_id: formValues.supplierId
                }]);

            if (insertError) throw new Error("Database Error: Could not save product details.");
            
            // Clean up state
            setSelectedImage(null);
            setPreviewUrl(null);
            setFormValues({
                supplierName: '', supplierId: null, productType: '',
                sub_category: '', productName: '', srp: '', stock: ''
            });
            onClose();

        } catch (error) {
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex py-2 items-center justify-center overflow-y-auto">
            <div 
                className="flex flex-col max-h-[90vh] bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl shadow-2xl w-full max-w-4xl mx-2 border border-slate-200 dark:border-slate-800" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="w-full flex items-center justify-between mb-5 pb-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">New Product</h2>
                    <button onClick={onClose} disabled={loading} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all group disabled:opacity-50">
                        <X className="w-6 h-6 text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200 cursor-pointer"/>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                    <div className="flex flex-col md:flex-row gap-8 overflow-y-auto pb-6 pr-1">
                        
                        {/* LEFT SIDE: Image Upload */}
                        <div className="w-full md:w-1/2 space-y-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Product Image</label>
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => !loading && fileInputRef.current.click()}
                                className={`relative group cursor-pointer flex flex-col items-center justify-center w-full h-64 md:h-96 border-2 border-dashed rounded-2xl transition-all
                                    ${isDragging 
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                        : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/50'
                                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" disabled={loading} />

                                {previewUrl ? (
                                    <div className="relative w-full h-full p-2">
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-contain rounded-xl" />
                                        {!loading && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                                                <p className="text-white text-sm font-medium">Click to Change Image</p>
                                            </div>
                                        )}
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
                            <div className="relative">
                                <label htmlFor="SupplierName" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Supplier</label>
                                <input 
                                    type="text" 
                                    id="SupplierName" 
                                    name="supplierName" 
                                    value={formValues.supplierName} 
                                    onChange={handleSupplierSearch} 
                                    onFocus={() => !loading && setIsSupplierDropdownOpen(true)} 
                                    onBlur={() => setTimeout(() => setIsSupplierDropdownOpen(false), 200)} 
                                    placeholder="Select or type a supplier's name" 
                                    autoComplete="off" 
                                    disabled={loading}
                                    className="w-full text-sm text-slate-800 dark:text-slate-200 px-3 py-1.5 h-[2.4rem] rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all disabled:opacity-50" 
                                />
                                {isSupplierDropdownOpen && filteredSuppliers.length > 0 && (
                                    <ul className="absolute z-30 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto py-2">
                                        {filteredSuppliers.map((s) => (
                                            <li key={s.id} onClick={() => selectSupplier(s)} className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors">{s.name}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <CustomFormSelect 
                                label="Product Type"
                                name="productType"
                                options={productTypeOptions}
                                initialValue={formValues.productType}
                                onSelect={handleSelectChange}
                                placeholder="eg. Pellets, Medication"
                                disabled={loading}
                            />

                            {formValues.productType === 'Medication' && (
                                <CustomFormSelect 
                                    label="Medication Usage"
                                    name="sub_category"
                                    options={medicationUsageOptions}
                                    initialValue={formValues.sub_category}
                                    onSelect={handleSelectChange}
                                    placeholder="Select Usage Type"
                                    disabled={loading}
                                />
                            )}

                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Product Name</label>
                                <input type="text" name="productName" value={formValues.productName} onChange={handleInputChange} disabled={loading} className="mt-2 text-sm h-[2.4rem] w-full px-4 py-2 rounded-lg border border-slate-300/80 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50" placeholder="eg. Pre-Starter Pellets" />
                            </div>

                            <div className="relative">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Retail Price (SRP)</label>
                                <div className="relative mt-2">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                                        <PhilippinePeso className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                    </div>
                                    <input 
                                        type="text" 
                                        name="srp" 
                                        value={formValues.srp} 
                                        onChange={handleSrpChange} 
                                        onFocus={() => !loading && setIsSrpDropdownOpen(true)}
                                        onBlur={() => setTimeout(() => setIsSrpDropdownOpen(false), 200)}
                                        disabled={loading}
                                        className="pl-9 h-[2.4rem] w-full px-4 py-2 rounded-lg border border-slate-300/80 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50" 
                                        placeholder="0.00" 
                                        autoComplete="off"
                                    />
                                    {isSrpDropdownOpen && srpSuggestions.length > 0 && (
                                        <ul className="absolute z-30 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-40 overflow-y-auto py-2">
                                            {srpSuggestions.map((item, index) => (
                                                <li key={index} onClick={() => selectSrp(item.srp)} className="px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors">
                                                    <span className="font-bold">{item.supplier}</span> - ₱{formatCurrency(item.srp)}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Stock Quantity</label>
                                <input type="number" name="stock" value={formValues.stock} onChange={handleInputChange} disabled={loading} className="mt-2 h-[2.4rem] w-full px-4 py-2 rounded-lg border border-slate-300/80 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50" placeholder="0" />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-5 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 flex-shrink-0">
                        <button type="button" onClick={onClose} disabled={loading} className="px-7 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="px-7 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-md active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center min-w-[120px]">
                            {loading ? 'Uploading...' : 'Upload'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AddProductModal;