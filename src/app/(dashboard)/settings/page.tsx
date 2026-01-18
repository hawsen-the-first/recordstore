"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Settings, CheckCircle, XCircle, Loader2, Server, Key, Folder, AudioLines } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface LidarrOptions {
  rootFolders: Array<{ id: number; path: string }>;
  qualityProfiles: Array<{ id: number; name: string }>;
  metadataProfiles: Array<{ id: number; name: string }>;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [rootFolder, setRootFolder] = useState("");
  const [qualityProfile, setQualityProfile] = useState("");
  const [metadataProfile, setMetadataProfile] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    success: boolean;
    version?: string;
    error?: string;
  } | null>(null);
  const [options, setOptions] = useState<LidarrOptions | null>(null);

  // Redirect non-admins
  useEffect(() => {
    if (session && session.user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [session, router]);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const response = await fetch("/api/settings/lidarr");
      if (response.ok) {
        const data = await response.json();
        setUrl(data.lidarr_url || "");
        setApiKey(data.lidarr_api_key || "");
        setRootFolder(data.lidarr_root_folder || "");
        setQualityProfile(data.lidarr_quality_profile || "");
        setMetadataProfile(data.lidarr_metadata_profile || "");
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleTestConnection = async () => {
    setIsTesting(true);
    setConnectionStatus(null);

    // Save first to test with current values
    await handleSave(true);

    try {
      const response = await fetch("/api/settings/lidarr", { method: "PUT" });
      const data = await response.json();

      setConnectionStatus({
        tested: true,
        success: data.success,
        version: data.version,
        error: data.error,
      });

      if (data.success) {
        setOptions({
          rootFolders: data.rootFolders || [],
          qualityProfiles: data.qualityProfiles || [],
          metadataProfiles: data.metadataProfiles || [],
        });
      }
    } catch (error) {
      setConnectionStatus({
        tested: true,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (silent = false) => {
    if (!silent) setIsSaving(true);

    try {
      const response = await fetch("/api/settings/lidarr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          apiKey,
          rootFolder,
          qualityProfile,
          metadataProfile,
        }),
      });

      if (response.ok && !silent) {
        // Show success briefly
        alert("Settings saved successfully");
      }
    } catch (error) {
      console.error("Save error:", error);
      if (!silent) {
        alert("Failed to save settings");
      }
    } finally {
      if (!silent) setIsSaving(false);
    }
  };

  if (session?.user?.role !== "ADMIN") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-2">
          Configure Lidarr integration to automatically add requested music
        </p>
      </div>

      {/* Lidarr Configuration */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <AudioLines className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Lidarr</h2>
              <p className="text-sm text-gray-400">
                Connect to your Lidarr instance
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Connection Status */}
          {connectionStatus?.tested && (
            <div
              className={cn(
                "p-4 rounded-lg flex items-center gap-3",
                connectionStatus.success
                  ? "bg-green-500/10 border border-green-500/20"
                  : "bg-red-500/10 border border-red-500/20"
              )}
            >
              {connectionStatus.success ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-green-500 font-medium">Connected</p>
                    {connectionStatus.version && (
                      <p className="text-sm text-green-400">
                        Lidarr v{connectionStatus.version}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-red-500 font-medium">Connection Failed</p>
                    <p className="text-sm text-red-400">
                      {connectionStatus.error}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* URL */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <Server className="h-4 w-4" />
              Lidarr URL
            </label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://localhost:8686"
            />
            <p className="text-xs text-gray-500">
              The URL of your Lidarr instance (e.g., http://localhost:8686)
            </p>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <Key className="h-4 w-4" />
              API Key
            </label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Your Lidarr API key"
            />
            <p className="text-xs text-gray-500">
              Found in Lidarr → Settings → General → API Key
            </p>
          </div>

          {/* Test Connection Button */}
          <Button
            onClick={handleTestConnection}
            disabled={isTesting || !url || !apiKey}
            variant="outline"
            className="w-full"
          >
            {isTesting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <Settings className="h-4 w-4 mr-2" />
                Test Connection
              </>
            )}
          </Button>

          {/* Profile Options (shown after successful connection test) */}
          {options && (
            <>
              <hr className="border-gray-700" />

              {/* Root Folder */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <Folder className="h-4 w-4" />
                  Root Folder
                </label>
                <select
                  value={rootFolder}
                  onChange={(e) => setRootFolder(e.target.value)}
                  className="w-full h-10 rounded-md border border-gray-600 bg-gray-800 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a root folder</option>
                  {options.rootFolders.map((folder) => (
                    <option key={folder.id} value={folder.path}>
                      {folder.path}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quality Profile */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  Quality Profile
                </label>
                <select
                  value={qualityProfile}
                  onChange={(e) => setQualityProfile(e.target.value)}
                  className="w-full h-10 rounded-md border border-gray-600 bg-gray-800 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a quality profile</option>
                  {options.qualityProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Metadata Profile */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  Metadata Profile
                </label>
                <select
                  value={metadataProfile}
                  onChange={(e) => setMetadataProfile(e.target.value)}
                  className="w-full h-10 rounded-md border border-gray-600 bg-gray-800 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a metadata profile</option>
                  {options.metadataProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        {/* Save Button */}
        <div className="p-4 border-t border-gray-700 bg-gray-850">
          <Button
            onClick={() => handleSave()}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
