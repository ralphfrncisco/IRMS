import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Eye, EyeClosed, Loader2 } from 'lucide-react';
import { supabase } from "../../lib/supabase"; // Ensure your path is correct

function EditAccountModal({ isOpen, onClose, account, onSuccess }) {
    const fileInputRef = useRef(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    // Form States
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // --- SYNC DATA WHEN MODAL OPENS OR ACCOUNT CHANGES ---
    useEffect(() => {
        if (isOpen && account) {
            setFullName(account.full_name || '');
            setEmail(account.email_address || '');
            setPreviewUrl(account.avatar_url || null);
            setPassword(''); // Don't pre-fill password for security
            setConfirmPassword('');
            setSelectedImage(null);
        }
    }, [isOpen, account]);

    if (!isOpen) return null;

    const togglePasswordVisibility = () => setShowPassword(!showPassword);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (password && password !== confirmPassword) {
            return alert("Passwords do not match!");
        }

        setLoading(true);
        try {
            let finalAvatarUrl = account.avatar_url;

            // 1. Upload new image if selected
            if (selectedImage) {
                const fileExt = selectedImage.name.split('.').pop();
                const fileName = `${account.user_id}-${Date.now()}.${fileExt}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, selectedImage);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
                finalAvatarUrl = data.publicUrl;
            }

            // 2. Update the public.account table
            const { error: updateError } = await supabase
                .from('account')
                .update({
                    full_name: fullName,
                    email_address: email,
                    avatar_url: finalAvatarUrl
                })
                .eq('id', account.id);

            if (updateError) throw updateError;

            // 3. Optional: Update Auth Password if provided
            if (password) {
                const { error: authError } = await supabase.auth.updateUser({ 
                    password: password 
                });
                if (authError) throw authError;
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
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

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center overflow-y-auto p-2 md:p-4"
            onClick={onClose}
        >
            <div 
                className="flex flex-col h-auto md:max-h-[70vh] mt-20 md:mt-0 space-y-4 bg-white dark:bg-[#111] p-4 md:p-6 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-white/10 animate-in fade-in zoom-in duration-200 overflow-y-auto" 
                onClick={e => e.stopPropagation()}
            >
                <div className="w-full flex items-center justify-between mb-5 pb-4 border-b border-slate-200 dark:border-white/10 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Edit Account Profile</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-all group">
                        <X className="w-6 h-6 text-slate-500 group-hover:text-slate-700 dark:text-white/50 dark:group-hover:text-slate-200 cursor-pointer"/>
                    </button>
                </div>

                <form id="edit-account-form" onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:pr-2">
                    <div className="w-full space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-white/70">Profile Image</label>
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => !loading && fileInputRef.current.click()}
                            className={`relative group cursor-pointer flex flex-col items-center justify-center w-full h-64 md:h-72 border-2 border-dashed rounded-2xl transition-all
                                ${isDragging 
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                    : 'border-slate-300 dark:border-white/30 hover:border-slate-400 dark:hover:border-blue-500 bg-slate-50 dark:bg-[#1E1E1E]'
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
                                    <div className="p-4 bg-white dark:bg-[#1E1E1E] rounded-full shadow-sm mb-3">
                                        <Upload className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 text-center">Click to upload or drag and drop</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className = "space-y-4">
                        <div className="w-full">
                            <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-white/90">Full Name</label>
                            <input 
                                type="text" 
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full text-slate-700 dark:text-slate-200 px-3 py-2 rounded-lg border outline-none transition-all duration-300 border-slate-300 dark:border-slate-100/20 dark:bg-[#1E1E1E] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                        <div className="w-full">
                            <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-white/90">Email</label>
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full text-slate-700 dark:text-slate-200 px-3 py-2 rounded-lg border outline-none transition-all duration-300 border-slate-300 dark:border-slate-100/20 dark:bg-[#1E1E1E] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                        <div className="w-full mb-7">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-white/90 mb-1">New Password (Optional)</label>
                            <div className="flex items-center justify-between w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-100/20 dark:bg-[#1E1E1E] focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Leave blank to keep current" 
                                    className="flex-1 bg-transparent text-slate-700 dark:text-slate-200 outline-none" 
                                />
                                <button type="button" onClick={togglePasswordVisibility} className="ml-2 text-slate-500 dark:text-white/50">
                                    {showPassword ? <Eye className="w-5 h-5" /> : <EyeClosed className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>

                <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3 flex-shrink-0">
                    <button type="button" onClick={onClose} disabled={loading} className="px-7 py-2 text-slate-600 text-sm font-medium dark:text-white/70 dark:bg-[#1E1E1E] hover:bg-slate-100 dark:hover:bg-white/20 rounded-lg">
                        Close
                    </button>
                    <button 
                        form="edit-account-form"
                        type="submit" 
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-sm text-white rounded-lg hover:bg-blue-700 transition-colors font-bold flex items-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default EditAccountModal;