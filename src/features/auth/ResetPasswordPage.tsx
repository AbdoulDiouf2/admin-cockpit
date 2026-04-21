import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, KeyRound, CheckCircle2, Eye, EyeOff, Check } from 'lucide-react';
import { authApi } from '@/api';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState(true);
  const [isTokenInvalid, setIsTokenInvalid] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsVerifyingToken(false);
        return;
      }

      try {
        await authApi.verifyResetToken(token);
        setIsTokenInvalid(false);
      } catch (err) {
        console.error('Token verification failed:', err);
        setIsTokenInvalid(true);
      } finally {
        setIsVerifyingToken(false);
      }
    };

    verifyToken();
  }, [token]);

  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (!token) {
      setError('Token de réinitialisation manquant.');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword({ token, newPassword: password });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Une erreur est survenue lors de la réinitialisation.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifyingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse font-medium">Vérification de la validité du lien...</p>
        </div>
      </div>
    );
  }

  if (!token || isTokenInvalid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Lien invalide ou expiré</h1>
          <p className="text-muted-foreground">
            Ce lien de réinitialisation est invalide, a déjà été utilisé ou a expiré. Veuillez recommencer la procédure.
          </p>
          <Button asChild className="w-full">
            <Link to="/forgot-password">Demander un nouveau lien</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background overflow-hidden">
      {/* Left side: branding */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-muted/30">
        <div 
          className="absolute inset-0 z-0 opacity-40 bg-cover bg-center mix-blend-overlay"
          style={{ backgroundImage: 'url("/login-bg.png")' }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
        
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

        <div className="relative z-10 max-w-lg mb-12">
          <h1 className="text-5xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Nouveau <span className="text-primary italic">Départ</span>.
          </h1>
          <p className="text-xl text-muted-foreground mt-6">
            Définissez votre nouveau mot de passe pour sécuriser votre accès. Choisissez quelque chose de robuste !
          </p>
        </div>

        <div className="relative z-10 text-sm text-muted-foreground font-medium opacity-60">
          © {new Date().getFullYear()} Cockpit. Advanced Security.
        </div>
      </div>

      {/* Right side: form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-background relative">
        <div className="w-full max-w-[400px] space-y-8">
          {isSuccess ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Mot de passe mis à jour</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.
                </p>
              </div>
              <Button asChild className="w-full h-12 rounded-xl">
                <Link to="/login">Se connecter →</Link>
              </Button>
            </div>
          ) : (
          <>
          <div className="space-y-2">
            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Réinitialisation</h2>
            <p className="text-muted-foreground">Choisissez un nouveau mot de passe sécurisé.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 p-4 text-sm text-destructive bg-destructive/5 rounded-xl border border-destructive/10">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <div className="relative group">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 bg-muted/30 border-transparent focus:border-primary/30 focus:ring-primary/20 transition-all rounded-xl pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <div className="relative group">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={cn(
                      "h-12 bg-muted/30 border-transparent focus:ring-primary/20 transition-all rounded-xl pr-12",
                      confirmPassword && !passwordsMatch && "border-destructive/50 focus:border-destructive/30",
                      passwordsMatch && "border-primary/50 focus:border-primary/30"
                    )}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {passwordsMatch && (
                      <Check className="h-5 w-5 text-primary animate-in zoom-in duration-300" />
                    )}
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-[12px] text-destructive font-medium ml-1 animate-in fade-in slide-in-from-top-1">
                    Les mots de passe ne correspondent pas
                  </p>
                )}
                {passwordsMatch && (
                  <p className="text-[12px] text-primary font-medium ml-1 animate-in fade-in slide-in-from-top-1">
                    Les mots de passe correspondent
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 font-bold text-base rounded-xl shadow-lg shadow-primary/20 transition-all"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Mettre à jour'}
            </Button>
          </form>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
