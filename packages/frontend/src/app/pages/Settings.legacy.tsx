import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { AuthApiService } from '@/core';

const authApiService = new AuthApiService();

interface SettingsData {
  profile: {
    name: string;
    email: string;
    timezone: string;
  };
  notifications: {
    emailNotifications: boolean;
    workflowFailures: boolean;
    weeklyReports: boolean;
    maintenanceUpdates: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    apiAccess: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    defaultWorkflowPrivacy: 'private' | 'team' | 'public';
  };
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsData>({
    profile: {
      name: '',
      email: '',
      timezone: 'UTC-5',
    },
    notifications: {
      emailNotifications: true,
      workflowFailures: true,
      weeklyReports: false,
      maintenanceUpdates: true,
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 60,
      apiAccess: true,
    },
    preferences: {
      theme: 'light',
      language: 'en',
      defaultWorkflowPrivacy: 'private',
    },
  });

  const [activeTab, setActiveTab] = useState<
    'profile' | 'notifications' | 'security' | 'preferences'
  >('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [_isLoading, setIsLoading] = useState(false);

  const loadUserProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await authApiService.getProfile();
      setSettings((prev) => ({
        ...prev,
        profile: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          timezone: 'UTC-5', // Default, could be stored in user profile
        },
      }));
    } catch (_error) {
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update profile information
      if (activeTab === 'profile') {
        const names = settings.profile.name.split(' ');
        await authApiService.updateProfile({
          firstName: names[0] || '',
          lastName: names.slice(1).join(' ') || '',
        });
      }

      // For other settings, you would call appropriate API endpoints
      // For now, just show success message
      alert('Settings saved successfully!');
    } catch (_error) {
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (section: keyof SettingsData, key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'preferences', name: 'Preferences', icon: '⚙️' },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-300">Manage your account and application preferences</p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <div className="w-64">
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-blue-300 backdrop-blur-sm border border-white/30'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="mr-3 text-lg">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 shadow-lg">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="p-6">
                <h2 className="text-lg font-medium text-white mb-6">Profile Information</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Full Name
                    </label>
                    <input
                      aria-label="Profile Name"
                      type="text"
                      value={settings.profile.name}
                      onChange={(e) => updateSetting('profile', 'name', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/30 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 backdrop-blur-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email Address
                    </label>
                    <input
                      aria-label="email"
                      type="email"
                      value={settings.profile.email}
                      onChange={(e) => updateSetting('profile', 'email', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/30 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 backdrop-blur-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Timezone
                    </label>
                    <select
                      aria-label="timezone"
                      value={settings.profile.timezone}
                      onChange={(e) => updateSetting('profile', 'timezone', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/30 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 backdrop-blur-sm"
                    >
                      <option value="UTC-8" className="bg-slate-800 text-white">
                        UTC-8 (Pacific)
                      </option>
                      <option value="UTC-5" className="bg-slate-800 text-white">
                        UTC-5 (Eastern)
                      </option>
                      <option value="UTC+0" className="bg-slate-800 text-white">
                        UTC+0 (GMT)
                      </option>
                      <option value="UTC+1" className="bg-slate-800 text-white">
                        UTC+1 (Central European)
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="p-6">
                <h2 className="text-lg font-medium text-white mb-6">Notification Preferences</h2>
                <div className="space-y-6">
                  {[
                    {
                      key: 'emailNotifications',
                      label: 'Email Notifications',
                      description: 'Receive notifications via email',
                    },
                    {
                      key: 'workflowFailures',
                      label: 'Workflow Failures',
                      description: 'Get notified when workflows fail',
                    },
                    {
                      key: 'weeklyReports',
                      label: 'Weekly Reports',
                      description: 'Receive weekly summary reports',
                    },
                    {
                      key: 'maintenanceUpdates',
                      label: 'Maintenance Updates',
                      description: 'System maintenance notifications',
                    },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-white">{item.label}</h3>
                        <p className="text-sm text-slate-300">{item.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          aria-label="notifications"
                          type="checkbox"
                          checked={
                            settings.notifications[item.key as keyof typeof settings.notifications]
                          }
                          onChange={(e) =>
                            updateSetting('notifications', item.key, e.target.checked)
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-400/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/30 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="p-6">
                <h2 className="text-lg font-medium text-white mb-6">Security Settings</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-white">Two-Factor Authentication</h3>
                      <p className="text-sm text-slate-300">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        aria-label="security"
                        type="checkbox"
                        checked={settings.security.twoFactorAuth}
                        onChange={(e) =>
                          updateSetting('security', 'twoFactorAuth', e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-400/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/30 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Session Timeout (minutes)
                    </label>
                    <select
                      aria-label="security-session time out"
                      value={settings.security.sessionTimeout}
                      onChange={(e) =>
                        updateSetting('security', 'sessionTimeout', parseInt(e.target.value, 10))
                      }
                      className="w-full px-3 py-2 bg-white/10 border border-white/30 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 backdrop-blur-sm"
                    >
                      <option value={30} className="bg-slate-800 text-white">
                        30 minutes
                      </option>
                      <option value={60} className="bg-slate-800 text-white">
                        1 hour
                      </option>
                      <option value={120} className="bg-slate-800 text-white">
                        2 hours
                      </option>
                      <option value={480} className="bg-slate-800 text-white">
                        8 hours
                      </option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-white">API Access</h3>
                      <p className="text-sm text-slate-300">Allow API access to your account</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        aria-label="api access"
                        type="checkbox"
                        checked={settings.security.apiAccess}
                        onChange={(e) => updateSetting('security', 'apiAccess', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-400/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/30 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="p-6">
                <h2 className="text-lg font-medium text-white mb-6">Application Preferences</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Theme</label>
                    <select
                      aria-label="performance"
                      value={settings.preferences.theme}
                      onChange={(e) => updateSetting('preferences', 'theme', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/30 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 backdrop-blur-sm"
                    >
                      <option value="light" className="bg-slate-800 text-white">
                        Light
                      </option>
                      <option value="dark" className="bg-slate-800 text-white">
                        Dark
                      </option>
                      <option value="auto" className="bg-slate-800 text-white">
                        Auto
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Language
                    </label>
                    <select
                      aria-label="language"
                      value={settings.preferences.language}
                      onChange={(e) => updateSetting('preferences', 'language', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/30 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 backdrop-blur-sm"
                    >
                      <option value="en" className="bg-slate-800 text-white">
                        English
                      </option>
                      <option value="es" className="bg-slate-800 text-white">
                        Spanish
                      </option>
                      <option value="fr" className="bg-slate-800 text-white">
                        French
                      </option>
                      <option value="de" className="bg-slate-800 text-white">
                        German
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Default Workflow Privacy
                    </label>
                    <select
                      aria-label="preferences"
                      value={settings.preferences.defaultWorkflowPrivacy}
                      onChange={(e) =>
                        updateSetting('preferences', 'defaultWorkflowPrivacy', e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white/10 border border-white/30 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 backdrop-blur-sm"
                    >
                      <option value="private" className="bg-slate-800 text-white">
                        Private
                      </option>
                      <option value="team" className="bg-slate-800 text-white">
                        Team
                      </option>
                      <option value="public" className="bg-slate-800 text-white">
                        Public
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="px-6 py-4 bg-white/5 border-t border-white/20 rounded-b-lg backdrop-blur-sm">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 text-sm font-medium text-slate-300 bg-white/10 border border-white/30 rounded-lg hover:bg-white/20 hover:text-white transition-all duration-300 backdrop-blur-sm"
                >
                  Reset
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 border border-transparent rounded-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 shadow-lg"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
