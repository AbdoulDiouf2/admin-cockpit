import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    MessageSquare,
    Database,
    Layers,
    Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { useNlqIntent } from '@/hooks/use-api';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';

export function NlqIntentDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: intent, isLoading, error } = useNlqIntent(id!);

    if (isLoading) return <LoadingSpinner />;
    if (error || !intent) {
        return (
            <div className="p-4 text-center">
                <p className="text-destructive mb-4">Erreur lors de la récupération de l'intention NLQ.</p>
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
                    <h1 className="text-2xl font-bold tracking-tight">{intent.label}</h1>
                    <p className="text-muted-foreground">Détails de l'intention NLQ</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            Informations Générales
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-2 py-2 border-b">
                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Layers className="h-4 w-4" /> Clé
                            </span>
                            <span className="col-span-2 font-mono text-sm">{intent.key}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 py-2 border-b">
                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Tag className="h-4 w-4" /> Catégorie
                            </span>
                            <span className="col-span-2">
                                <Badge variant="outline">{intent.category}</Badge>
                            </span>
                        </div>
                        <div className="space-y-2 pt-2">
                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                Mots-clés associés
                            </span>
                            <div className="flex flex-wrap gap-1">
                                {intent.keywords?.map((kw: string, idx: number) => (
                                    <Badge key={idx} variant="secondary">{kw}</Badge>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Database className="h-5 w-5 text-primary" />
                            Templates SQL Associés
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {intent.templates && intent.templates.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type Sage</TableHead>
                                        <TableHead>Visualisation</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {intent.templates.map((tpl: any) => (
                                        <TableRow key={tpl.id}>
                                            <TableCell>
                                                <Badge variant={tpl.sageType === '100' ? 'default' : 'outline'}>
                                                    Sage {tpl.sageType}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="capitalize">{tpl.defaultVizType}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigate(`/nlq-store/templates/${tpl.id}`)}
                                                >
                                                    Détails
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Aucun template SQL associé pour le moment.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
