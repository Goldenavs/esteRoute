import { useState, useEffect, useRef, useId } from 'react';
import { 
  Award, 
  User, 
  Camera, 
  CheckCircle2, 
  Bell, 
  LogOut, 
  Lock, 
  ChevronLeft,
  ChevronRight, 
  Loader2, 
  AlertCircle,
  Check,
  Sparkles,
  Mail,
  Cpu,
  X,
  Eye,
  EyeOff,
  KeyRound
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { supabase } from '../../lib/supabase';

// Built-in adventurer avatar options matching the mobile app
const AVATAR_OPTIONS = [
  'CUSTOM',
  'https://api.dicebear.com/7.x/adventurer/png?seed=Tuklas1&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/adventurer/png?seed=Tuklas2&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/adventurer/png?seed=Tuklas3&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/adventurer/png?seed=Tuklas4&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/adventurer/png?seed=Tuklas5&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/adventurer/png?seed=Tuklas6&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/adventurer/png?seed=Tuklas7&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/adventurer/png?seed=Tuklas8&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/adventurer/png?seed=Tuklas9&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/adventurer/png?seed=Tuklas10&backgroundColor=ffdfbf',
];

// Subtle, eye-friendly traveling perimeter highlight matching esteRoute cards
const BorderBeam = ({ delay = 0, color = "#60A5FA" }: { delay?: number; color?: string }) => {
  const id = useId();
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-sm z-10">
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3F72AF" stopOpacity="0" />
            <stop offset="50%" stopColor={color} stopOpacity="0.85" />
            <stop offset="100%" stopColor="#3F72AF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.rect
          x="1"
          y="1"
          width="calc(100% - 2px)"
          height="calc(100% - 2px)"
          rx="2"
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth="2.5"
          strokeDasharray="140 1200"
          animate={{
            strokeDashoffset: [1340, 0],
          }}
          transition={{
            duration: 9,
            delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </svg>
    </div>
  );
};

interface CitizenProfileData {
  id: string;
  fullName: string;
  avatarUrl: string;
  stewardshipScore: number;
  role: string;
  phone: string;
  email: string;
  totalReportsCount: number;
  resolvedReportsCount: number;
  isGuest: boolean;
}

export default function CitizenProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile and Auth States
  const [profile, setProfile] = useState<CitizenProfileData>({
    id: '',
    fullName: '',
    avatarUrl: '',
    stewardshipScore: 0,
    role: 'citizen',
    phone: '',
    email: '',
    totalReportsCount: 0,
    resolvedReportsCount: 0,
    isGuest: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Avatar Swiper / Selection State
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState<number>(1);
  const [customProfileImage, setCustomProfileImage] = useState<string | null>(null);
  const avatarSliderRef = useRef<HTMLDivElement>(null);

  // Preference Toggles (Local Storage Persisted)
  const [smsUpdates, setSmsUpdates] = useState(() => {
    return localStorage.getItem('esteroute_pref_sms') !== 'false';
  });
  const [pushNotifications, setPushNotifications] = useState(() => {
    return localStorage.getItem('esteroute_pref_push') !== 'false';
  });

  // Change Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // 1. Fetch User Session & Profile Data from Supabase
  useEffect(() => {
    let isMounted = true;

    async function loadCitizenProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        // Count reports tracked by this user in localStorage and database
        const savedTrackingRefs: string[] = JSON.parse(localStorage.getItem('esteroute_my_reports') || '[]');

        if (!user) {
          // Guest User State
          let guestTotalReports = savedTrackingRefs.length;
          let guestResolvedReports = 0;

          if (savedTrackingRefs.length > 0) {
            const { data: guestReports } = await supabase
              .from('reports')
              .select('status')
              .in('tracking_reference', savedTrackingRefs);
            
            if (guestReports) {
              guestTotalReports = guestReports.length;
              guestResolvedReports = guestReports.filter(r => r.status === 'resolved').length;
            }
          }

          if (isMounted) {
            const defaultGuestAvatar = AVATAR_OPTIONS[1];
            setProfile({
              id: 'guest',
              fullName: 'Guest Reporter',
              avatarUrl: defaultGuestAvatar,
              stewardshipScore: guestResolvedReports * 50 + guestTotalReports * 10,
              role: 'citizen',
              phone: '',
              email: '',
              totalReportsCount: guestTotalReports,
              resolvedReportsCount: guestResolvedReports,
              isGuest: true,
            });
            setFullName('Guest Reporter');
            setPhoneNumber('');
            setSelectedAvatarIndex(1);
            setIsLoading(false);
          }
          return;
        }

        // Authenticated User State: Query 'profiles' table
        const { data: profileRow, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, stewardship_score, role')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.warn('Profile fetch note:', profileError.message);
        }

        // Parse Name (single full_name field)
        const resolvedFullName = profileRow?.full_name || user.user_metadata?.full_name || 'Citizen Reporter';

        // Extract Phone (from user metadata or auth)
        const initialPhone = (user.phone || user.user_metadata?.phone || '').replace(/^\+?63/, '').trim();

        // Determine avatar selection & custom image state
        const initialAvatarUrl = profileRow?.avatar_url || user.user_metadata?.avatar_url || AVATAR_OPTIONS[1];
        const matchedIndex = AVATAR_OPTIONS.indexOf(initialAvatarUrl);
        if (matchedIndex > 0) {
          setSelectedAvatarIndex(matchedIndex);
        } else if (initialAvatarUrl) {
          setSelectedAvatarIndex(0);
          setCustomProfileImage(initialAvatarUrl);
        } else {
          setSelectedAvatarIndex(1);
        }

        // Query user's actual submitted reports from 'reports' table
        let userTotalReports = 0;
        let userResolvedReports = 0;

        let reportsQuery = supabase
          .from('reports')
          .select('status, reporter_id, tracking_reference');

        if (savedTrackingRefs.length > 0) {
          reportsQuery = reportsQuery.or(`reporter_id.eq.${user.id},tracking_reference.in.(${savedTrackingRefs.map(ref => `"${ref}"`).join(',')})`);
        } else {
          reportsQuery = reportsQuery.eq('reporter_id', user.id);
        }

        const { data: userReports } = await reportsQuery;

        if (userReports) {
          userTotalReports = userReports.length;
          userResolvedReports = userReports.filter(r => r.status === 'resolved').length;
        }

        const calculatedScore = profileRow?.stewardship_score ?? (userResolvedReports * 50 + userTotalReports * 15);

        if (isMounted) {
          setProfile({
            id: user.id,
            fullName: resolvedFullName,
            avatarUrl: initialAvatarUrl,
            stewardshipScore: calculatedScore,
            role: profileRow?.role || 'citizen',
            phone: initialPhone,
            email: user.email || '',
            totalReportsCount: userTotalReports,
            resolvedReportsCount: userResolvedReports,
            isGuest: false,
          });

          setFullName(resolvedFullName);
          setPhoneNumber(initialPhone);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        if (isMounted) setIsLoading(false);
      }
    }

    loadCitizenProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Save Personal Information to Supabase
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();

    if (profile.isGuest) {
      showToast('Create a free account to persist and sync your profile information.', 'error');
      return;
    }

    const trimmedFullName = fullName.trim() || 'Citizen Reporter';

    setIsSaving(true);
    try {
      // Update 'profiles' table
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          full_name: trimmedFullName,
        })
        .eq('id', profile.id);

      if (profileUpdateError) {
        throw profileUpdateError;
      }

      // Update user metadata in auth
      await supabase.auth.updateUser({
        data: {
          full_name: trimmedFullName,
          phone: phoneNumber.trim() ? `+63${phoneNumber.trim()}` : '',
        },
      });

      setProfile(prev => ({
        ...prev,
        fullName: trimmedFullName,
        phone: phoneNumber.trim(),
      }));

      showToast('Profile updated successfully!', 'success');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Could not save profile changes.';
      console.error('Update profile error:', err);
      showToast(errorMsg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Avatar Swiper & Selection Logic
  const handleSelectAvatar = async (index: number) => {
    if (index === 0) {
      // Slot 0: Custom device image
      if (!customProfileImage || selectedAvatarIndex === 0) {
        fileInputRef.current?.click();
      } else {
        setSelectedAvatarIndex(0);
        setProfile(prev => ({ ...prev, avatarUrl: customProfileImage }));
        if (!profile.isGuest) {
          try {
            await supabase.from('profiles').update({ avatar_url: customProfileImage }).eq('id', profile.id);
            showToast('Custom photo selected!', 'success');
          } catch (e) {
            console.error('Avatar sync note:', e);
          }
        }
      }
      return;
    }

    setSelectedAvatarIndex(index);
    const chosenUrl = AVATAR_OPTIONS[index];
    setProfile(prev => ({ ...prev, avatarUrl: chosenUrl }));

    if (!profile.isGuest) {
      try {
        await supabase.from('profiles').update({ avatar_url: chosenUrl }).eq('id', profile.id);
        showToast('Avatar updated!', 'success');
      } catch (err) {
        console.error('Failed to update avatar:', err);
      }
    } else {
      showToast('Avatar preview selected (Register to sync permanently).', 'success');
    }
  };

  const scrollAvatars = (direction: 'left' | 'right') => {
    if (avatarSliderRef.current) {
      const scrollAmount = direction === 'left' ? -160 : 160;
      avatarSliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // 4. Upload & Update Custom Avatar in Supabase Storage
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit image size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file must be under 5MB.', 'error');
      return;
    }

    const localPreviewUrl = URL.createObjectURL(file);
    setCustomProfileImage(localPreviewUrl);
    setSelectedAvatarIndex(0);
    setProfile(prev => ({ ...prev, avatarUrl: localPreviewUrl }));

    if (profile.isGuest) {
      showToast('Custom photo set locally. Sign in to save permanently!', 'success');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `user-avatars/${fileName}`;

      // Upload to 'avatars' storage bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicAvatarUrl = urlData.publicUrl;

      // Update profiles table
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicAvatarUrl })
        .eq('id', profile.id);

      if (updateProfileError) {
        throw updateProfileError;
      }

      setCustomProfileImage(publicAvatarUrl);
      setProfile(prev => ({ ...prev, avatarUrl: publicAvatarUrl }));
      showToast('Profile photo uploaded and saved!', 'success');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to upload photo.';
      console.error('Upload avatar error:', err);
      showToast(errorMsg, 'error');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 4. Handle Change Password for Signed-in User
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (profile.isGuest) {
      setPasswordError('Guest reporters cannot set or change passwords. Please register an account.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setPasswordError('Please fill in both password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match. Please verify and try again.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      setIsPasswordModalOpen(false);
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password updated successfully!', 'success');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update password.';
      console.error('Password update error:', err);
      setPasswordError(errorMsg);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // 5. Handle Sign Out
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (err) {
      console.error('Sign out error:', err);
      navigate('/login');
    }
  };

  // 5. Toggle Notification Preferences
  const handleToggleSms = (val: boolean) => {
    setSmsUpdates(val);
    localStorage.setItem('esteroute_pref_sms', String(val));
    showToast(`SMS updates ${val ? 'enabled' : 'disabled'}.`);
  };

  const handleTogglePush = (val: boolean) => {
    setPushNotifications(val);
    localStorage.setItem('esteroute_pref_push', String(val));
    showToast(`Push notifications ${val ? 'enabled' : 'disabled'}.`);
  };

  return (
    <div className="w-full flex-1 flex flex-col pb-12 font-sans">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            transition={{ duration: 0.2 }}
            className="fixed top-6 left-1/2 z-[300] pointer-events-none"
          >
            <div className={twMerge(
              "text-white px-5 py-3 rounded-sm shadow-2xl border-b-4 -skew-x-3 sm:-skew-x-6 flex items-center gap-3 font-medium text-xs sm:text-sm",
              toast.type === 'success' 
                ? "bg-brand-primary border-brand-secondary shadow-brand-primary/30" 
                : "bg-semantic-urgent border-red-950 shadow-red-900/30"
            )}>
              <div className="skew-x-3 sm:skew-x-6 flex items-center gap-2">
                {toast.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-white" />
                )}
                <span>{toast.message}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => !isUpdatingPassword && setIsPasswordModalOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="relative w-full max-w-md z-10 -skew-x-2 sm:-skew-x-3"
            >
              <div className="w-full bg-surface border-2 border-brand-primary/60 rounded-sm p-6 sm:p-7 shadow-2xl relative overflow-hidden">
                <BorderBeam delay={0} color="#60A5FA" />
                <div className="absolute top-0 left-0 w-2 h-full bg-brand-primary" />
                
                {/* Upright Content Wrapper */}
                <div className="skew-x-2 sm:skew-x-3 relative z-10 font-sans">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-subtle">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-brand-primary/10 rounded-sm text-brand-primary -skew-x-6 shadow-xs">
                        <Lock className="w-4 h-4 skew-x-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-heading font-bold uppercase tracking-wider text-text-primary">
                          Change Password
                        </h3>
                        <p className="text-xs text-text-muted mt-0.5">
                          Update credentials for your citizen account
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => !isUpdatingPassword && setIsPasswordModalOpen(false)}
                      disabled={isUpdatingPassword}
                      className="p-1 text-text-muted hover:text-text-primary rounded-sm transition-colors cursor-pointer hover:bg-app-bg"
                      title="Close"
                      aria-label="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Error Notification */}
                  {passwordError && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 rounded-sm bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{passwordError}</span>
                    </motion.div>
                  )}

                  {/* Password Form */}
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    {/* New Password */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="new-password" className="text-xs font-medium text-text-secondary">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          id="new-password"
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          required
                          minLength={6}
                          disabled={isUpdatingPassword}
                          className="w-full bg-app-bg border border-border-strong rounded-sm pl-3.5 pr-10 py-2.5 text-text-primary text-sm font-sans focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                          title={showNewPassword ? 'Hide password' : 'Show password'}
                          aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm New Password */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="confirm-new-password" className="text-xs font-medium text-text-secondary">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          id="confirm-new-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          required
                          minLength={6}
                          disabled={isUpdatingPassword}
                          className="w-full bg-app-bg border border-border-strong rounded-sm pl-3.5 pr-10 py-2.5 text-text-primary text-sm font-sans focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                          title={showConfirmPassword ? 'Hide password' : 'Show password'}
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-text-muted font-sans leading-normal">
                      Must contain at least 6 characters. Your current session will remain authenticated.
                    </p>

                    {/* Modal Actions */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle mt-5">
                      <button
                        type="button"
                        onClick={() => setIsPasswordModalOpen(false)}
                        disabled={isUpdatingPassword}
                        className="px-4 py-2 border border-border-strong rounded-sm text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-app-bg transition-colors cursor-pointer -skew-x-3 sm:-skew-x-6"
                      >
                        <span className="skew-x-3 sm:skew-x-6 block">Cancel</span>
                      </button>

                      <button
                        type="submit"
                        disabled={isUpdatingPassword}
                        className="px-5 py-2 bg-brand-primary hover:bg-brand-secondary text-white hover:text-black font-heading font-semibold uppercase tracking-wider text-xs rounded-sm transition-all -skew-x-3 sm:-skew-x-6 shadow-md hover:shadow-lg active:scale-95 cursor-pointer flex items-center gap-2"
                      >
                        {isUpdatingPassword ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin skew-x-3 sm:skew-x-6" />
                            <span className="skew-x-3 sm:skew-x-6">Updating...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5 skew-x-3 sm:skew-x-6" />
                            <span className="skew-x-3 sm:skew-x-6">Update Password</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden File Input for Avatar Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarFileChange}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
      />

      {/* 1. Header (Standardized Hero with Natural Typography matching other screens) */}
      <motion.div 
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="shrink-0 mb-4 sm:mb-6 flex items-center justify-between gap-3"
      >
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-5xl font-heading font-black tracking-tight text-text-primary mb-0 md:mb-3 border-l-4 border-brand-primary pl-3 md:pl-4 truncate">
            Account Profile
          </h1>
          <p className="hidden md:block text-text-muted text-sm md:text-lg pl-4 md:pl-5 mt-1 font-sans">
            Manage your verified citizen credentials, civic credits, and notification settings.
          </p>
        </div>

        {/* Quick Link to My Reports */}
        <Link
          to="/citizen/dashboard"
          className="bg-brand-primary hover:bg-brand-secondary text-white hover:text-black transition-colors px-3 sm:px-4 py-2 sm:py-2.5 rounded-sm -skew-x-3 sm:-skew-x-6 flex items-center gap-1.5 sm:gap-2 text-xs font-heading font-semibold uppercase tracking-wide shadow-md shrink-0 active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 skew-x-3 sm:skew-x-6 shrink-0" />
          <span className="skew-x-3 sm:skew-x-6 hidden xs:inline">My Submissions</span>
          <span className="skew-x-3 sm:skew-x-6 xs:hidden">Reports</span>
        </Link>
      </motion.div>

      {/* Guest Notice Banner if Not Signed In */}
      {profile.isGuest && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 w-full"
        >
          <div className="w-full bg-surface/35 hover:bg-surface/85 backdrop-blur-xl border-2 border-brand-primary/40 hover:border-brand-primary rounded-sm p-4 sm:p-5 -skew-x-2 sm:-skew-x-3 relative overflow-hidden shadow-sm hover:shadow-xl hover:shadow-brand-primary/10 group transition-all duration-300">
            <BorderBeam delay={0.2} color="#60A5FA" />
            <div className="absolute top-0 left-0 w-2 h-full bg-brand-secondary" />
            <div className="skew-x-2 sm:skew-x-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-primary/20 text-brand-primary rounded-sm shrink-0 -skew-x-6 shadow-xs">
                  <Sparkles className="w-5 h-5 text-brand-secondary skew-x-6" />
                </div>
                <div>
                  <h2 className="text-sm font-heading font-bold text-text-primary">
                    Guest Session Active
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5 font-sans leading-relaxed">
                    You are browsing as a guest. Create a free account or sign in to save your personal details and sync civic rewards.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto font-sans">
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white hover:text-black font-semibold text-xs rounded-sm transition-all text-center shadow-xs -skew-x-3 sm:-skew-x-6 cursor-pointer active:scale-95"
                >
                  <span className="skew-x-3 sm:skew-x-6 block">Sign In</span>
                </Link>
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-4 py-2 bg-surface hover:bg-surface/80 border border-border-strong text-text-primary font-semibold text-xs rounded-sm transition-all text-center -skew-x-3 sm:-skew-x-6 cursor-pointer active:scale-95"
                >
                  <span className="skew-x-3 sm:skew-x-6 block">Register</span>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 2. Main Profile Grid - Stretched to Equal Height */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        
        {/* Left Column (Identity & Civic Credentials) */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-full">
          
          {/* Identity Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="w-full shrink-0"
          >
            <div className="w-full bg-surface/35 hover:bg-surface/85 backdrop-blur-xl border-2 border-border-subtle hover:border-brand-primary rounded-sm p-6 shadow-sm hover:shadow-2xl hover:shadow-brand-primary/10 transition-all duration-500 relative overflow-hidden group -skew-x-2 sm:-skew-x-3">
              <BorderBeam delay={0} color="#60A5FA" />
              <div className="absolute top-0 left-0 w-2 h-full bg-brand-primary" />
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-brand-primary/20 via-brand-secondary/10 to-transparent pointer-events-none" />
              
              {/* Unskew wrapper for upright content */}
              <div className="skew-x-2 sm:skew-x-3 flex flex-col items-center w-full z-10 relative">
                {/* Profile Picture */}
                <div className="relative mt-2 mb-3 group/avatar">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-surface shadow-2xl overflow-hidden relative z-10 bg-app-bg ring-2 ring-brand-primary/30">
                    {isLoading ? (
                      <div className="w-full h-full flex items-center justify-center bg-surface">
                        <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
                      </div>
                    ) : (
                      <img 
                        src={profile.avatarUrl} 
                        alt={profile.fullName}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300';
                        }}
                      />
                    )}

                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Change Avatar Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute bottom-0 right-0 z-20 p-2 bg-brand-primary hover:bg-brand-secondary text-white hover:text-black rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer border-2 border-surface"
                    title="Upload profile photo from device"
                    aria-label="Upload profile photo from device"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Citizen Name & Verification Badge */}
                <h2 className="text-lg sm:text-xl font-heading font-bold text-text-primary flex items-center gap-2 justify-center text-center">
                  <span>{profile.fullName || 'Citizen Reporter'}</span>
                  {!profile.isGuest && (
                    <span title="Verified Reporter" className="inline-flex items-center">
                      <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0" />
                    </span>
                  )}
                </h2>

                <p className="text-text-muted text-xs mt-0.5 font-sans text-center">
                  {profile.email ? profile.email : profile.isGuest ? 'Anonymous Session' : '+63 ' + (profile.phone || '9XX XXX XXXX')}
                </p>

                {/* Avatar Presets Swiper & Device Upload Scroller */}
                <div className="w-full mt-4 pt-3 border-t border-border-subtle/70">
                  <div className="flex items-center justify-between mb-2 px-0.5">
                    <span className="text-[11px] font-heading font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-brand-primary" />
                      Select Avatar Preset
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => scrollAvatars('left')}
                        className="p-1 rounded-sm bg-app-bg hover:bg-brand-primary/20 text-text-muted hover:text-text-primary transition-colors cursor-pointer border border-border-subtle active:scale-95"
                        title="Scroll left"
                        aria-label="Scroll left"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollAvatars('right')}
                        className="p-1 rounded-sm bg-app-bg hover:bg-brand-primary/20 text-text-muted hover:text-text-primary transition-colors cursor-pointer border border-border-subtle active:scale-95"
                        title="Scroll right"
                        aria-label="Scroll right"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Horizontal Scroll / Swipe Container */}
                  <div 
                    ref={avatarSliderRef}
                    className="w-full flex items-center gap-2.5 overflow-x-auto py-2 px-1 scrollbar-none snap-x snap-mandatory select-none"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {/* Slot 0: Custom Device Upload */}
                    <button
                      type="button"
                      onClick={() => handleSelectAvatar(0)}
                      className={twMerge(
                        "snap-center shrink-0 w-12 h-12 rounded-full flex flex-col items-center justify-center transition-all duration-200 cursor-pointer relative overflow-hidden group/custom",
                        selectedAvatarIndex === 0
                          ? "border-2 border-brand-primary shadow-lg shadow-brand-primary/30 ring-2 ring-brand-primary/20 scale-105"
                          : "border-2 border-dashed border-border-strong hover:border-brand-primary/70 bg-app-bg/60 opacity-80 hover:opacity-100"
                      )}
                      title={customProfileImage ? "Custom Device Photo (Click to re-select or change)" : "Upload from Device"}
                    >
                      {customProfileImage ? (
                        <img 
                          src={customProfileImage} 
                          alt="Custom device avatar" 
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-text-muted group-hover/custom:text-brand-primary">
                          <Camera className="w-4 h-4" />
                        </div>
                      )}
                      <span className="absolute bottom-0 inset-x-0 bg-black/65 text-[7.5px] font-mono font-bold text-white text-center py-0.5 uppercase tracking-tighter">
                        {customProfileImage ? 'Device' : 'Upload'}
                      </span>
                    </button>

                    {/* Slots 1..10: Built-in Adventurer Avatars */}
                    {AVATAR_OPTIONS.slice(1).map((avatarUrl, idx) => {
                      const realIndex = idx + 1;
                      const isSelected = selectedAvatarIndex === realIndex;
                      return (
                        <button
                          key={avatarUrl}
                          type="button"
                          onClick={() => handleSelectAvatar(realIndex)}
                          className={twMerge(
                            "snap-center shrink-0 w-12 h-12 rounded-full transition-all duration-200 cursor-pointer relative overflow-hidden bg-app-bg",
                            isSelected 
                              ? "border-2 border-brand-primary shadow-lg shadow-brand-primary/30 ring-2 ring-brand-primary/20 scale-105" 
                              : "border-2 border-border-subtle hover:border-brand-primary/50 opacity-70 hover:opacity-100 hover:scale-102"
                          )}
                          title={`Avatar Preset ${realIndex}`}
                        >
                          <img 
                            src={avatarUrl} 
                            alt={`Avatar ${realIndex}`}
                            className="w-full h-full object-cover rounded-full pointer-events-none"
                            loading="lazy"
                          />
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-[10px] text-text-muted text-center font-sans mt-1">
                    Swipe or click to choose a preset, or upload your own.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Unique Civic Stewardship Smart Credential Card (Fills remaining height) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="w-full flex-1 flex flex-col min-h-0"
          >
            <div className="w-full h-full flex-1 flex flex-col justify-between bg-gradient-to-br from-surface/90 via-app-bg/95 to-brand-primary/15 hover:from-surface hover:via-surface/80 hover:to-brand-primary/25 backdrop-blur-2xl border-2 border-brand-primary/50 hover:border-brand-primary rounded-sm p-5 sm:p-6 shadow-md hover:shadow-2xl hover:shadow-brand-primary/25 transition-all duration-500 relative overflow-hidden group -skew-x-2 sm:-skew-x-3">
              <BorderBeam delay={1.4} color="#38BDF8" />
              
              {/* Metallic Accent Strip & Top Gradient */}
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-brand-secondary via-brand-primary to-emerald-400" />
              <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-brand-primary/20 via-brand-secondary/10 to-transparent pointer-events-none rounded-bl-full" />
              
              <div className="skew-x-2 sm:skew-x-3 flex flex-col justify-between h-full relative z-10 gap-5">
                
                {/* 1. Smart Microchip & Civic ID Header */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-3">
                    {/* Realistic Metallic Gold Contact Pad / Smart Microchip */}
                    <div className="w-11 h-8 rounded-sm bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-300/80 shadow-md relative overflow-hidden p-0.5 shrink-0 flex items-center justify-center">
                      <div className="w-full h-full border border-amber-800/40 rounded-xs grid grid-cols-2 grid-rows-2 gap-0.5 opacity-85 bg-amber-400/20">
                        <div className="border-r border-b border-amber-800/50" />
                        <div className="border-b border-amber-800/50" />
                        <div className="border-r border-amber-800/50" />
                        <div />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent pointer-events-none" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted block">
                        STEWARD REGISTRY ID
                      </span>
                      <p className="text-base sm:text-lg font-mono font-bold text-text-primary tracking-widest">
                        {profile.isGuest 
                          ? 'EST-GUEST-SYS' 
                          : `EST-${profile.id.replace(/-/g, '').slice(0, 7).toUpperCase()}`}
                      </p>
                    </div>
                  </div>

                  <div className="p-1.5 bg-brand-primary/10 border border-brand-primary/20 rounded-sm -skew-x-6 text-brand-primary shadow-xs">
                    <Cpu className="w-4 h-4 skew-x-6" />
                  </div>
                </div>

                {/* 2. Stewardship Credits Box (Embossed Centerpiece) */}
                <div className="bg-app-bg/80 p-4 border border-brand-primary/30 rounded-sm flex items-center justify-between shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-brand-primary/10 to-transparent pointer-events-none" />
                  <div className="flex flex-col relative z-10">
                    <span className="text-xs font-semibold uppercase tracking-wider text-text-muted font-sans flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-brand-primary" />
                      Stewardship Credits
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl sm:text-4xl font-mono font-bold text-brand-primary tracking-tight">
                        {profile.stewardshipScore}
                      </span>
                      <span className="text-xs font-bold text-text-muted uppercase tracking-wider">PTS</span>
                    </div>
                  </div>

                  <div className="text-right relative z-10">
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-sm font-sans inline-flex items-center gap-1.5 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Level 1 Contributor
                    </span>
                  </div>
                </div>

                {/* 3. Community Impact Telemetry */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-app-bg/60 p-3 rounded-sm border border-border-subtle shadow-xs">
                    <span className="text-xs font-medium text-text-muted block font-sans">Total Reports</span>
                    <span className="text-2xl font-mono font-bold text-text-primary mt-1 block">
                      {profile.totalReportsCount}
                    </span>
                  </div>

                  <div className="bg-app-bg/60 p-3 rounded-sm border border-border-subtle shadow-xs">
                    <span className="text-xs font-medium text-text-muted block font-sans">Cleared Waterways</span>
                    <span className="text-2xl font-mono font-bold text-emerald-400 mt-1 block">
                      {profile.resolvedReportsCount}
                    </span>
                  </div>
                </div>

                {/* 4. Digital Security Strip Footer */}
                <div className="pt-3 border-t border-border-subtle/70 mt-auto">
                  {/* Micro Barcode Strip */}
                  <div className="w-full flex items-center justify-between h-3.5 opacity-60 overflow-hidden px-0.5">
                    {[4, 2, 6, 2, 8, 3, 5, 2, 7, 4, 3, 8, 2, 5, 3, 7, 2, 6, 4, 8, 2, 5, 3, 6, 2, 7, 4, 2, 5, 8, 3, 6, 2, 4, 7, 3, 5, 2, 6, 4, 8, 2].map((height, i) => (
                      <span 
                        key={i} 
                        className="bg-text-muted inline-block w-0.5" 
                        style={{ height: `${height * 1.5}px` }} 
                      />
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </motion.div>

        </div>

        {/* Right Column (Personal Information Form & Preferences) */}
        <div className="lg:col-span-8 flex flex-col gap-6 h-full justify-between">
          
          {/* Personal Information Form */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="w-full shrink-0"
          >
            <div className="w-full bg-surface/35 hover:bg-surface/85 backdrop-blur-xl border-2 border-border-subtle hover:border-brand-primary transition-all duration-500 rounded-sm p-6 sm:p-8 shadow-sm hover:shadow-2xl hover:shadow-brand-primary/10 relative overflow-hidden group -skew-x-2 sm:-skew-x-3">
              <BorderBeam delay={0.7} color="#60A5FA" />
              <div className="absolute top-0 left-0 w-2 h-full bg-brand-primary" />

              <div className="skew-x-2 sm:skew-x-3 relative z-10">
                <div className="flex items-center justify-between gap-3 mb-6 pb-3 border-b border-border-subtle">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 sm:p-2 bg-brand-primary/10 rounded-sm text-brand-primary -skew-x-6 shadow-xs">
                      <User className="w-4 h-4 skew-x-6" />
                    </div>
                    <h2 className="text-sm font-heading font-bold uppercase tracking-wider text-text-primary">
                      Personal Information
                    </h2>
                  </div>
                </div>
                
                <form onSubmit={handleSaveChanges}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-sans">
                    {/* Full Name */}
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label htmlFor="profile-full-name" className="text-xs sm:text-sm font-medium text-text-secondary">
                        Full Name
                      </label>
                      <input 
                        id="profile-full-name"
                        type="text" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full bg-app-bg border border-border-strong rounded-sm px-3.5 py-2.5 text-text-primary text-sm font-sans focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors" 
                      />
                    </div>

                    {/* Email Address (Read-only / Auth-managed) */}
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label htmlFor="profile-email" className="text-xs sm:text-sm font-medium text-text-secondary">
                        Registered Email
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted z-10">
                          <Mail className="w-4 h-4" />
                        </span>
                        <input 
                          id="profile-email"
                          type="email" 
                          value={profile.email || (profile.isGuest ? 'guest@esteroute.local' : 'citizen@esteroute.local')}
                          readOnly
                          disabled
                          className="w-full bg-app-bg/40 border border-border-subtle rounded-sm pl-10 pr-4 py-2.5 text-text-muted text-sm font-sans cursor-not-allowed select-none" 
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label htmlFor="profile-phone" className="text-xs sm:text-sm font-medium text-text-secondary">
                        Mobile Phone Number
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted font-mono font-medium text-sm z-10">
                          +63
                        </span>
                        <input 
                          id="profile-phone"
                          type="tel" 
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="9XX XXX XXXX"
                          maxLength={15}
                          className="w-full bg-app-bg border border-border-strong rounded-sm pl-13 pr-4 py-2.5 text-text-primary text-sm font-mono focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors" 
                        />
                      </div>
                      <span className="text-xs text-text-muted mt-0.5 font-sans leading-normal">
                        Used for localized emergency waterway flood dispatch advisories.
                      </span>
                    </div>
                  </div>
                  
                  {/* Form Action Button */}
                  <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-border-subtle">
                    <button 
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-2.5 bg-brand-primary hover:bg-brand-secondary text-white hover:text-black font-heading font-semibold uppercase tracking-wider text-xs sm:text-sm rounded-sm transition-all -skew-x-3 sm:-skew-x-6 shadow-md hover:shadow-lg active:scale-95 cursor-pointer flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin skew-x-3 sm:skew-x-6" />
                          <span className="skew-x-3 sm:skew-x-6">Saving...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 skew-x-3 sm:skew-x-6" />
                          <span className="skew-x-3 sm:skew-x-6">Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>

          {/* Settings & Security Grid (Stretched to match Civic Card height at bottom) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch shrink-0">
            
            {/* Notification Preferences */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2 }}
              className="w-full h-full flex flex-col"
            >
              <div className="w-full h-full flex-1 flex flex-col justify-between bg-surface/35 hover:bg-surface/85 backdrop-blur-xl border-2 border-border-subtle hover:border-brand-primary transition-all duration-500 rounded-sm p-6 shadow-sm hover:shadow-2xl hover:shadow-brand-primary/10 relative overflow-hidden group -skew-x-2 sm:-skew-x-3">
                <BorderBeam delay={2.1} color="#60A5FA" />
                <div className="absolute top-0 left-0 w-2 h-full bg-brand-secondary" />

                <div className="skew-x-2 sm:skew-x-3 flex flex-col justify-between h-full relative z-10">
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-border-subtle">
                      <h2 className="text-sm font-heading font-bold uppercase tracking-wider text-text-primary flex items-center gap-2.5">
                        <div className="p-1.5 bg-brand-secondary/10 rounded-sm text-brand-secondary -skew-x-6 shadow-xs">
                          <Bell className="w-4 h-4 skew-x-6" />
                        </div>
                        <span>Notifications</span>
                      </h2>
                    </div>

                    <div className="flex flex-col gap-3 font-sans">
                      <label className="flex items-center justify-between p-3 border border-border-subtle rounded-sm hover:border-brand-primary/50 cursor-pointer transition-colors bg-app-bg/60 shadow-xs">
                        <div className="flex flex-col pr-2">
                          <span className="text-xs sm:text-sm font-medium text-text-primary">SMS Status Alerts</span>
                          <span className="text-xs text-text-muted mt-0.5">Receive clearance updates on your reports</span>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={smsUpdates}
                          onChange={(e) => handleToggleSms(e.target.checked)}
                          className="accent-brand-primary w-4 h-4 cursor-pointer" 
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 border border-border-subtle rounded-sm hover:border-brand-primary/50 cursor-pointer transition-colors bg-app-bg/60 shadow-xs">
                        <div className="flex flex-col pr-2">
                          <span className="text-xs sm:text-sm font-medium text-text-primary">Basin Flood Alerts</span>
                          <span className="text-xs text-text-muted mt-0.5">High water level waterway warnings</span>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={pushNotifications}
                          onChange={(e) => handleTogglePush(e.target.checked)}
                          className="accent-brand-primary w-4 h-4 cursor-pointer" 
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Account & Security Actions */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.25 }}
              className="w-full h-full flex flex-col"
            >
              <div className="w-full h-full flex-1 flex flex-col justify-between bg-surface/35 hover:bg-surface/85 backdrop-blur-xl border-2 border-border-subtle hover:border-brand-primary transition-all duration-500 rounded-sm p-6 shadow-sm hover:shadow-2xl hover:shadow-brand-primary/10 relative overflow-hidden group -skew-x-2 sm:-skew-x-3">
                <BorderBeam delay={2.8} color="#60A5FA" />
                <div className="absolute top-0 left-0 w-2 h-full bg-brand-primary" />

                <div className="skew-x-2 sm:skew-x-3 flex flex-col justify-between h-full relative z-10">
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-border-subtle">
                      <h2 className="text-sm font-heading font-bold uppercase tracking-wider text-text-primary flex items-center gap-2.5">
                        <div className="p-1.5 bg-brand-primary/10 rounded-sm text-brand-primary -skew-x-6 shadow-xs">
                          <Lock className="w-4 h-4 skew-x-6" />
                        </div>
                        <span>Security & Session</span>
                      </h2>
                    </div>

                    <div className="flex flex-col gap-3 font-sans">
                      <button 
                        type="button"
                        onClick={() => {
                          if (profile.isGuest) {
                            showToast('Guest accounts do not have a password. Please register an account.', 'error');
                            return;
                          }
                          setPasswordError('');
                          setNewPassword('');
                          setConfirmPassword('');
                          setShowNewPassword(false);
                          setShowConfirmPassword(false);
                          setIsPasswordModalOpen(true);
                        }}
                        className="flex items-center justify-between p-3 border border-border-subtle rounded-sm hover:border-brand-primary transition-colors bg-app-bg/60 text-left group/sec cursor-pointer shadow-xs w-full"
                      >
                        <div className="flex items-center gap-2.5">
                          <KeyRound className="w-4 h-4 text-brand-primary/80 group-hover/sec:text-brand-primary transition-colors" />
                          <span className="text-xs sm:text-sm font-medium text-text-primary group-hover/sec:text-brand-primary transition-colors">
                            Change Password
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-text-muted group-hover/sec:text-brand-primary transition-colors" />
                      </button>

                      <button 
                        type="button"
                        onClick={handleSignOut}
                        className="flex items-center justify-between p-3 border border-border-subtle rounded-sm hover:border-semantic-urgent transition-colors bg-app-bg/60 text-left group/sec cursor-pointer w-full shadow-xs"
                      >
                        <span className="text-xs sm:text-sm font-medium text-semantic-urgent">
                          {profile.isGuest ? 'Leave Guest Session' : 'Sign Out of esteRoute'}
                        </span>
                        <LogOut className="w-4 h-4 text-semantic-urgent/70 group-hover/sec:text-semantic-urgent transition-colors" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>

        </div>

      </div>
    </div>
  );
}
