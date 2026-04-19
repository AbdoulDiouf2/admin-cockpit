import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthContext';
import { useTheme } from '@/components/shared/ThemeProvider';
import { useToast } from '@/hooks/use-toast';
import { authApi, systemConfigApi, aiApi, type NlqProvider } from '@/api';
import { useAdminUsers } from '@/hooks/use-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { User, Lock, Palette, Sun, Moon, Loader2, Bell, Keyboard, Bot, CheckCircle2, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
  newPassword: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas.',
  path: ['confirmPassword'],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;
type SectionKey = 'profile' | 'security' | 'appearance' | 'notifications' | 'shortcuts' | 'ai';

// ─── Notification prefs ───────────────────────────────────────────────────────

const DEFAULT_NOTIF = {
  newOrg: true,
  agentOffline: true,
  agentTokenExpiry: true,
  paymentFailed: true,
  paymentSuccess: false,
  errorLogs: true,
  bugReports: true,
};

type NotifPrefs = typeof DEFAULT_NOTIF;

// ─── AI config (dans featureFlags) ───────────────────────────────────────────

const DEFAULT_FLAGS = {
  nlqProvider: 'claude' as NlqProvider,
  localLlmUrl: 'http://localhost:11434',
  localLlmModel: '',
  claudeInsights: true,
};

// ─── Nav groups ───────────────────────────────────────────────────────────────

