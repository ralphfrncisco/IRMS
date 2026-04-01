import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Briefcase, Loader2 } from 'lucide-react';
import { supabase } from "../../lib/supabase";
import noProfile from "../../assets/no-profile.png";

function AccountSettingsModal({ isOpen, onClose, currentProfile }) {
    const [profile, setProfile] = useState({
        full_name: '',
        email_address: '',
        phone: '',
        role: '',
        avatar_url: ''
    });
    const [isUpdating, setIsUpdating] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    useEffect(() => {
        if (currentProfile) {
            setProfile({
                full_name: currentProfile.full_name || '',
                email_address: currentProfile.email_address || '',
                role: currentProfile.role || '',
                avatar_url: currentProfile.avatar_url || ''
            });
            setAvatarPreview(currentProfile.avatar_url || noProfile);
        }
    }, [currentProfile]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsUpdating(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            let avatarUrl = profile.avatar_url;

            // Upload new avatar if selected
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${user.id}-${Date.now()}.${fileExt}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, avatarFile);

                if (uploadError) throw uploadError;

                // Get public URL
                const { data } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(fileName);

                avatarUrl = data.publicUrl;
            }

            // Update profile in database
            const { error: updateError } = await supabase
                .from('account')
                .update({
                    full_name: profile.full_name,
                    email_address: profile.email_address,
                    avatar_url: avatarUrl
                })
                .eq('user_id', user.id);

            if (updateError) throw updateError;

            alert('Profile updated successfully!');
            onClose();
            window.location.reload(); // Refresh to show new data
        } catch (err) {
            alert("Something went wrong. Please try again.");
        } finally {
            setIsUpdating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center overflow-y-auto p-4">
            <div 
                className="bg-white dark:bg-[#111] rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-white/10"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Account Settings</h2>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-all"
                    >
                        <X className="w-5 h-5 text-slate-500 dark:text-white/50" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <img 
                                src={avatarPreview} 
                                alt="Avatar" 
                                className="w-20 h-20 rounded-full ring-4 ring-blue-500 object-cover"
                            />
                            <label 
                                htmlFor="avatar-upload" 
                                className="absolute bottom-0 right-0 p-2 bg-blue-500 hover:bg-blue-600 rounded-full cursor-pointer transition-colors"
                            >
                                <User className="w-4 h-4 text-white" />
                            </label>
                            <input 
                                id="avatar-upload"
                                type="file" 
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-white/50">Click the icon to change avatar</p>
                    </div>

                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-white/70 mb-2">
                            Full Name
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-white/70" />
                            <input
                                type="text"
                                name="full_name"
                                value={profile.full_name}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-white/5 bg-white dark:bg-[#1E1E1E] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                    </div>

                    {/* Email (Read-only) */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-white/70 mb-2">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-white/70" />
                            <input
                                type="email"
                                value={profile.email_address}
                                readOnly
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-white/5 bg-slate-50 dark:bg-[#1E1E1E] text-slate-500 dark:text-white/50 cursor-not-allowed"
                            />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-white/50 mt-1">Email cannot be changed</p>
                    </div>

                    {/* Role (Read-only) */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-white/70 mb-2">
                            Role
                        </label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-white/70" />
                            <input
                                type="text"
                                value={profile.role}
                                readOnly
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-white/5 bg-slate-50 dark:bg-[#1E1E1E] text-slate-500 dark:text-white/50 cursor-not-allowed"
                            />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-white/50 mt-1">Role cannot be changed</p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg text-slate-700 dark:text-white/70 bg-slate-100 dark:bg-[#1E1E1E] hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isUpdating}
                            className="flex-1 px-4 py-2.5 text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {isUpdating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AccountSettingsModal;