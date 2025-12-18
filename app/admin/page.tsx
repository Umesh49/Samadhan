"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, AlertTriangle, Crown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Subcomponents
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminOverview } from "@/components/admin/admin-overview";
import { AdminIssues } from "@/components/admin/admin-issues";
import { AdminUsers } from "@/components/admin/admin-users";
import { AdminAnalytics } from "@/components/admin/admin-analytics";
import { User, Issue, AdminStats } from "@/components/admin/admin-types";

export default function AdminDashboard() {
  // basic state
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    total: 0,
    reported: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0,
  });
  const [systemHealth, setSystemHealth] = useState({
    uptime: "99.9%",
    responseTime: "142ms",
    activeUsers: 0,
    issuesThisWeek: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(""); // Shared search term if needed

  // --- lifecycle: init & realtime ---
  useEffect(() => {
    let cleanupFn: (() => void) | null = null;

    const initialize = async () => {
      try {
        setError(null);
        const supabase = createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) throw new Error("No authenticated user found");

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (profileError) throw profileError;
        if (!["admin", "super_admin"].includes(profile.user_type))
          throw new Error("Unauthorized: Admin access required");
        setCurrentUser(profile);

        await Promise.all([fetchUsers(), fetchIssues(), fetchSystemHealth()]);
        computeStatsFromIssues();
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Initialization failed");
      } finally {
        setIsLoading(false);
      }
    };

    initialize()
      .then(() => {
        cleanupFn = initRealtime();
      })
      .catch((e) => console.error(e));

    return () => {
      if (cleanupFn) cleanupFn();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- fetchers ---
  const fetchUsers = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setUsers((data as User[]) || []);
    } catch (err) {
      console.error("fetchUsers:", err);
    }
  };

  const fetchIssues = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("issues")
        .select("*, profiles!issues_reporter_id_fkey(full_name,email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setIssues((data as Issue[]) || []);
      computeStatsFromIssues((data as Issue[]) || []);
    } catch (err) {
      console.error("fetchIssues:", err);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const supabase = createClient();
      const { count: userCount, error: userErr } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      if (userErr) throw userErr;
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const { count: weeklyIssues, error: issuesErr } = await supabase
        .from("issues")
        .select("*", { count: "exact", head: true })
        .gte("created_at", oneWeekAgo.toISOString());
      if (issuesErr) throw issuesErr;
      setSystemHealth((s) => ({
        ...s,
        activeUsers: userCount || 0,
        issuesThisWeek: weeklyIssues || 0,
      }));
    } catch (err) {
      console.error("fetchSystemHealth:", err);
    }
  };

  const computeStatsFromIssues = (list?: Issue[]) => {
    const arr = list ?? issues;
    const newStats = arr.reduce(
      (acc: any, i: Issue) => {
        acc.total++;
        switch (i.status) {
          case "reported":
            acc.reported++;
            break;
          case "in_progress":
            acc.inProgress++;
            break;
          case "resolved":
            acc.resolved++;
            break;
          case "rejected":
            acc.rejected++;
            break;
        }
        return acc;
      },
      { total: 0, reported: 0, inProgress: 0, resolved: 0, rejected: 0 }
    );
    setStats(newStats);
  };

  // --- realtime ---
  const initRealtime = () => {
    const supabase = createClient();

    const issuesChannel = supabase
      .channel("admin_new_issues")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "issues" },
        (payload: any) => {
          setNotifications((prev) =>
            [
              {
                id: `issue-${payload.new.id}`,
                title: "New Issue Reported",
                message: `${payload.new.title} - ${payload.new.category}`,
                type: "info",
                timestamp: new Date(),
                read: false,
              },
              ...prev,
            ].slice(0, 50)
          );
          fetchIssues();
        }
      )
      .subscribe();

    const updatesChannel = supabase
      .channel("admin_issue_updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "issues" },
        (payload: any) => {
          if (payload.old?.status !== payload.new?.status) {
            setNotifications((prev) =>
              [
                {
                  id: `update-${payload.new.id}-${Date.now()}`,
                  title: "Issue Status Updated",
                  message: `${payload.new.title
                    } is now ${payload.new.status.replace("_", " ")}`,
                  type: "success",
                  timestamp: new Date(),
                  read: false,
                },
                ...prev,
              ].slice(0, 50)
            );
          }
          fetchIssues();
        }
      )
      .subscribe();

    const usersChannel = supabase
      .channel("admin_new_users")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "profiles" },
        (payload: any) => {
          if (payload.new.user_type === "government") {
            setNotifications((prev) =>
              [
                {
                  id: `user-${payload.new.id}`,
                  title: "New Government User",
                  message: `${payload.new.full_name} registered for approval`,
                  type: "warning",
                  timestamp: new Date(),
                  read: false,
                },
                ...prev,
              ].slice(0, 50)
            );
          }
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(issuesChannel);
        supabase.removeChannel(updatesChannel);
        supabase.removeChannel(usersChannel);
      } catch (err) {
        console.warn("Error cleaning realtime channels", err);
      }
    };
  };

  // Helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case "reported":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      case "resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  };

  // Render Loading/Error
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Access Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button
              onClick={() => (window.location.href = "/")}
              className="w-full"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        notifications={notifications}
        setNotifications={setNotifications}
        isMobileNavOpen={isMobileNavOpen}
        setIsMobileNavOpen={setIsMobileNavOpen}
      />

      {/* Mobile Drawer (optional, mostly handled in AdminNav but drawer overlay relies on state here or there) 
          To keep it clean, we can rely on AdminNav's mobile handling or pass state.
          Here we are passing state to AdminNav.
      */}

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {activeTab === "dashboard" && (
          <AdminOverview
            systemHealth={systemHealth}
            stats={stats}
            issues={issues}
            users={users}
            setActiveTab={setActiveTab}
            getStatusColor={getStatusColor}
          />
        )}
        {activeTab === "issues" && (
          <AdminIssues
            issues={issues}
            users={users}
            currentUser={currentUser}
            refreshIssues={fetchIssues}
            globalSearchTerm={searchTerm}
          />
        )}
        {activeTab === "users" && (
          <AdminUsers
            users={users}
            currentUser={currentUser}
            refreshUsers={fetchUsers}
          />
        )}
        {activeTab === "analytics" && <AdminAnalytics issues={issues} />}
      </div>

      <div className="fixed bottom-4 right-4 z-50">
        <Badge variant="default" className="flex items-center gap-2 shadow-lg">
          <Activity className="w-3 h-3" />
          <span>Live</span>
        </Badge>
      </div>
    </div>
  );
}
