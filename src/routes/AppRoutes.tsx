import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { PublicLayout } from '@/components/layout/PublicLayout'

// Public
const LandingPage = lazy(() => import('@/pages/public/LandingPage'))
const AboutPage = lazy(() => import('@/pages/public/AboutPage'))
const HowItWorksPage = lazy(() => import('@/pages/public/HowItWorksPage'))
const CommunityGuidelinesPage = lazy(() => import('@/pages/public/CommunityGuidelinesPage'))
const PrivacyPolicyPage = lazy(() => import('@/pages/public/PrivacyPolicyPage'))
const DataRetentionPolicyPage = lazy(() => import('@/pages/public/DataRetentionPolicyPage'))
const AccountDeletionPolicyPage = lazy(() => import('@/pages/public/AccountDeletionPolicyPage'))
const CookiePolicyPage = lazy(() => import('@/pages/public/CookiePolicyPage'))
const TermsPage = lazy(() => import('@/pages/public/TermsPage'))
const SafetyPage = lazy(() => import('@/pages/public/SafetyPage'))
const ContactPage = lazy(() => import('@/pages/public/ContactPage'))
const NotFoundPage = lazy(() => import('@/pages/public/NotFoundPage'))

// Community
const CommunityFeedPage = lazy(() => import('@/pages/community/CommunityFeedPage'))
const ExploreStoriesPage = lazy(() => import('@/pages/community/ExploreStoriesPage'))
const StoryDetailsPage = lazy(() => import('@/pages/community/StoryDetailsPage'))
const CategoryDetailsPage = lazy(() => import('@/pages/community/CategoryDetailsPage'))
const SearchResultsPage = lazy(() => import('@/pages/community/SearchResultsPage'))
const CommunityGroupsPage = lazy(() => import('@/pages/community/CommunityGroupsPage'))
const GroupDetailsPage = lazy(() => import('@/pages/community/GroupDetailsPage'))
const SupportResourcesPage = lazy(() => import('@/pages/community/SupportResourcesPage'))

// Auth
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'))

// Dashboard
const UserDashboardPage = lazy(() => import('@/pages/dashboard/UserDashboardPage'))
const MyStoriesPage = lazy(() => import('@/pages/dashboard/MyStoriesPage'))
const StoryEditorPage = lazy(() => import('@/pages/dashboard/StoryEditorPage'))
const SavedStoriesPage = lazy(() => import('@/pages/dashboard/SavedStoriesPage'))
const PrivateJournalPage = lazy(() => import('@/pages/dashboard/PrivateJournalPage'))
const MoodTrackerPage = lazy(() => import('@/pages/dashboard/MoodTrackerPage'))
const RecoveryGoalsPage = lazy(() => import('@/pages/dashboard/RecoveryGoalsPage'))
const NotificationCenterPage = lazy(() => import('@/pages/dashboard/NotificationCenterPage'))
const MyConversationsPage = lazy(() => import('@/pages/dashboard/MyConversationsPage'))
const PrivateChatPage = lazy(() => import('@/pages/dashboard/PrivateChatPage'))
const GroupChatPage = lazy(() => import('@/pages/dashboard/GroupChatPage'))
const CallInterfacePage = lazy(() => import('@/pages/dashboard/CallInterfacePage'))
const ProfileSettingsPage = lazy(() => import('@/pages/dashboard/ProfileSettingsPage'))
const PrivacySettingsPage = lazy(() => import('@/pages/dashboard/PrivacySettingsPage'))
const LanguageSettingsPage = lazy(() => import('@/pages/dashboard/LanguageSettingsPage'))

// Admin
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'))
const UserManagementPage = lazy(() => import('@/pages/admin/UserManagementPage'))
const StoryModerationPage = lazy(() => import('@/pages/admin/StoryModerationPage'))
const CommentModerationPage = lazy(() => import('@/pages/admin/CommentModerationPage'))
const MessageReportsPage = lazy(() => import('@/pages/admin/MessageReportsPage'))
const CallReportsPage = lazy(() => import('@/pages/admin/CallReportsPage'))
const CategoryManagementPage = lazy(() => import('@/pages/admin/CategoryManagementPage'))
const CommunityManagementPage = lazy(() => import('@/pages/admin/CommunityManagementPage'))
const ProfessionalManagementPage = lazy(() => import('@/pages/admin/ProfessionalManagementPage'))
const ResourceManagementPage = lazy(() => import('@/pages/admin/ResourceManagementPage'))
const PlatformSettingsPage = lazy(() => import('@/pages/admin/PlatformSettingsPage'))
const AuditLogsPage = lazy(() => import('@/pages/admin/AuditLogsPage'))

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/guidelines" element={<CommunityGuidelinesPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/data-retention" element={<DataRetentionPolicyPage />} />
        <Route path="/account-deletion" element={<AccountDeletionPolicyPage />} />
        <Route path="/cookies" element={<CookiePolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/safety" element={<SafetyPage />} />
        <Route path="/contact" element={<ContactPage />} />

        <Route path="/feed" element={<CommunityFeedPage />} />
        <Route path="/explore" element={<ExploreStoriesPage />} />
        <Route path="/stories/:storyId" element={<StoryDetailsPage />} />
        <Route path="/categories/:categorySlug" element={<CategoryDetailsPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/groups" element={<CommunityGroupsPage />} />
        <Route path="/groups/:groupId" element={<GroupDetailsPage />} />
        <Route path="/resources" element={<SupportResourcesPage />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<UserDashboardPage />} />
        <Route path="stories" element={<MyStoriesPage />} />
        <Route path="stories/new" element={<StoryEditorPage />} />
        <Route path="stories/:storyId/edit" element={<StoryEditorPage />} />
        <Route path="saved" element={<SavedStoriesPage />} />
        <Route path="journal" element={<PrivateJournalPage />} />
        <Route path="mood" element={<MoodTrackerPage />} />
        <Route path="goals" element={<RecoveryGoalsPage />} />
        <Route path="notifications" element={<NotificationCenterPage />} />
        <Route path="messages" element={<MyConversationsPage />} />
        <Route path="messages/:conversationId" element={<PrivateChatPage />} />
        <Route path="groups/:groupId/chat" element={<GroupChatPage />} />
        <Route path="call/:sessionId" element={<CallInterfacePage />} />
        <Route path="settings/profile" element={<ProfileSettingsPage />} />
        <Route path="settings/privacy" element={<PrivacySettingsPage />} />
        <Route path="settings/language" element={<LanguageSettingsPage />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<UserManagementPage />} />
        <Route path="stories" element={<StoryModerationPage />} />
        <Route path="comments" element={<CommentModerationPage />} />
        <Route path="reports/messages" element={<MessageReportsPage />} />
        <Route path="reports/calls" element={<CallReportsPage />} />
        <Route path="categories" element={<CategoryManagementPage />} />
        <Route path="communities" element={<CommunityManagementPage />} />
        <Route path="professionals" element={<ProfessionalManagementPage />} />
        <Route path="resources" element={<ResourceManagementPage />} />
        <Route path="settings" element={<PlatformSettingsPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