const NAV_GROUPS = [
  {
    groupKey: 'settings.groupAccount',
    items: [
      { key: 'profile'    as SectionKey, icon: User,    labelKey: 'settings.sectionProfile' },
      { key: 'security'   as SectionKey, icon: Lock,    labelKey: 'settings.sectionSecurity' },
      { key: 'appearance' as SectionKey, icon: Palette, labelKey: 'settings.sectionAppearance' },
    ],
  },
  {
    groupKey: 'settings.groupGeneral',
    items: [
      { key: 'notifications' as SectionKey, icon: Bell,     labelKey: 'settings.sectionNotifications' },
      { key: 'ai'            as SectionKey, icon: Bot,      labelKey: 'settings.sectionAi' },
      { key: 'shortcuts'     as SectionKey, icon: Keyboard, labelKey: 'settings.sectionShortcuts' },
    ],
  },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<SectionKey>('profile');
  const { data: allUsers = [] } = useAdminUsers();
  const adminUsers = allUsers.filter((u) =>
    u.userRoles?.some((ur: any) => ur.role?.name === 'superadmin')
  );

  // ── Notification preferences (persisted in DB) ──────────────────────────────

  const { data: sysConfig } = useQuery({
    queryKey: ['system-config'],
    queryFn: async () => {
      const res = await systemConfigApi.get();
      return res.data;
    },
  });

  const rawNotifPrefs = sysConfig?.notificationPreferences as { notif?: Partial<NotifPrefs>; recipients?: string[] } | null | undefined;
  const notifPrefs: NotifPrefs = { ...DEFAULT_NOTIF, ...(rawNotifPrefs?.notif ?? {}) };
  const recipients: string[] = rawNotifPrefs?.recipients ?? [];

  const { mutate: savePrefs } = useMutation({
    mutationFn: (data: { notif: NotifPrefs; recipients: string[] }) =>
      systemConfigApi.update({ notificationPreferences: data as unknown as Record<string, unknown> }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] });
    },
    onError: () => {
      toast({ title: t('common.error'), description: t('settings.profileError'), variant: 'destructive' });
    },
  });

  const toggleNotif = useCallback((key: keyof NotifPrefs) => {
    const next = { ...notifPrefs, [key]: !notifPrefs[key] };
    savePrefs({ notif: next, recipients });
  }, [notifPrefs, recipients, savePrefs]);

  const toggleRecipient = useCallback((userId: string) => {
    const next = recipients.includes(userId)
      ? recipients.filter(id => id !== userId)
      : [...recipients, userId];
    savePrefs({ notif: notifPrefs, recipients: next });
  }, [notifPrefs, recipients, savePrefs]);

  // ── AI config ──────────────────────────────────────────────────────────────

  const aiFlags = { ...DEFAULT_FLAGS, ...(sysConfig?.featureFlags ?? {}) };
  const [localUrl, setLocalUrl] = useState(aiFlags.localLlmUrl);
  const [localModel, setLocalModel] = useState(aiFlags.localLlmModel);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isBrowsing, setIsBrowsing] = useState(false);
  const urlRef = useRef(localUrl);
  urlRef.current = localUrl;

  // Sync state quand sysConfig charge
  useEffect(() => {
    if (sysConfig?.featureFlags) {
      setLocalUrl((sysConfig.featureFlags as any).localLlmUrl ?? 'http://localhost:11434');
      setLocalModel((sysConfig.featureFlags as any).localLlmModel ?? '');
    }
  }, [sysConfig]);

  const { mutate: saveFlags } = useMutation({
    mutationFn: (flags: typeof DEFAULT_FLAGS) =>
      systemConfigApi.update({ featureFlags: flags }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] });
      toast({ title: t('common.success'), description: t('settings.aiSaved') });
    },
    onError: () => {
      toast({ title: t('common.error'), description: t('settings.aiError'), variant: 'destructive' });
    },
  });

  const setProvider = useCallback((provider: NlqProvider) => {
    saveFlags({ ...aiFlags, nlqProvider: provider, localLlmUrl: localUrl, localLlmModel: localModel });
  }, [aiFlags, localUrl, localModel, saveFlags]);

  const saveLocalConfig = useCallback(() => {
    saveFlags({ ...aiFlags, localLlmUrl: localUrl, localLlmModel: localModel });
  }, [aiFlags, localUrl, localModel, saveFlags]);

  const browseModels = useCallback(async () => {
    if (!urlRef.current) {
      toast({ title: t('common.error'), description: t('settings.aiLocalUrlRequired'), variant: 'destructive' });
      return;
    }
    setIsBrowsing(true);
    try {
      const res = await aiApi.getLocalModels(urlRef.current);
      setAvailableModels(res.data.models);
    } catch {
      toast({ title: t('common.error'), description: t('settings.aiLocalFetchError'), variant: 'destructive' });
    } finally {
      setIsBrowsing(false);
    }
  }, [t, toast]);

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: '', lastName: '' },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({ firstName: user.firstName, lastName: user.lastName });
    }
  }, [user, profileForm]);

  const onSaveProfile = async (values: ProfileFormValues) => {
    try {
      await updateProfile(values);
      toast({ title: t('common.success'), description: t('settings.profileSaved') });
    } catch {
      toast({ title: t('common.error'), description: t('settings.profileError'), variant: 'destructive' });
    }
  };

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onChangePassword = async (values: PasswordFormValues) => {
    try {
      await authApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      passwordForm.reset();
      toast({ title: t('common.success'), description: t('settings.passwordChanged') });
    } catch {
      toast({ title: t('common.error'), description: t('settings.passwordError'), variant: 'destructive' });
    }
  };

  // Language toggle
  const currentLang = i18n.language;
  const toggleLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>
        <p className="text-muted-foreground">{t('settings.subtitle')}</p>
      </div>

      <Separator />

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">

        {/* ── Left nav ── */}
        <nav className="flex flex-row gap-1 lg:flex-col lg:w-52 shrink-0">
          {NAV_GROUPS.map(({ groupKey, items }) => (
            <div key={groupKey} className="lg:mb-4">
              <p className="hidden lg:block px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {t(groupKey)}
              </p>
              {items.map(({ key, icon: Icon, labelKey }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveSection(key)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left w-full',
                    activeSection === key
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {t(labelKey)}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* ── Right content ── */}
        <div className="flex-1 min-w-0">

          {/* ── Profil ── */}
          {activeSection === 'profile' && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                      {getInitials(user?.firstName, user?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{user?.firstName} {user?.lastName}</CardTitle>
                    <CardDescription>{user?.email}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('settings.firstName')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('settings.firstName')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('settings.lastName')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('settings.lastName')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">{t('settings.email')}</Label>
                      <Input value={user?.email ?? ''} disabled className="bg-muted" />
                      <p className="text-xs text-muted-foreground">{t('settings.emailReadOnly')}</p>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        disabled={profileForm.formState.isSubmitting || !profileForm.formState.isDirty}
                      >
                        {profileForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('settings.saveProfile')}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* ── Sécurité ── */}
          {activeSection === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  {t('settings.sectionSecurity')}
                </CardTitle>
                <CardDescription>{t('settings.sectionSecurityDesc')}</CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('settings.currentPassword')}</FormLabel>
                          <FormControl>
                            <Input type="password" autoComplete="current-password" className="max-w-sm" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Separator className="my-2" />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('settings.newPassword')}</FormLabel>
                            <FormControl>
                              <Input type="password" autoComplete="new-password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('settings.confirmPassword')}</FormLabel>
                            <FormControl>
                              <Input type="password" autoComplete="new-password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                        {passwordForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('settings.changePassword')}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* ── Notifications ── */}
          {activeSection === 'notifications' && (
            <div className="space-y-4">
              {/* Toggles alertes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    {t('settings.sectionNotifications')}
                  </CardTitle>
                  <CardDescription>{t('settings.sectionNotificationsDesc')}</CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="pt-2 divide-y divide-border">
                  {([
                    { key: 'newOrg',         labelKey: 'settings.notifNewOrg',         descKey: 'settings.notifNewOrgDesc' },
                    { key: 'agentOffline',     labelKey: 'settings.notifAgentOffline',     descKey: 'settings.notifAgentOfflineDesc' },
                    { key: 'agentTokenExpiry', labelKey: 'settings.notifAgentTokenExpiry', descKey: 'settings.notifAgentTokenExpiryDesc' },
                    { key: 'paymentFailed',    labelKey: 'settings.notifPaymentFailed',    descKey: 'settings.notifPaymentFailedDesc' },
                    { key: 'paymentSuccess', labelKey: 'settings.notifPaymentSuccess', descKey: 'settings.notifPaymentSuccessDesc' },
                    { key: 'errorLogs',      labelKey: 'settings.notifErrorLogs',      descKey: 'settings.notifErrorLogsDesc' },
                    { key: 'bugReports',    labelKey: 'settings.notifBugReports',    descKey: 'settings.notifBugReportsDesc' },
                  ] as { key: keyof NotifPrefs; labelKey: string; descKey: string }[]).map(({ key, labelKey, descKey }) => (
                    <div key={key} className="flex items-center justify-between py-4">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">{t(labelKey)}</Label>
                        <p className="text-xs text-muted-foreground">{t(descKey)}</p>
                      </div>
                      <Switch
                        checked={notifPrefs[key]}
                        onCheckedChange={() => toggleNotif(key)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Destinataires */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('settings.notifRecipients')}</CardTitle>
                  <CardDescription>{t('settings.notifRecipientsDesc')}</CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                  {adminUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('settings.notifNoAdmins')}</p>
                  ) : (
                    <div className="space-y-3">
                      {adminUsers.map((admin) => (
                        <div key={admin.id} className="flex items-center gap-3">
                          <Checkbox
                            id={`admin-${admin.id}`}
                            checked={recipients.includes(admin.id)}
                            onCheckedChange={() => toggleRecipient(admin.id)}
                          />
                          <label
                            htmlFor={`admin-${admin.id}`}
                            className="flex flex-1 items-center justify-between cursor-pointer"
                          >
                            <div>
                              <p className="text-sm font-medium">
                                {admin.firstName} {admin.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">{admin.email}</p>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Apparence ── */}
          {activeSection === 'appearance' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.theme')}</CardTitle>
                  <CardDescription>{t('settings.sectionAppearanceDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all',
                      theme === 'light'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/30'
                    )}
                  >
                    {/* Light mode preview */}
                    <div className="w-full rounded-md border bg-white p-3 shadow-sm">
                      <div className="flex gap-1.5 mb-2">
                        <div className="h-2 w-2 rounded-full bg-red-400" />
                        <div className="h-2 w-2 rounded-full bg-yellow-400" />
                        <div className="h-2 w-2 rounded-full bg-green-400" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-2 w-3/4 rounded bg-gray-200" />
                        <div className="h-2 w-1/2 rounded bg-gray-100" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Sun className="h-4 w-4" />
                      {t('settings.lightMode')}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all',
                      theme === 'dark'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/30'
                    )}
                  >
                    {/* Dark mode preview */}
                    <div className="w-full rounded-md border bg-gray-900 p-3 shadow-sm">
                      <div className="flex gap-1.5 mb-2">
                        <div className="h-2 w-2 rounded-full bg-red-400" />
                        <div className="h-2 w-2 rounded-full bg-yellow-400" />
                        <div className="h-2 w-2 rounded-full bg-green-400" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-2 w-3/4 rounded bg-gray-600" />
                        <div className="h-2 w-1/2 rounded bg-gray-700" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Moon className="h-4 w-4" />
                      {t('settings.darkMode')}
                    </div>
                  </button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.language')}</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-4">
                  {[
                    { lang: 'fr', flag: '🇫🇷', label: t('settings.languageFr') },
                    { lang: 'en', flag: '🇬🇧', label: t('settings.languageEn') },
                  ].map(({ lang, flag, label }) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-3 rounded-xl border-2 py-4 text-sm font-medium transition-all',
                        currentLang === lang
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-muted-foreground/30'
                      )}
                    >
                      <span className="text-xl">{flag}</span>
                      {label}
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Intelligence Artificielle ── */}
          {activeSection === 'ai' && (
            <div className="space-y-4">
              {/* Sélecteur de moteur */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    {t('settings.sectionAi')}
                  </CardTitle>
                  <CardDescription>{t('settings.sectionAiDesc')}</CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6 space-y-3">
                  <Label className="text-sm font-medium">{t('settings.aiProviderLabel')}</Label>

                  {/* Radio group custom */}
                  {([
                    { value: 'claude' as NlqProvider, labelKey: 'settings.aiProviderClaude', descKey: 'settings.aiProviderClaudeDesc' },
                    { value: 'local'  as NlqProvider, labelKey: 'settings.aiProviderLocal',  descKey: 'settings.aiProviderLocalDesc' },
                    { value: 'none'   as NlqProvider, labelKey: 'settings.aiProviderNone',   descKey: 'settings.aiProviderNoneDesc' },
                  ]).map(({ value, labelKey, descKey }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setProvider(value)}
                      className={cn(
                        'w-full flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all',
                        aiFlags.nlqProvider === value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground/30'
                      )}
                    >
                      <div className={cn(
                        'mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center',
                        aiFlags.nlqProvider === value ? 'border-primary' : 'border-muted-foreground/40'
                      )}>
                        {aiFlags.nlqProvider === value && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t(labelKey)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t(descKey)}</p>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Panel Claude — statut clé API uniquement */}
              {aiFlags.nlqProvider === 'claude' && (
                <Card>
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{t('settings.aiClaudeApiKey')}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-green-600 dark:text-green-400 text-xs">{t('settings.aiClaudeApiKeySet')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Insights — visible pour tout provider actif */}
              {aiFlags.nlqProvider !== 'none' && (
                <Card>
                  <CardContent className="pt-2 pb-2">
                    <div className="flex items-center justify-between py-3">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">{t('settings.aiClaudeInsights')}</Label>
                        <p className="text-xs text-muted-foreground">{t('settings.aiClaudeInsightsDesc')}</p>
                      </div>
                      <Switch
                        checked={aiFlags.claudeInsights ?? true}
                        onCheckedChange={() =>
                          saveFlags({ ...aiFlags, localLlmUrl: localUrl, localLlmModel: localModel, claudeInsights: !aiFlags.claudeInsights })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Panel LLM Local */}
              {aiFlags.nlqProvider === 'local' && (
                <Card>
                  <CardContent className="pt-5 space-y-4">
                    {/* URL */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">{t('settings.aiLocalUrl')}</Label>
                      <div className="flex gap-2">
                        <Input
                          value={localUrl}
                          onChange={e => setLocalUrl(e.target.value)}
                          placeholder={t('settings.aiLocalUrlPlaceholder')}
                          className="flex-1 font-mono text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={browseModels}
                          disabled={isBrowsing}
                        >
                          {isBrowsing
                            ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />{t('settings.aiLocalBrowsing')}</>
                            : t('settings.aiLocalBrowse')
                          }
                        </Button>
                      </div>
                    </div>

                    {/* Sélecteur modèle */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">{t('settings.aiLocalModel')}</Label>
                      {availableModels.length > 0 ? (
                        <Select
                          value={localModel}
                          onValueChange={val => setLocalModel(val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('settings.aiLocalModelPlaceholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableModels.map(m => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={localModel}
                          onChange={e => setLocalModel(e.target.value)}
                          placeholder={t('settings.aiLocalModelPlaceholder')}
                          className="font-mono text-sm"
                        />
                      )}
                      {availableModels.length === 0 && (
                        <p className="text-xs text-muted-foreground">{t('settings.aiLocalNoModels')}</p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Button type="button" size="sm" onClick={saveLocalConfig}>
                        {t('common.save') || 'Enregistrer'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

            </div>
          )}

          {/* ── Raccourcis clavier ── */}
          {activeSection === 'shortcuts' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Keyboard className="h-5 w-5" />
                  {t('settings.sectionShortcuts')}
                </CardTitle>
                <CardDescription>{t('settings.sectionShortcutsDesc')}</CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 space-y-6">

                {/* Groupe Général */}
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    {t('settings.shortcutsGroupGeneral')}
                  </p>
                  <div className="divide-y divide-border/50">
                    {[
                      { keys: ['Ctrl', 'K'],         description: 'Recherche globale' },
                      { keys: ['Ctrl', '\\'],        description: 'Réduire / étendre le sidebar' },
                      { keys: ['Ctrl', 'Shift', 'L'], description: 'Basculer thème clair / sombre' },
                      { keys: ['?'],                 description: 'Afficher les raccourcis clavier' },
                    ].map(({ keys, description }) => (
                      <div key={description} className="flex items-center justify-between py-2.5">
                        <span className="text-sm text-muted-foreground">{description}</span>
                        <div className="flex items-center gap-1">
                          {keys.map((k, i) => (
                            <span key={i} className="flex items-center gap-1">
                              <kbd className="inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-mono font-medium text-foreground">
                                {k}
                              </kbd>
                              {i < keys.length - 1 && (
                                <span className="text-xs text-muted-foreground">+</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Groupe Navigation */}
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    {t('settings.shortcutsGroupNav')}
                  </p>
                  <div className="divide-y divide-border/50">
                    {[
                      { keys: ['G', 'D'], description: 'Tableau de bord' },
                      { keys: ['G', 'O'], description: 'Organisations' },
                      { keys: ['G', 'U'], description: 'Utilisateurs' },
                      { keys: ['G', 'I'], description: 'Invitations' },
                      { keys: ['G', 'R'], description: 'Rôles' },
                      { keys: ['G', 'P'], description: "Plans d'abonnement" },
                      { keys: ['G', 'C'], description: 'Plans Clients' },
                      { keys: ['G', 'F'], description: 'Facturation' },
                      { keys: ['G', 'T'], description: 'Dashboards Clients' },
                      { keys: ['G', 'K'], description: 'KPI Store' },
                      { keys: ['G', 'N'], description: 'NLQ Store' },
                      { keys: ['G', 'A'], description: 'Agents' },
                      { keys: ['G', 'L'], description: "Logs d'audit" },
                      { keys: ['G', 'H'], description: 'Santé Système' },
                      { keys: ['G', 'S'], description: 'Paramètres' },
                    ].map(({ keys, description }) => (
                      <div key={description} className="flex items-center justify-between py-2.5">
                        <span className="text-sm text-muted-foreground">{description}</span>
                        <div className="flex items-center gap-1">
                          {keys.map((k, i) => (
                            <span key={i} className="flex items-center gap-1">
                              <kbd className="inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-mono font-medium text-foreground">
                                {k}
                              </kbd>
                              {i < keys.length - 1 && (
                                <span className="text-xs text-muted-foreground">puis</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
