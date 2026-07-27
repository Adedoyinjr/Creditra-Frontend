import React, { lazy, Suspense, useState } from 'react';
import Tabs, { TabItem } from '../components/Tabs';
import './Profile.css';

const ActivityTimeline = lazy(() => import('../components/ActivityTimeline'));

/**
 * Profile page component displaying user information with tab navigation.
 * Tabs: Overview (placeholder) | Activity (shows activity timeline).
 */
const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview');
  const tabs: TabItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      panel: (
        <div className="overview-tab">
          <p>This is an overview of the user. Add more details as needed.</p>
        </div>
      ),
    },
    {
      id: 'activity',
      label: 'Activity',
      panel: (
        <Suspense fallback={<div>Loading activity...</div>}>
          <ActivityTimeline />
        </Suspense>
      ),
    },
  ];

  return (
    <div className="profile-page">
      <h1 className="profile-title">User Profile</h1>
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as 'overview' | 'activity')}
        ariaLabel="Profile sections"
        tabListClassName="profile-tabs"
        panelClassName="profile-content"
      />
    </div>
  );
};

export default Profile;
