"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Settings,
  Bell,
  Lock,
  Database,
  Mail,
  ToggleRight,
  ToggleLeft,
  Save,
  AlertCircle,
  CheckCircle,
  Shield,
  Zap,
  Users,
  Eye,
  Edit,
  X,
} from "lucide-react";
import { trpc } from "@/app/_trpc/client";

interface SettingSection {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

interface SecuritySetting {
  id: string;
  label: string;
  description: string;
  value: string | boolean;
}

export default function AdminSettingsPage() {
  const [activeSection, setActiveSection] = useState("general");
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  
  const [generalSettings, setGeneralSettings] = useState({
    siteName: "",
    siteUrl: "",
    supportEmail: "",
    adminEmail: "",
    timezone: "",
    language: "",
  });

  
  const [notifications, setNotifications] = useState<NotificationSetting[]>([]);

  
  const [securitySettings, setSecuritySettings] = useState<SecuritySetting[]>(
    []
  );

  
  const [systemSettings, setSystemSettings] = useState({
    maxUploadSize: "",
    maxImageDimensions: "",
    cacheTTL: "",
    backupFrequency: "",
    maintenanceMode: false,
    apiRateLimit: "",
  });

  
  const [emailSettings, setEmailSettings] = useState({
    smtpServer: "",
    smtpPort: "",
    fromEmail: "",
    fromName: "",
    replyTo: "",
    enableSSL: true,
  });

  
  const [originalValues, setOriginalValues] = useState({
    generalSettings,
    notifications,
    securitySettings,
    systemSettings,
    emailSettings,
  });

  
  const { data: settingsData, isLoading: isQueryLoading } = trpc.adminSettings.getAllSettings.useQuery();

  
  useEffect(() => {
    if (settingsData && !isQueryLoading) {
      const generalData = (settingsData as any).general || {};
      setGeneralSettings({
        siteName: generalData.siteName || 'Luxela',
        siteUrl: generalData.siteUrl || 'https://theluxela.com',
        supportEmail: generalData.supportEmail || 'support@theluxela.com',
        adminEmail: generalData.adminEmail || 'admin@theluxela.com',
        timezone: generalData.timezone || 'UTC',
        language: generalData.language || 'en',
      });

      const notificationsData = (settingsData as any).notifications || {};
      setNotifications([
        {
          id: 'order-updates',
          label: 'Order Updates',
          description: 'Receive notifications about new orders and order changes',
          enabled: notificationsData['order-updates'] !== false,
        },
        {
          id: 'customer-inquiries',
          label: 'Customer Inquiries',
          description: 'Get notified when customers send messages or inquiries',
          enabled: notificationsData['customer-inquiries'] !== false,
        },
        {
          id: 'system-alerts',
          label: 'System Alerts',
          description: 'Receive critical system and security alerts',
          enabled: notificationsData['system-alerts'] !== false,
        },
        {
          id: 'payment-notifications',
          label: 'Payment Notifications',
          description: 'Get notified about payment and payout events',
          enabled: notificationsData['payment-notifications'] !== false,
        },
      ]);

      const securityData = (settingsData as any).security || {};
      setSecuritySettings([
        {
          id: 'two-factor-auth',
          label: 'Two-Factor Authentication',
          description: 'Require 2FA for admin account access',
          value: securityData['two-factor-auth'] ?? false,
        },
        {
          id: 'ip-whitelist',
          label: 'IP Whitelist',
          description: 'Restrict admin access to specific IP addresses',
          value: securityData['ip-whitelist'] ?? false,
        },
        {
          id: 'session-timeout',
          label: 'Session Timeout',
          description: 'Minutes before admin session expires (0 = disabled)',
          value: securityData['session-timeout'] ?? '30',
        },
        {
          id: 'activity-logging',
          label: 'Activity Logging',
          description: 'Log all admin actions for audit purposes',
          value: securityData['activity-logging'] ?? true,
        },
      ]);

      const systemData = (settingsData as any).system || {};
      setSystemSettings({
        maxUploadSize: systemData.maxUploadSize || '50MB',
        maxImageDimensions: systemData.maxImageDimensions || '4000x4000',
        cacheTTL: systemData.cacheTTL || '3600',
        backupFrequency: systemData.backupFrequency || 'Daily',
        maintenanceMode: systemData.maintenanceMode || false,
        apiRateLimit: systemData.apiRateLimit || '1000',
      });

      const emailData = (settingsData as any).email || {};
      setEmailSettings({
        smtpServer: emailData.smtpServer || 'smtp.gmail.com',
        smtpPort: emailData.smtpPort || '587',
        fromEmail: emailData.fromEmail || 'noreply@theluxela.com',
        fromName: emailData.fromName || 'Luxela',
        replyTo: emailData.replyTo || 'support@theluxela.com',
        enableSSL: emailData.enableSSL !== false,
      });

      setIsLoading(false);
    } else if (isQueryLoading) {
      setIsLoading(true);
    }
  }, [settingsData, isQueryLoading]);

  
  const updateGeneralMutation =
    trpc.adminSettings.updateGeneralSettings.useMutation();
  const updateSettingsMutation =
    trpc.adminSettings.updateSettings.useMutation();
  const updateEmailMutation =
    trpc.adminSettings.updateEmailSettings.useMutation();

  const settingSections: SettingSection[] = [
    { id: "general", label: "General Settings", icon: <Settings size={20} /> },
    {
      id: "notifications",
      label: "Notifications",
      icon: <Bell size={20} />,
    },
    { id: "security", label: "Security", icon: <Lock size={20} /> },
    { id: "system", label: "System", icon: <Database size={20} /> },
    { id: "email", label: "Email Configuration", icon: <Mail size={20} /> },
  ];

  const handleEditToggle = () => {
    if (isEditMode) {
      
      setGeneralSettings(originalValues.generalSettings);
      setNotifications(originalValues.notifications);
      setSecuritySettings(originalValues.securitySettings);
      setSystemSettings(originalValues.systemSettings);
      setEmailSettings(originalValues.emailSettings);
    }
    setIsEditMode(!isEditMode);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      
      switch (activeSection) {
        case "general":
          await updateGeneralMutation.mutateAsync(generalSettings);
          break;
        case "notifications": {
          
          const updates = notifications.map((n) => ({
            settingKey: `notifications:${n.id}`,
            settingValue: n.enabled,
            category: 'notifications',
          }));
          await updateSettingsMutation.mutateAsync(updates);
          break;
        }
        case "security": {
          
          const updates = securitySettings.map((s) => ({
            settingKey: `security:${s.id}`,
            settingValue: s.value,
            category: 'security',
          }));
          await updateSettingsMutation.mutateAsync(updates);
          break;
        }
        case "system": {
          
          const updates = Object.entries(systemSettings).map(([key, value]) => ({
            settingKey: `system:${key}`,
            settingValue: value,
            category: 'system',
          }));
          await updateSettingsMutation.mutateAsync(updates);
          break;
        }
        case "email":
          await updateEmailMutation.mutateAsync(emailSettings);
          break;
      }

      toast.success('Settings saved successfully', {
        duration: 4000,
        position: 'top-right'
      });
      setIsEditMode(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error('Failed to save settings. Please try again.', {
        duration: 4000,
        position: 'top-right'
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!settingsData || isQueryLoading) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [settingsData, isQueryLoading]);

  const toggleNotification = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n))
    );
  };

  const toggleSecurity = (id: string) => {
    setSecuritySettings(
      securitySettings.map((s) =>
        s.id === id
          ? {
              ...s,
              value: typeof s.value === "boolean" ? !s.value : s.value,
            }
          : s
      )
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0e0e0e] via-[#1a1a1a] to-[#0e0e0e] p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-gray-400">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e0e0e] via-[#1a1a1a] to-[#0e0e0e] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <Settings className="w-8 h-8 text-purple-500" />
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                Admin Settings
              </h1>
            </div>
            {!isEditMode ? (
              <button
                onClick={handleEditToggle}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
              >
                <Edit size={18} />
                <span>Edit</span>
              </button>
            ) : (
              <button
                onClick={handleEditToggle}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
              >
                <X size={18} />
                <span>Cancel</span>
              </button>
            )}
          </div>
          <p className="text-gray-400">
            Manage system configuration and preferences
          </p>
        </div>

        {}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-2">
              {settingSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                    activeSection === section.id
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                      : "text-gray-400 hover:bg-slate-700/50 hover:text-white"
                  }`}
                >
                  {section.icon}
                  <span className="text-sm font-medium">{section.label}</span>
                </button>
              ))}
            </div>
          </div>

          {}
          <div className="lg:col-span-4">
            {}
            {activeSection === "general" && (
              <div className="space-y-6">
                <div className="bg-slate-800 rounded-xl border border-[#2B2B2B] p-6">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                    <Settings size={20} className="text-purple-500" />
                    <span>General Configuration</span>
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Site Name
                      </label>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={generalSettings.siteName}
                          onChange={(e) =>
                            setGeneralSettings({
                              ...generalSettings,
                              siteName: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-slate-700 border border-[#2B2B2B] rounded-lg text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
                        />
                      ) : (
                        <div className="px-4 py-2 bg-slate-700/50 border border-[#2B2B2B] rounded-lg text-white">
                          {generalSettings.siteName}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Site URL
                      </label>
                      {isEditMode ? (
                        <input
                          type="url"
                          value={generalSettings.siteUrl}
                          onChange={(e) =>
                            setGeneralSettings({
                              ...generalSettings,
                              siteUrl: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-slate-700 border border-[#2B2B2B] rounded-lg text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
                        />
                      ) : (
                        <div className="px-4 py-2 bg-slate-700/50 border border-[#2B2B2B] rounded-lg text-white">
                          {generalSettings.siteUrl}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Support Email
                      </label>
                      {isEditMode ? (
                        <input
                          type="email"
                          value={generalSettings.supportEmail}
                          onChange={(e) =>
                            setGeneralSettings({
                              ...generalSettings,
                              supportEmail: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-slate-700 border border-[#2B2B2B] rounded-lg text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
                        />
                      ) : (
                        <div className="px-4 py-2 bg-slate-700/50 border border-[#2B2B2B] rounded-lg text-white">
                          {generalSettings.supportEmail}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Admin Email
                      </label>
                      {isEditMode ? (
                        <input
                          type="email"
                          value={generalSettings.adminEmail}
                          onChange={(e) =>
                            setGeneralSettings({
                              ...generalSettings,
                              adminEmail: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-slate-700 border border-[#2B2B2B] rounded-lg text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
                        />
                      ) : (
                        <div className="px-4 py-2 bg-slate-700/50 border border-[#2B2B2B] rounded-lg text-white">
                          {generalSettings.adminEmail}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Timezone
                      </label>
                      {isEditMode ? (
                        <select
                          value={generalSettings.timezone}
                          onChange={(e) =>
                            setGeneralSettings({
                              ...generalSettings,
                              timezone: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-slate-700 border border-[#2B2B2B] rounded-lg text-white focus:border-purple-500 focus:outline-none"
                        >
                          <option>UTC</option>
                          <option>EST</option>
                          <option>CST</option>
                          <option>MST</option>
                          <option>PST</option>
                        </select>
                      ) : (
                        <div className="px-4 py-2 bg-slate-700/50 border border-[#2B2B2B] rounded-lg text-white">
                          {generalSettings.timezone}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Language
                      </label>
                      {isEditMode ? (
                        <select
                          value={generalSettings.language}
                          onChange={(e) =>
                            setGeneralSettings({
                              ...generalSettings,
                              language: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-slate-700 border border-[#2B2B2B] rounded-lg text-white focus:border-purple-500 focus:outline-none"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                        </select>
                      ) : (
                        <div className="px-4 py-2 bg-slate-700/50 border border-[#2B2B2B] rounded-lg text-white">
                          {generalSettings.language === "en"
                            ? "English"
                            : generalSettings.language === "es"
                              ? "Spanish"
                              : generalSettings.language === "fr"
                                ? "French"
                                : "German"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {}
            {activeSection === "notifications" && (
              <div className="space-y-6">
                <div className="bg-slate-800 rounded-xl border border-[#2B2B2B] p-6">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                    <Bell size={20} className="text-purple-500" />
                    <span>Notification Preferences</span>
                  </h2>

                  <div className="space-y-4">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-white">
                            {notif.label}
                          </h3>
                          <p className="text-sm text-gray-400 mt-1">
                            {notif.description}
                          </p>
                        </div>
                        {isEditMode ? (
                          <button
                            onClick={() => toggleNotification(notif.id)}
                            className="ml-4 flex-shrink-0 cursor-pointer"
                          >
                            {notif.enabled ? (
                              <ToggleRight className="w-6 h-6 text-green-500" />
                            ) : (
                              <ToggleLeft className="w-6 h-6 text-gray-500" />
                            )}
                          </button>
                        ) : (
                          <div className="ml-4 flex-shrink-0">
                            {notif.enabled ? (
                              <ToggleRight className="w-6 h-6 text-green-500" />
                            ) : (
                              <ToggleLeft className="w-6 h-6 text-gray-500" />
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {}
            {activeSection === "security" && (
              <div className="space-y-6">
                <div className="bg-slate-800 rounded-xl border border-[#2B2B2B] p-6">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                    <Shield size={20} className="text-purple-500" />
                    <span>Security Settings</span>
                  </h2>

                  <div className="space-y-4">
                    {securitySettings.map((setting) => (
                      <div
                        key={setting.id}
                        className="p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-white flex items-center space-x-2">
                              <Lock size={16} className="text-yellow-500" />
                              <span>{setting.label}</span>
                            </h3>
                            <p className="text-sm text-gray-400 mt-1">
                              {setting.description}
                            </p>
                          </div>
                          {typeof setting.value === "boolean" ? (
                            isEditMode ? (
                              <button
                                onClick={() => toggleSecurity(setting.id)}
                                className="ml-4 flex-shrink-0 cursor-pointer"
                              >
                                {setting.value ? (
                                  <ToggleRight className="w-6 h-6 text-green-500" />
                                ) : (
                                  <ToggleLeft className="w-6 h-6 text-gray-500" />
                                )}
                              </button>
                            ) : (
                              <div className="ml-4 flex-shrink-0">
                                {setting.value ? (
                                  <ToggleRight className="w-6 h-6 text-green-500" />
                                ) : (
                                  <ToggleLeft className="w-6 h-6 text-gray-500" />
                                )}
                              </div>
                            )
                          ) : (
                            <span className="ml-4 px-3 py-1 bg-purple-600/20 text-purple-300 rounded text-sm font-medium">
                              {setting.value}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-400">
                        Security Notice
                      </p>
                      <p className="text-xs text-yellow-300 mt-1">
                        All admin actions are logged and monitored. Unauthorized
                        access attempts will be blocked immediately.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {}
            {activeSection === "system" && (
              <div className="space-y-6">
                <div className="bg-slate-800 rounded-xl border border-[#2B2B2B] p-6">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                    <Zap size={20} className="text-purple-500" />
                    <span>System Configuration</span>
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Max Upload Size
                      </label>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={systemSettings.maxUploadSize}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              maxUploadSize: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-slate-700 border border-[#2B2B2B] rounded-lg text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
                        />
                      ) : (
                        <div className="px-4 py-2 bg-slate-700/50 border border-[#2B2B2B] rounded-lg text-white">
                          {systemSettings.maxUploadSize}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Max Image Dimensions
                      </label>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={systemSettings.maxImageDimensions}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              maxImageDimensions: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-slate-700 border border-[#2B2B2B] rounded-lg text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
                        />
                      ) : (
                        <div className="px-4 py-2 bg-slate-700/50 border border-[#2B2B2B] rounded-lg text-white">
                          {systemSettings.maxImageDimensions}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Cache TTL
                      </label>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={systemSettings.cacheTTL}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              cacheTTL: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-slate-700 border border-[#2B2B2B] rounded-lg text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
                        />
                      ) : (
                        <div className="px-4 py-2 bg-slate-700/50 border border-[#2B2B2B] rounded-lg text-white">
                          {systemSettings.cacheTTL}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Backup Frequency
                      </label>
                      {isEditMode ? (
                        <select
                          value={systemSettings.backupFrequency}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              backupFrequency: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-slate-700 border border-[#2B2B2B] rounded-lg text-white focus:border-purple-500 focus:outline-none"
                        >
                          <option>Hourly</option>
                          <option>Daily</option>
                          <option>Weekly</option>
                          <option>Monthly</option>
                        </select>
                      ) : (
                        <div className="px-4 py-2 bg-slate-700/50 border border-[#2B2B2B] rounded-lg text-white">
                          {systemSettings.backupFrequency}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        API Rate Limit
                      </label>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={systemSettings.apiRateLimit}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              apiRateLimit: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-slate-700 border border-[#2B2B2B] rounded-lg text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
                        />
                      ) : (
                        <div className="px-4 py-2 bg-slate-700/50 border border-[#2B2B2B] rounded-lg text-white">
                          {systemSettings.apiRateLimit}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      <label className="block text-sm font-medium text-gray-300">
                        Maintenance Mode
                      </label>
                      {isEditMode ? (
                        <button
                          onClick={() =>
                            setSystemSettings({
                              ...systemSettings,
                              maintenanceMode: !systemSettings.maintenanceMode,
                            })
                          }
                        >
                          {systemSettings.maintenanceMode ? (
                            <ToggleRight className="w-6 h-6 text-green-500" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-gray-500" />
                          )}
                        </button>
                      ) : (
                        <div>
                          {systemSettings.maintenanceMode ? (
                            <ToggleRight className="w-6 h-6 text-green-500" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-gray-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {}
            {activeSection === "email" && (
              <div className="space-y-6">
                <div className="bg-slate-800 rounded-xl border border-[#2B2B2B] p-6">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                    <Mail size={20} className="text-purple-500" />
                    <span>Email Configuration</span>
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        SMTP Server
                      </label>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={emailSettings.smtpServer}
                          onChange={(e) =>
                            setEmailSettings({
                              ...emailSettings,
                              smtpServer: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-slate-700 border border-[#2B2B2B] rounded-lg text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
                        />
                      ) : (
                        <div className="px-4 py-2 bg-slate-700/50 border border-[#2B2B2B] rounded-lg text-white">
                          {emailSettings.smtpServer}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        SMTP Port
                      </label>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={emailSettings.smtpPort}
                          onChange={(e) =>
                            setEmailSettings({
                              ...emailSettings,
                              smtpPort: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-slate-700 border border-[#2B2B2B] rounded-lg text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
                        />
                      ) : (
                        <div className="px-4 py-2 bg-slate-700/50 border border-[#2B2B2B] rounded-lg text-white">
                          {emailSettings.smtpPort}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        From Email
                      </label>
                      {isEditMode ? (
                        <input
                          type="email"
                          value={emailSettings.fromEmail}
                          onChange={(e) =>
                            setEmailSettings({
                              ...emailSettings,
                              fromEmail: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-slate-700 border border-[#2B2B2B] rounded-lg text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
                        />
                      ) : (
                        <div className="px-4 py-2 bg-slate-700/50 border border-[#2B2B2B] rounded-lg text-white">
                          {emailSettings.fromEmail}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        From Name
                      </label>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={emailSettings.fromName}
                          onChange={(e) =>
                            setEmailSettings({
                              ...emailSettings,
                              fromName: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-slate-700 border border-[#2B2B2B] rounded-lg text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
                        />
                      ) : (
                        <div className="px-4 py-2 bg-slate-700/50 border border-[#2B2B2B] rounded-lg text-white">
                          {emailSettings.fromName}
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Reply To Email
                      </label>
                      {isEditMode ? (
                        <input
                          type="email"
                          value={emailSettings.replyTo}
                          onChange={(e) =>
                            setEmailSettings({
                              ...emailSettings,
                              replyTo: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-slate-700 border border-[#2B2B2B] rounded-lg text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
                        />
                      ) : (
                        <div className="px-4 py-2 bg-slate-700/50 border border-[#2B2B2B] rounded-lg text-white">
                          {emailSettings.replyTo}
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2 flex items-center space-x-3">
                      <label className="block text-sm font-medium text-gray-300">
                        Enable SSL/TLS
                      </label>
                      {isEditMode ? (
                        <button
                          onClick={() =>
                            setEmailSettings({
                              ...emailSettings,
                              enableSSL: !emailSettings.enableSSL,
                            })
                          }
                        >
                          {emailSettings.enableSSL ? (
                            <ToggleRight className="w-6 h-6 text-green-500" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-gray-500" />
                          )}
                        </button>
                      ) : (
                        <div>
                          {emailSettings.enableSSL ? (
                            <ToggleRight className="w-6 h-6 text-green-500" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-gray-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {}
            {isEditMode && (
              <div className="sticky bottom-0 mt-8 pt-6 border-t border-[#2B2B2B] bg-gradient-to-t from-[#0e0e0e] to-transparent">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleEditToggle}
                    className="flex items-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    <X size={20} />
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                  >
                    <Save size={20} />
                    <span>{isSaving ? "Saving..." : "Save Settings"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}