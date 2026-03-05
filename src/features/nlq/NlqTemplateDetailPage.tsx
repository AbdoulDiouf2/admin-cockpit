import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Code2,
    Activity,
    BarChart3,
    ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { useNlqTemplate } from '@/hooks/use-api';
import { SqlCodeBlock } from '@/components/shared/SqlCodeBlock';

export function NlqTemplateDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: template, isLoading, error } = useNlqTemplate(id!);

    if (isLoading) return <LoadingSpinner />;
    if (error || !template) {
        return (
            <div className="p-4 text-center">
                <p className="text-destructive mb-4">Erreur lors de la récupération du template NLQ.</p>
                <Button onClick={() => navigate('/nlq-store')}>Retour au store</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/nlq-store')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Template SQL</h1>
                    <p className="text-muted-foreground">Configuration technique de la réponse NLQ</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Activity className="h-5 w-5 text-primary" />
                            Statut & Meta
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm font-medium text-muted-foreground">État</span>
                            <Badge variant={template.active ? 'success' : 'destructive'}>
                                {template.active ? 'Actif' : 'Inactif'}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm font-medium text-muted-foreground">Logiciel</span>
                            <Badge variant={template.sageType === '100' ? 'default' : 'outline'}>
                                Sage {template.sageType}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" /> Visualisation
                            </span>
                            <span className="capitalize text-sm font-medium">{template.defaultVizType}</span>
                        </div>
                        {template.intent && (
                            <div className="pt-2">
                                <span className="text-sm font-medium text-muted-foreground block mb-2">Intention associée</span>
                                <Button
                                    variant="outline"
                                    className="w-full justify-between"
                                    onClick={() => navigate(`/nlq-store/intents/${template.intent.id}`)}
                                >
                                    {template.intent.label}
                                    <ExternalLink className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Code2 className="h-5 w-5 text-primary" />
                            Requête SQL
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SqlCodeBlock code={template.sqlQuery} />
                        <p className="text-xs text-muted-foreground mt-4">
                            Note: Cette requête est exécutée dans un environnement sandboxé et filtrée par organisation.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
