import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(errorMessage || t('auth.invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background overflow-hidden">
      {/* Left side: Branding & Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-muted/30">
        {/* Background Decorative Image */}
        <div 
          className="absolute inset-0 z-0 opacity-40 bg-cover bg-center mix-blend-overlay"
          style={{ backgroundImage: 'url("/login-bg.png")' }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
        
        {/* Animated Background Elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="relative z-10 flex items-center gap-3">
          <img 
            src="/Logo-cockpit.jpeg" 
            alt="Cockpit Logo" 
            className="h-12 w-auto object-contain rounded-md shadow-lg border border-white/10"
          />
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Cockpit</h2>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none">Administration</p>
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-6 mb-12">
          <h1 className="text-5xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Pilotez votre <span className="text-primary italic">donnée</span> en toute simplicité.
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Une interface intuitive et puissante pour centraliser la gestion de vos organisations, 
            utilisateurs et agents Sage. Prenez de la hauteur sur votre business.
          </p>
          
          <div className="flex items-center gap-8 pt-4">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-foreground">99.9%</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Disponibilité</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="space-y-1">
              <p className="text-2xl font-bold text-foreground">Secure</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Bridge Sage</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-muted-foreground font-medium opacity-60">
          © {new Date().getFullYear()} Cockpit. Built with precision for Data Experts.
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-background relative">
        {/* Mobile Logo Only */}
        <div className="lg:hidden flex flex-col items-center gap-4 mb-10 text-center">
          <img 
            src="/Logo-cockpit.jpeg" 
            alt="Cockpit Logo" 
            className="h-16 w-auto object-contain rounded-lg shadow-md"
          />
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Cockpit</h1>
            <p className="text-sm font-medium text-primary uppercase tracking-widest opacity-80">Administration</p>
          </div>
        </div>

        <div className="w-full max-w-[400px] space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">{t('auth.welcome')}</h2>
            <p className="text-muted-foreground">{t('auth.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div 
                className="flex items-center gap-3 p-4 text-sm text-destructive bg-destructive/5 rounded-xl border border-destructive/10 animate-in fade-in zoom-in duration-200"
                data-testid="login-error"
              >
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold ml-1">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  data-testid="login-email-input"
                  className="h-12 bg-muted/30 border-transparent focus:border-primary/30 focus:ring-primary/20 transition-all rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <Button variant="link" size="sm" className="px-0 h-auto text-xs font-medium text-primary hover:text-primary/80">
                    Mot de passe oublié ?
                  </Button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  data-testid="login-password-input"
                  className="h-12 bg-muted/30 border-transparent focus:border-primary/30 focus:ring-primary/20 transition-all rounded-xl"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 font-bold text-base rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
              disabled={isLoading}
              data-testid="login-submit-btn"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('auth.signIn')
              )}
            </Button>
          </form>

          <div className="pt-4 border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground">
              Besoin d'aide ? <button className="text-primary font-semibold hover:underline">Support technique</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
