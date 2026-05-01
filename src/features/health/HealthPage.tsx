import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Database,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Server,
  BookOpen,
  HardDrive,
  Timer,
} from 'lucide-react';
import { healthApi } from '@/api';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export function HealthPage() {
  const { t } = useTranslation();

  const {
    data: apiHealth,
    isLoading: apiLoading,
    error: apiError,
    refetch: refetchApi,
    dataUpdatedAt: apiUpdatedAt,
    isFetching: apiFetching,
  } = useQuery({
    queryKey: ['health-api'],
    queryFn: () => healthApi.check().then((r) => r.data),
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
    retry: false,
  });

  const {
    data: dbHealth,
    isLoading: dbLoading,
    error: dbError,
    refetch: refetchDb,
    dataUpdatedAt: dbUpdatedAt,
    isFetching: dbFetching,
  } = useQuery({
    queryKey: ['health-db'],
    queryFn: () => healthApi.checkDb().then((r) => r.data),
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
    retry: false,
  });

  const {
    data: jobsData,
    isLoading: jobsLoading,
    refetch: refetchJobs,
    isFetching: jobsFetching,
  } = useQuery({
    queryKey: ['health-jobs'],
    queryFn: () => healthApi.getJobs().then((r) => r.data),
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false,
    retry: false,
  });

  const handleRefresh = () => {
    refetchApi();
    refetchDb();
    refetchJobs();
  };

  const apiOk = !apiError && apiHealth?.status === 'ok';
  const dbOk = !dbError && dbHealth?.database === 'connected';
  const redisOk = dbHealth?.redis === 'connected';
  const mkdocsOk = dbHealth?.mkdocs === 'connected';
  const minioOk = dbHealth?.minio === 'connected';
  const isFetching = apiFetching || dbFetching || jobsFetching;

  return (
    <div className="space-y-6" data-testid="health-page">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('health.title')}</h1>
          <p className="text-muted-foreground">{t('health.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            {t('health.autoRefresh')}
          </span>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            {t('health.checkNow')}
          </Button>
        </div>
      </div>

      {/* Summary indicators */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* API Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">{t('health.api', 'API Backend')}</CardTitle>
            </div>
            {apiLoading ? (
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : apiOk ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('health.status')}</span>
              {apiLoading ? (
                <span className="text-sm text-muted-foreground">Vérification...</span>
              ) : (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    apiOk
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {apiOk ? t('health.ok') : t('health.error')}
                </span>
              )}
            </div>

            {apiHealth && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('health.service')}</span>
                  <span className="text-sm font-mono">{apiHealth.service}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('health.version')}</span>
                  <span className="text-sm font-mono">{apiHealth.version}</span>
                </div>
              </>
            )}

            {apiError && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
                API inaccessible — vérifier que le serveur NestJS est démarré sur le port 3000.
              </div>
            )}

            {apiUpdatedAt > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                <Clock className="h-3.5 w-3.5" />
                {t('health.lastChecked')} :{' '}
                {format(new Date(apiUpdatedAt), 'HH:mm:ss')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">{t('health.database', 'PostgreSQL')}</CardTitle>
            </div>
            {dbLoading ? (
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : dbOk ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('health.status')}</span>
              {dbLoading ? (
                <span className="text-sm text-muted-foreground">Vérification...</span>
              ) : (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    dbOk
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {dbOk ? t('health.ok') : t('health.error')}
                </span>
              )}
            </div>

            {dbHealth && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Connexion</span>
                <span className="text-sm font-mono">{dbHealth.database}</span>
              </div>
            )}

            {dbError && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
                Base de données inaccessible — vérifier la connexion PostgreSQL.
              </div>
            )}

            {dbUpdatedAt > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                <Clock className="h-3.5 w-3.5" />
                {t('health.lastChecked')} :{' '}
                {format(new Date(dbUpdatedAt), 'HH:mm:ss')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Redis Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">{t('health.redis', 'Cache Redis')}</CardTitle>
            </div>
            {dbLoading ? (
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : redisOk ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('health.status')}</span>
              {dbLoading ? (
                <span className="text-sm text-muted-foreground">Vérification...</span>
              ) : (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    redisOk
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {redisOk ? t('health.ok') : t('health.error')}
                </span>
              )}
            </div>

            {dbHealth && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Connexion</span>
                <span className="text-sm font-mono">{dbHealth.redis}</span>
              </div>
            )}

            {dbHealth?.redisError && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400 truncate" title={dbHealth.redisError}>
                {dbHealth.redisError}
              </div>
            )}

            {dbUpdatedAt > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                <Clock className="h-3.5 w-3.5" />
                {t('health.lastChecked')} :{' '}
                {format(new Date(dbUpdatedAt), 'HH:mm:ss')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* MkDocs Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">{t('health.mkdocs', 'Doc MkDocs')}</CardTitle>
            </div>
            {dbLoading ? (
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : mkdocsOk ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('health.status')}</span>
              {dbLoading ? (
                <span className="text-sm text-muted-foreground">Vérification...</span>
              ) : (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    mkdocsOk
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : dbHealth?.mkdocs === 'not_configured'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {mkdocsOk ? t('health.ok') : dbHealth?.mkdocs === 'not_configured' ? 'Non configuré' : t('health.error')}
                </span>
              )}
            </div>

            {dbHealth && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Connexion</span>
                <span className="text-sm font-mono">{dbHealth.mkdocs}</span>
              </div>
            )}

            {dbHealth?.mkdocsError && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400 truncate" title={dbHealth.mkdocsError}>
                {dbHealth.mkdocsError}
              </div>
            )}

            {dbUpdatedAt > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                <Clock className="h-3.5 w-3.5" />
                {t('health.lastChecked')} :{' '}
                {format(new Date(dbUpdatedAt), 'HH:mm:ss')}
              </div>
            )}
          </CardContent>
        </Card>
        {/* MinIO Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">MinIO</CardTitle>
            </div>
            {dbLoading ? (
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : minioOk ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('health.status')}</span>
              {dbLoading ? (
                <span className="text-sm text-muted-foreground">Vérification...</span>
              ) : (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    minioOk
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : dbHealth?.minio === 'not_configured'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {minioOk ? t('health.ok') : dbHealth?.minio === 'not_configured' ? 'Non configuré' : t('health.error')}
                </span>
              )}
            </div>

            {dbHealth && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Connexion</span>
                <span className="text-sm font-mono">{dbHealth.minio}</span>
              </div>
            )}

            {minioOk && dbHealth?.minioBucket && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Bucket</span>
                <span className="text-sm font-mono truncate max-w-[100px]" title={dbHealth.minioBucket}>{dbHealth.minioBucket}</span>
              </div>
            )}

            {dbHealth?.minioError && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400 truncate" title={dbHealth.minioError}>
                {dbHealth.minioError}
              </div>
            )}

            {dbUpdatedAt > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                <Clock className="h-3.5 w-3.5" />
                {t('health.lastChecked')} :{' '}
                {format(new Date(dbUpdatedAt), 'HH:mm:ss')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Global Status Banner */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <Server className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                {apiOk && dbOk && redisOk && mkdocsOk && minioOk
                  ? 'Tous les systèmes sont opérationnels'
                  : !apiOk && !dbOk
                  ? 'API et bases de données inaccessibles'
                  : 'Un ou plusieurs composants sont en erreur'}
              </p>
              <p className="text-xs text-muted-foreground">
                Endpoint API : {import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}
              </p>
            </div>
            <div
              className={`h-3 w-3 rounded-full ${
                apiOk && dbOk && redisOk && mkdocsOk && minioOk
                  ? 'bg-green-500'
                  : apiOk || dbOk
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              } ${isFetching ? 'animate-pulse' : ''}`}
            />
          </div>
        </CardContent>
      </Card>

      {/* Background Jobs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">{t('health.jobs')}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{t('health.jobsSubtitle')}</p>
            </div>
          </div>
          {jobsLoading && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
        </CardHeader>
        <CardContent>
          {jobsLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Chargement...
            </div>
          ) : !jobsData || jobsData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucun job enregistré — les tâches s'affichent après leur premier démarrage.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="pb-2 text-left font-medium">{t('health.jobName')}</th>
                    <th className="pb-2 text-left font-medium">{t('health.jobLastRun')}</th>
                    <th className="pb-2 text-right font-medium">{t('health.jobDuration')}</th>
                    <th className="pb-2 text-right font-medium">{t('health.jobRuns')}</th>
                    <th className="pb-2 text-right font-medium">{t('health.jobStatus')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {jobsData.map((job) => (
                    <tr key={job.name} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 pr-4 font-medium">{job.name}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground">
                        {job.lastRunAt ? (
                          <span title={format(new Date(job.lastRunAt), 'dd/MM/yyyy HH:mm:ss')}>
                            {formatDistanceToNow(new Date(job.lastRunAt), { addSuffix: true, locale: fr })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60 italic">{t('health.jobNever')}</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                        {job.lastRunDurationMs != null ? `${job.lastRunDurationMs} ms` : '—'}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                        {job.runCount}
                      </td>
                      <td className="py-2.5 text-right">
                        {job.lastRunSuccess === null ? (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            {t('health.jobPending')}
                          </span>
                        ) : job.lastRunSuccess ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle2 className="h-3 w-3" />
                            {t('health.jobSuccess')}
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 cursor-help"
                            title={job.lastError ?? undefined}
                          >
                            <XCircle className="h-3 w-3" />
                            {t('health.jobFailed')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
