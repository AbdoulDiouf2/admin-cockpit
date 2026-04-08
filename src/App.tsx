import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './features/auth/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './features/auth/LoginPage';
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './features/auth/ResetPasswordPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { OrganizationsPage } from './features/organizations/OrganizationsPage';
import { OrganizationDetailPage } from './features/organizations/OrganizationDetailPage';
import { UsersPage } from './features/users/UsersPage';
import { UserDetailPage } from './features/users/UserDetailPage';
import { RolesPage } from './features/roles/RolesPage';
import { RoleDetailPage } from './features/roles/RoleDetailPage';
import { AgentsPage } from './features/agents/AgentsPage';
import { AgentDetailPage } from './features/agents/AgentDetailPage';
import { AuditLogsPage } from './features/audit-logs/AuditLogsPage';
import { AuditLogDetailPage } from './features/audit-logs/AuditLogDetailPage';
import { InvitationsPage } from './features/invitations/InvitationsPage';
import { HealthPage } from './features/health/HealthPage';
import { ProfilePage } from './features/profile/ProfilePage';
import { SettingsPage } from './features/settings/SettingsPage';
import { SubscriptionPlansPage } from './features/subscriptions/SubscriptionPlansPage';
import { DashboardsPage } from './features/dashboards/DashboardsPage';
import { DashboardDetailPage } from './features/dashboards/DashboardDetailPage';
import { SubscriptionPlanDetailPage } from './features/subscriptions/SubscriptionPlanDetailPage';

import { ClientPlansPage } from '@/features/subscriptions/ClientPlansPage';
import { BillingSubscriptionsPage } from '@/features/billing/BillingSubscriptionsPage';
import { BillingSubscriptionDetailPage } from '@/features/billing/BillingSubscriptionDetailPage';
import { KpiStorePage } from './features/kpi-store/KpiStorePage';
import { WidgetTemplateDetailPage } from './features/kpi-store/WidgetTemplateDetailPage';
import { KpiDefinitionDetailPage } from './features/kpi-store/KpiDefinitionDetailPage';
import { KpiPackDetailPage } from './features/kpi-store/KpiPackDetailPage';
import { KpiHealthPage } from './features/kpi-store/KpiHealthPage';
import { KpiHealthDetailPage } from './features/kpi-store/KpiHealthDetailPage';
import { NlqStorePage } from './features/nlq/NlqStorePage';
import { NlqIntentDetailPage } from './features/nlq/NlqIntentDetailPage';
import { NlqTemplateDetailPage } from './features/nlq/NlqTemplateDetailPage';
import { NlqSessionDetailPage } from './features/nlq/NlqSessionDetailPage';
import { OnboardingPage } from './features/onboarding/OnboardingPage';
import { BugTrackerPage } from './features/bug-tracker/BugTrackerPage';
import { CreateBugPage } from './features/bug-tracker/CreateBugPage';
import { BugDetailPage } from './features/bug-tracker/BugDetailPage';
import { LoadingSpinner } from './components/shared/LoadingSpinner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/organizations" element={<OrganizationsPage />} />
                <Route path="/organizations/:id" element={<OrganizationDetailPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/users/:id" element={<UserDetailPage />} />
                <Route path="/invitations" element={<InvitationsPage />} />
                <Route path="/roles" element={<RolesPage />} />
                <Route path="/roles/:id" element={<RoleDetailPage />} />
                <Route path="/agents" element={<AgentsPage />} />
                <Route path="/agents/:id" element={<AgentDetailPage />} />
                <Route path="/audit-logs" element={<AuditLogsPage />} />
                <Route path="/audit-logs/:id" element={<AuditLogDetailPage />} />
                <Route path="/health" element={<HealthPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/subscription-plans" element={<SubscriptionPlansPage />} />
                <Route path="/subscription-plans/:id" element={<SubscriptionPlanDetailPage />} />
                <Route path="/dashboards" element={<DashboardsPage />} />
                <Route path="/dashboards/:id" element={<DashboardDetailPage />} />
                <Route path="/client-plans" element={<ClientPlansPage />} />
                <Route path="/billing-subscriptions" element={<BillingSubscriptionsPage />} />
                <Route path="/billing-subscriptions/:orgId" element={<BillingSubscriptionDetailPage />} />

                <Route path="/kpi-store" element={<KpiStorePage />} />
                <Route path="/kpi-store/widget-templates/:id" element={<WidgetTemplateDetailPage />} />
                <Route path="/kpi-store/definitions/:id" element={<KpiDefinitionDetailPage />} />
                <Route path="/kpi-store/packs/:id" element={<KpiPackDetailPage />} />
                <Route path="/kpi-health" element={<KpiHealthPage />} />
                <Route path="/kpi-health/:id" element={<KpiHealthDetailPage />} />
                <Route path="/nlq-store" element={<NlqStorePage />} />
                <Route path="/nlq-store/intents/:id" element={<NlqIntentDetailPage />} />
                <Route path="/nlq-store/templates/:id" element={<NlqTemplateDetailPage />} />
                <Route path="/nlq-store/sessions/:id" element={<NlqSessionDetailPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/bug-tracker" element={<BugTrackerPage />} />
                <Route path="/bug-tracker/new" element={<CreateBugPage />} />
                <Route path="/bug-tracker/:id" element={<BugDetailPage />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
