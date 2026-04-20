import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Key, Shield, X, Mail, Link2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export const UserSettingsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  

  const parsePhoneNumber = (fullPhone: string | null) => {
    if (!fullPhone) return { code: '+1', number: '' };
    
    // Ordered by length (longest first) to avoid parsing issues
    const codes = ['+971', '+966', '+880', '+234', '+254', '+91', '+86', '+81', '+82', '+61', '+49', '+44', '+33', '+34', '+39', '+31', '+46', '+41', '+48', '+90', '+20', '+27', '+52', '+55', '+54', '+57', '+64', '+66', '+84', '+63', '+62', '+60', '+65', '+92', '+7', '+1'];
    
    for (const code of codes) {
      if (fullPhone.startsWith(code)) {
        return {
          code,
          number: fullPhone.slice(code.length)
        };
      }
    }
    
    return { code: '+1', number: fullPhone };
  };

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast({ title: 'Profile updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update profile', description: error.message, variant: 'destructive' });
    },
  });

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await updateProfile.mutateAsync({ avatar_url: publicUrl });
    } catch (error: any) {
      toast({ 
        title: 'Failed to upload avatar', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;

    try {
      await updateProfile.mutateAsync({ avatar_url: null });
      toast({
        title: 'Avatar removed',
        description: 'Your avatar has been removed successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to remove avatar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSaveChanges = async () => {
    if (!hasChanges) return;

    const updates: any = {};
    
    if (firstName !== (profile?.first_name || '')) {
      updates.first_name = firstName;
    }
    if (lastName !== (profile?.last_name || '')) {
      updates.last_name = lastName;
    }
    
    const currentPhone = profile?.phone ? parsePhoneNumber(profile.phone) : { code: '+1', number: '' };
    if (phoneNumber !== currentPhone.number || countryCode !== currentPhone.code) {
      updates.phone = phoneNumber ? `${countryCode}${phoneNumber}` : null;
    }

    if (Object.keys(updates).length > 0) {
      try {
        await updateProfile.mutateAsync(updates);
        setHasChanges(false);
      } catch (error) {
        console.error('Error saving changes:', error);
      }
    }
  };

  useEffect(() => {
    if (profile) {
      if (profile.phone) {
        const { code, number } = parsePhoneNumber(profile.phone);
        setCountryCode(code);
        setPhoneNumber(number);
      }
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setHasChanges(false);
    }
  }, [profile]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback>
                {profile?.first_name?.[0]}{profile?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col md:flex-row gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Change Avatar
              </Button>
              {profile?.avatar_url && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  disabled={updateProfile.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  setHasChanges(true);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  setHasChanges(true);
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <div className="flex gap-2">
              <Input value={user?.email || ''} disabled className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/change-email')}
              >
                <Mail className="h-4 w-4 mr-2" />
                Change
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Phone</Label>
            <div className="flex gap-2">
              <Select value={countryCode} onValueChange={(value) => {
                setCountryCode(value);
                setHasChanges(true);
              }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* North America */}
                  <SelectItem value="+1">🇺🇸 United States +1</SelectItem>
                  <SelectItem value="+1">🇨🇦 Canada +1</SelectItem>
                  <SelectItem value="+52">🇲🇽 Mexico +52</SelectItem>
                  
                  {/* Europe */}
                  <SelectItem value="+44">🇬🇧 United Kingdom +44</SelectItem>
                  <SelectItem value="+33">🇫🇷 France +33</SelectItem>
                  <SelectItem value="+49">🇩🇪 Germany +49</SelectItem>
                  <SelectItem value="+34">🇪🇸 Spain +34</SelectItem>
                  <SelectItem value="+39">🇮🇹 Italy +39</SelectItem>
                  <SelectItem value="+31">🇳🇱 Netherlands +31</SelectItem>
                  <SelectItem value="+46">🇸🇪 Sweden +46</SelectItem>
                  <SelectItem value="+41">🇨🇭 Switzerland +41</SelectItem>
                  <SelectItem value="+48">🇵🇱 Poland +48</SelectItem>
                  <SelectItem value="+90">🇹🇷 Turkey +90</SelectItem>
                  <SelectItem value="+7">🇷🇺 Russia +7</SelectItem>
                  
                  {/* Middle East & Africa */}
                  <SelectItem value="+20">🇪🇬 Egypt +20</SelectItem>
                  <SelectItem value="+27">🇿🇦 South Africa +27</SelectItem>
                  <SelectItem value="+966">🇸🇦 Saudi Arabia +966</SelectItem>
                  <SelectItem value="+971">🇦🇪 UAE +971</SelectItem>
                  <SelectItem value="+972">🇮🇱 Israel +972</SelectItem>
                  <SelectItem value="+234">🇳🇬 Nigeria +234</SelectItem>
                  <SelectItem value="+254">🇰🇪 Kenya +254</SelectItem>
                  
                  {/* Asia */}
                  <SelectItem value="+91">🇮🇳 India +91</SelectItem>
                  <SelectItem value="+86">🇨🇳 China +86</SelectItem>
                  <SelectItem value="+81">🇯🇵 Japan +81</SelectItem>
                  <SelectItem value="+82">🇰🇷 South Korea +82</SelectItem>
                  <SelectItem value="+66">🇹🇭 Thailand +66</SelectItem>
                  <SelectItem value="+84">🇻🇳 Vietnam +84</SelectItem>
                  <SelectItem value="+63">🇵🇭 Philippines +63</SelectItem>
                  <SelectItem value="+62">🇮🇩 Indonesia +62</SelectItem>
                  <SelectItem value="+60">🇲🇾 Malaysia +60</SelectItem>
                  <SelectItem value="+65">🇸🇬 Singapore +65</SelectItem>
                  <SelectItem value="+92">🇵🇰 Pakistan +92</SelectItem>
                  <SelectItem value="+880">🇧🇩 Bangladesh +880</SelectItem>
                  
                  {/* Oceania */}
                  <SelectItem value="+61">🇦🇺 Australia +61</SelectItem>
                  <SelectItem value="+64">🇳🇿 New Zealand +64</SelectItem>
                  
                  {/* South America */}
                  <SelectItem value="+55">🇧🇷 Brazil +55</SelectItem>
                  <SelectItem value="+54">🇦🇷 Argentina +54</SelectItem>
                  <SelectItem value="+57">🇨🇴 Colombia +57</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="tel"
                placeholder="6047153692"
                value={phoneNumber}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/\D/g, '');
                  setPhoneNumber(numericValue);
                  setHasChanges(true);
                }}
                className="flex-1"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button 
              onClick={handleSaveChanges}
              disabled={!hasChanges || updateProfile.isPending}
            >
              {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password & Security</CardTitle>
          <CardDescription>Manage your account security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Password</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Keep your account secure with a strong password
            </p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/change-password')}
            >
              <Key className="mr-2 h-4 w-4" />
              Change Password
            </Button>
          </div>
          
          <Separator />
          
          <div>
            <Label>Two-Factor Authentication</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Add an extra layer of security (Coming Soon)
            </p>
            <Button variant="outline" disabled>
              <Shield className="mr-2 h-4 w-4" />
              Enable 2FA
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
