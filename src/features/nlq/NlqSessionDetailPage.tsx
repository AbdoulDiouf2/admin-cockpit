import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    MessageSquare,
    Building2,
    User,
    Brain,
    Code2,
    Clock,
    AlertCircle,
    CheckCircle2,
    Hourglass,
    HelpCircle,
    Timer,
    Hash,
    Briefcase,
    Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useNlqSession } from '@/hooks/use-api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    classes: string;
}> = {
    success: {
        label: 'Succès',
        icon: CheckCircle2,
        classes: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-200',
    },
    error: {
        label: 'Erreur',
        icon: AlertCircle,
        classes: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-200',
    },
    pending: {
        label: 'En attente',
        icon: Hourglass,
        classes: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-200',
    },
    no_intent: {
        label: 'Non reconnu',
        icon: HelpCircle,
        classes: 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-200',
    },
};

function statusConfig(status: string) {
    return STATUS_CONFIG[status] ?? {
        label: status,
        icon: HelpCircle,
        classes: 'bg-gray-500/15 text-gray-600 border-gray-200',
    };
}

function userName(user: { firstName: string | null; lastName: string | null; email: string }) {
    const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return full || user.email;
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-3 gap-4 py-2.5 border-b last:border-0">
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <div className="col-span-2 text-sm">{children}</div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function NlqSessionDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: session, isLoading, error } = useNlqSession(id!);

    if (isLoading) return <LoadingSpinner fullScreen />;

    if (error || !session) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
                <p className="text-destructive font-medium">Session NLQ introuvable.</p>
                <Button onClick={() => navigate('/nlq-store?tab=sessions')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour aux sessions
                </Button>
            </div>
        );
    }

    const sc = statusConfig(session.status);
    const StatusIcon = sc.icon;

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="flex items-start gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-3 mb-1">
                        <h1 className="text-2xl font-bold tracking-tight truncate">Session NLQ</h1>
                        <Badge variant="outline" className={`flex items-center gap-1.5 ${sc.classes}`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {sc.label}
                        </Badge>
                        <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                            {session.status}
                        </code>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        {format(new Date(session.createdAt), "d MMMM yyyy 'à' HH:mm:ss", { locale: fr })}
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Colonne gauche — infos principales */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Requête utilisateur */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <MessageSquare className="h-5 w-5 text-primary" />
                                Requête utilisateur
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <blockquote className="border-l-4 border-primary pl-4 py-2 bg-muted/40 rounded-r-md italic text-base">
                                « {session.queryText} »
                            </blockquote>
                        </CardContent>
                    </Card>

                    {/* SQL Généré */}
                    {session.sqlGenerated ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Code2 className="h-5 w-5 text-primary" />
                                    SQL Généré
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <pre className="bg-black/90 dark:bg-black/60 text-green-400 rounded-lg p-4 overflow-x-auto text-xs leading-relaxed max-h-96 overflow-y-auto font-mono whitespace-pre-wrap break-all">
                                    {session.sqlGenerated}
                                </pre>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-dashed">
                            <CardContent className="flex items-center gap-3 py-6 text-muted-foreground">
                                <Code2 className="h-5 w-5 flex-shrink-0" />
                                <span className="text-sm">Aucun SQL généré pour cette session.</span>
                            </CardContent>
                        </Card>
                    )}

                    {/* Erreur */}
                    {session.errorMessage && (
                        <Card className="border-destructive/40">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                                    <AlertCircle className="h-5 w-5" />
                                    Message d'erreur
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-destructive/10 rounded-lg p-4 border border-destructive/20">
                                    <p className="text-sm text-destructive font-mono break-all">
                                        {session.errorMessage}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Intention détectée */}
                    {session.intent ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Brain className="h-5 w-5 text-primary" />
                                    Intention détectée
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-0">
                                <InfoRow label="Label">{session.intent.label}</InfoRow>
                                <InfoRow label="Clé">
                                    <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                                        {session.intent.key}
                                    </code>
                                </InfoRow>
                                <InfoRow label="Catégorie">
                                    <Badge variant="outline">{session.intent.category}</Badge>
                                </InfoRow>
                                {session.intent.templates && session.intent.templates.length > 0 && (
                                    <InfoRow label="Templates SQL">
                                        <div className="flex flex-wrap gap-2">
                                            {session.intent.templates.map((tpl: any) => (
                                                <button
                                                    key={tpl.id}
                                                    onClick={() => navigate(`/nlq-store/templates/${tpl.id}`)}
                                                    className="flex items-center gap-1.5 text-xs border rounded px-2 py-1 hover:bg-muted transition-colors"
                                                >
                                                    <Layers className="h-3 w-3" />
                                                    Sage {tpl.sageType} — {tpl.defaultVizType}
                                                    {!tpl.isActive && (
                                                        <span className="text-destructive ml-1">(inactif)</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </InfoRow>
                                )}
                                {session.intent.keywords && session.intent.keywords.length > 0 && (
                                    <InfoRow label="Mots-clés">
                                        <div className="flex flex-wrap gap-1">
                                            {session.intent.keywords.map((kw: string, i: number) => (
                                                <Badge key={i} variant="secondary" className="text-[11px]">{kw}</Badge>
                                            ))}
                                        </div>
                                    </InfoRow>
                                )}
                                <div className="pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigate(`/nlq-store/intents/${session.intent.id || session.intentKey}`)}
                                    >
                                        Voir l'intention complète →
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-dashed">
                            <CardContent className="flex items-center gap-3 py-6 text-muted-foreground">
                                <Brain className="h-5 w-5 flex-shrink-0" />
                                <span className="text-sm">
                                    Aucune intention reconnue — la requête n'a pas pu être analysée.
                                </span>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Colonne droite — métadonnées */}
                <div className="space-y-6">
                    {/* Métriques */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Timer className="h-5 w-5 text-primary" />
                                Métriques
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-0">
                            <InfoRow label="Latence">
                                {session.latencyMs != null ? (
                                    <span className={`font-bold ${session.latencyMs > 5000 ? 'text-destructive' : session.latencyMs > 2000 ? 'text-yellow-600' : 'text-green-600'}`}>
                                        {session.latencyMs} ms
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground">—</span>
                                )}
                            </InfoRow>
                            <InfoRow label="Statut">
                                <div className="flex flex-col gap-0.5">
                                    <Badge variant="outline" className={sc.classes}>
                                        {sc.label}
                                    </Badge>
                                    <code className="font-mono text-[10px] text-muted-foreground">{session.status}</code>
                                </div>
                            </InfoRow>
                            <InfoRow label="Date">
                                <span className="text-xs">
                                    {format(new Date(session.createdAt), "dd/MM/yyyy HH:mm:ss")}
                                </span>
                            </InfoRow>
                        </CardContent>
                    </Card>

                    {/* Identifiants techniques */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Hash className="h-5 w-5 text-primary" />
                                Identifiants
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Session ID</p>
                                <code className="text-[11px] bg-muted px-1.5 py-1 rounded block break-all font-mono">
                                    {session.id}
                                </code>
                            </div>
                            {session.jobId && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Job ID (AgentJob)</p>
                                    <code className="text-[11px] bg-muted px-1.5 py-1 rounded block break-all font-mono">
                                        {session.jobId}
                                    </code>
                                </div>
                            )}
                            {session.intentKey && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Intent Key</p>
                                    <code className="text-[11px] bg-muted px-1.5 py-1 rounded block font-mono">
                                        {session.intentKey}
                                    </code>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Organisation */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Building2 className="h-5 w-5 text-primary" />
                                Organisation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-0">
                            <InfoRow label="Nom">
                                <button
                                    onClick={() => navigate(`/organizations/${session.organization.id}`)}
                                    className="font-medium text-primary hover:underline text-left"
                                >
                                    {session.organization.name}
                                </button>
                            </InfoRow>
                            {session.organization.sector && (
                                <InfoRow label="Secteur">
                                    <Badge variant="outline">{session.organization.sector}</Badge>
                                </InfoRow>
                            )}
                            {session.organization.country && (
                                <InfoRow label="Pays">{session.organization.country}</InfoRow>
                            )}
                            <InfoRow label="ID">
                                <code className="font-mono text-[10px] text-muted-foreground break-all">
                                    {session.organization.id}
                                </code>
                            </InfoRow>
                        </CardContent>
                    </Card>

                    {/* Utilisateur */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <User className="h-5 w-5 text-primary" />
                                Utilisateur
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-0">
                            <InfoRow label="Nom">
                                <button
                                    onClick={() => navigate(`/users/${session.user.id}`)}
                                    className="font-medium text-primary hover:underline text-left"
                                >
                                    {userName(session.user)}
                                </button>
                            </InfoRow>
                            <InfoRow label="Email">
                                <span className="text-xs text-muted-foreground">{session.user.email}</span>
                            </InfoRow>
                            <InfoRow label="ID">
                                <code className="font-mono text-[10px] text-muted-foreground break-all">
                                    {session.user.id}
                                </code>
                            </InfoRow>
                        </CardContent>
                    </Card>

                    {/* Chrono visuel */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Clock className="h-5 w-5 text-primary" />
                                Chronologie
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ol className="relative border-l border-muted-foreground/20 space-y-4 ml-2">
                                <li className="ml-4">
                                    <span className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                                    <p className="text-xs font-semibold">Requête reçue</p>
                                    <p className="text-[11px] text-muted-foreground">
                                        {format(new Date(session.createdAt), "HH:mm:ss.SSS")}
                                    </p>
                                </li>
                                {session.intentKey && (
                                    <li className="ml-4">
                                        <span className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full bg-blue-500 border-2 border-background" />
                                        <p className="text-xs font-semibold">Intention détectée</p>
                                        <p className="text-[11px] text-muted-foreground font-mono">{session.intentKey}</p>
                                    </li>
                                )}
                                {session.jobId && (
                                    <li className="ml-4">
                                        <span className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full bg-purple-500 border-2 border-background" />
                                        <p className="text-xs font-semibold">Job agent créé</p>
                                        <p className="text-[11px] text-muted-foreground font-mono truncate">{session.jobId}</p>
                                    </li>
                                )}
                                <li className="ml-4">
                                    <span className={`absolute -left-1.5 mt-1 h-3 w-3 rounded-full border-2 border-background ${
                                        session.status === 'success' ? 'bg-green-500' :
                                        session.status === 'error' ? 'bg-red-500' :
                                        session.status === 'no_intent' ? 'bg-gray-400' : 'bg-yellow-500'
                                    }`} />
                                    <p className="text-xs font-semibold">Fin — {sc.label}</p>
                                    {session.latencyMs != null && (
                                        <p className="text-[11px] text-muted-foreground">
                                            Durée totale : {session.latencyMs} ms
                                        </p>
                                    )}
                                </li>
                            </ol>
                        </CardContent>
                    </Card>

                    {/* Bouton Voir l'organisation */}
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 gap-2" onClick={() => navigate(`/organizations/${session.organization.id}`)}>
                            <Briefcase className="h-4 w-4" />
                            Voir l'organisation
                        </Button>
                        <Button variant="outline" className="flex-1 gap-2" onClick={() => navigate(`/users/${session.user.id}`)}>
                            <User className="h-4 w-4" />
                            Voir l'utilisateur
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
