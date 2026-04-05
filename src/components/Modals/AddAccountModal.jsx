import React, { useState, useRef } from 'react';
import { X, Upload, Eye, EyeClosed, Loader2 } from 'lucide-react';
import { supabase } from "../../lib/supabase";
import CustomFormSelect from './../Filters/CustomFormSelect';

const roleOptions = [
    { label: 'Staff', value: 'Staff' },
    { label: 'Administrator', value: 'Administrator' },
];

function AddAccountModal({ isOpen, onClose, onSuccess }) {
    const fileInputRef = useRef(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [selectedRole, setSelectedRole] = useState('');

    // Form States
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    

    if (!isOpen) return null;

    const togglePasswordVisibility = () => setShowPassword(!showPassword);
    const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        
        // Basic Validation
        if (password !== confirmPassword) return alert("Passwords do not match!");
        if (!email || !fullName) return alert("Please fill in all required fields.");
        
        setLoading(true);
        try {
            let avatarUrl = null;

            // 1. Upload Image to Supabase Storage Bucket 'avatars'
            if (selectedImage) {
                const fileExt = selectedImage.name.split('.').pop();
                // Use timestamp + random to ensure unique filenames
                const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
                const filePath = fileName;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, selectedImage);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);
                
                avatarUrl = publicUrl;
            }

            // 2. Create User in Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email.trim(), // Trim to prevent whitespace issues
                password: password,
            });

            if (authError) {
                if (authError.message.includes("rate limit")) {
                    throw new Error("Too many attempts. Please wait a few minutes or disable rate limits in Supabase.");
                }
                throw authError;
            }

            if (!authData?.user) throw new Error("User creation failed. Please try again.");

            // 3. Insert into public.account 
            // We explicitly pass the state strings here to avoid "255" or object errors
            const { error: profileError } = await supabase
                .from('account')
                .insert([{
                    user_id: authData.user.id,
                    email_address: String(email).trim(), 
                    full_name: String(fullName).trim(),
                    avatar_url: avatarUrl,
                    role: selectedRole
                }]);

            if (profileError) throw profileError;

            // 4. Success handling
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
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4" onClick={onClose}>
            <div className="flex flex-col h-auto md:max-h-[90vh] bg-white dark:bg-[#111] p-4 md:p-6 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-white/10 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                <div className="w-full flex items-center justify-between mb-5 pb-4 border-b border-slate-200 dark:border-white/10">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Create an Account</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-all group">
                        <X className="w-6 h-6 text-slate-500 group-hover:text-slate-700 dark:text-white/50 dark:group-hover:text-slate-200 cursor-pointer"/>
                    </button>
                </div>

                <form id="addAccountForm" onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto mb-6">
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
                                    : 'border-slate-300 dark:border-white/20 hover:border-slate-400 dark:hover:border-blue-500/50 bg-slate-50 dark:bg-[#111]'
                                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" disabled={loading} />
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain rounded-xl p-2" />
                            ) : (
                                <div className="flex flex-col items-center p-4">
                                    <div className="p-4 bg-white dark:bg-white/5 rounded-full shadow-sm mb-3">
                                        <Upload className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 text-center">Click to upload or drag and drop</p>
                                    <p className="text-xs text-slate-500 dark:text-white/50 mt-1">PNG, JPG or WebP (Max 5MB)</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-white/90 mb-2">Full Name</label>
                            <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Juan dela Cruz" className="w-full text-slate-700 text-sm dark:text-slate-200 px-3 py-2 rounded-lg border dark:bg-[#1E1E1E] border-slate-300 dark:border-slate-100/20 outline-none focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-white/90 mb-2">Email</label>
                            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="juan@example.com" className="w-full text-slate-700 text-sm dark:text-slate-200 px-3 py-2 rounded-lg border dark:bg-[#1E1E1E] border-slate-300 dark:border-slate-100/20 outline-none focus:border-blue-500" />
                        </div>
                        <div>
                            <CustomFormSelect
                                label="Role"
                                name="selectedRole"
                                options={roleOptions}
                                initialValue={selectedRole}
                                onSelect={(value, name) => setSelectedRole(value)}
                            />
                        </div>
                        <div className="relative">
                            <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-white/90 mb-2">Password</label>
                            <div className="flex items-center px-3 py-1.5 rounded-lg border dark:bg-[#1E1E1E] border-slate-300 dark:border-slate-100/20">
                                <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="flex-1 bg-transparent text-slate-700 dark:text-white outline-none" />
                                <button type="button" onClick={togglePasswordVisibility} className="text-slate-500 dark:text-white/50">{showPassword ? <Eye className="w-4 h-4" /> : <EyeClosed className="w-4 h-4" />}</button>
                            </div>
                        </div>
                        <div className="relative">
                            <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-white/90 mb-2">Confirm Password</label>
                            <div className="flex items-center px-3 py-1.5 rounded-lg border dark:bg-[#1E1E1E] border-slate-300 dark:border-slate-100/20">
                                <input type={showConfirmPassword ? "text" : "password"} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="flex-1 bg-transparent text-slate-700 dark:text-white outline-none" />
                                <button type="button" onClick={toggleConfirmPasswordVisibility} className="text-slate-500 dark:text-white/50">{showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeClosed className="w-4 h-4" />}</button>
                            </div>
                        </div>
                    </div>
                </form>

                <div className="pt-5 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3">
                    <button type="button" onClick={onClose} disabled={loading}
                    className="px-6 py-2.5 text-sm font-medium rounded-lg text-slate-700 dark:text-white/70 bg-slate-100 dark:bg-[#1E1E1E] hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                    <button form="addAccountForm" type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center">
                        {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating...</> : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AddAccountModal;