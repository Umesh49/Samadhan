// app/admin/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import {
  Crown,
  LogOut,
  Shield,
  Home,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Search,
  Users,
  BarChart3,
  Trash2,
  Edit,
  Download,
  Calendar,
  TrendingUp,
  Activity,
  Building,
  Phone,
  Mail,
  Bell,
  Info,
  Menu,
  X,
  MapPin,
} from "lucide-react";

// existing components
import DashboardStats from "@/components/dashboard-stats";
import IssuesList from "@/components/issues-list";

interface User {
  id: string;
  email: string;
  full_name: string;
  user_type: string;
  organization?: string;
  approval_status: string;
  created_at: string;
  updated_at?: string;
  approved_by?: string;
  approved_at?: string | null;
  rejection_reason?: string;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  photo_url?: string;
  reporter_id?: string;
  assigned_to?: string | null;
  created_at: string;
  updated_at?: string;
  resolved_at?: string | null;
  profiles?: { full_name: string; email: string };
}

export default function AdminDashboard() {
  // basic state
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [stats, setStats] = useState({
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

  // delete / edit flow
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [issueToDelete, setIssueToDelete] = useState<Issue | null>(null);
  const [showIssueDeleteDialog, setShowIssueDeleteDialog] = useState(false);

  // edit modals
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [isEditIssueOpen, setIsEditIssueOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // search / filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [userTypeFilter, setUserTypeFilter] = useState("all");

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
                  message: `${
                    payload.new.title
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

  // --- admin actions: edit/delete users & issues ---
  const openEditUser = (u: User) => {
    setEditingUser(u);
    setIsEditUserOpen(true);
  };
  const closeEditUser = () => {
    setEditingUser(null);
    setIsEditUserOpen(false);
  };

  const saveUserEdits = async (updates: Partial<User>) => {
    if (!editingUser || !currentUser) return;
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", editingUser.id);
      if (error) throw error;

      await supabase.from("admin_actions").insert({
        admin_id: currentUser.id,
        action_type: "update_user",
        target_id: editingUser.id,
        details: updates,
      });

      await fetchUsers();
      closeEditUser();
    } catch (err) {
      console.error("saveUserEdits:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = (u: User) => {
    setUserToDelete(u);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete || !currentUser) return;
    setIsDeleting(true);
    try {
      const supabase = createClient();
      await supabase.from("admin_actions").insert({
        admin_id: currentUser.id,
        action_type: "delete_user",
        target_id: userToDelete.id,
        details: { deleted_user: userToDelete },
      });
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userToDelete.id);
      if (error) throw error;
      setUsers((prev) => prev.filter((p) => p.id !== userToDelete.id));
      setShowDeleteDialog(false);
      setUserToDelete(null);
    } catch (err) {
      console.error("confirmDelete:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // issues edit/delete
  const openEditIssue = (i: Issue) => {
    setEditingIssue(i);
    setIsEditIssueOpen(true);
  };
  const closeEditIssue = () => {
    setEditingIssue(null);
    setIsEditIssueOpen(false);
  };

  const saveIssueEdits = async (updates: Partial<Issue>) => {
    if (!editingIssue || !currentUser) return;
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("issues")
        .update(updates)
        .eq("id", editingIssue.id);
      if (error) throw error;

      await supabase.from("admin_actions").insert({
        admin_id: currentUser.id,
        action_type: "assign_issue",
        target_id: editingIssue.id,
        details: updates,
      });

      await fetchIssues();
      closeEditIssue();
    } catch (err) {
      console.error("saveIssueEdits:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteIssue = (i: Issue) => {
    setIssueToDelete(i);
    setShowIssueDeleteDialog(true);
  };

  const confirmDeleteIssue = async () => {
    if (!issueToDelete || !currentUser) return;
    setIsDeleting(true);
    try {
      const supabase = createClient();
      await supabase.from("admin_actions").insert({
        admin_id: currentUser.id,
        action_type: "delete_issue",
        target_id: issueToDelete.id,
        details: { issue: issueToDelete },
      });
      const { error } = await supabase
        .from("issues")
        .delete()
        .eq("id", issueToDelete.id);
      if (error) throw error;
      setIssues((prev) => prev.filter((it) => it.id !== issueToDelete.id));
      setShowIssueDeleteDialog(false);
      setIssueToDelete(null);
    } catch (err) {
      console.error("confirmDeleteIssue:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // --- helpers for UI & analytics ---
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

  const getPriorityColorClass = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getIssuesByCategory = (arr: Issue[]) => {
    const categories: Record<string, number> = {};
    arr.forEach((i) => {
      categories[i.category] = (categories[i.category] || 0) + 1;
    });
    const total = arr.length;
    return Object.entries(categories)
      .map(([category, count]) => ({
        category,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  };

  const getIssuesByPriority = (arr: Issue[]) => {
    const priorities: Record<string, number> = {};
    arr.forEach((i) => {
      priorities[i.priority] = (priorities[i.priority] || 0) + 1;
    });
    return [
      {
        priority: "urgent",
        count: priorities.urgent || 0,
        color: "bg-red-500",
      },
      { priority: "high", count: priorities.high || 0, color: "bg-orange-500" },
      {
        priority: "medium",
        count: priorities.medium || 0,
        color: "bg-yellow-500",
      },
      { priority: "low", count: priorities.low || 0, color: "bg-green-500" },
    ];
  };

  const getMonthlyTrends = (arr: Issue[]) => {
    const now = new Date();
    const months: { month: string; issues: number; resolved: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString("en-US", { month: "long" });
      const monthIssues = arr.filter((issue) => {
        const d = new Date(issue.created_at);
        return (
          d.getMonth() === date.getMonth() &&
          d.getFullYear() === date.getFullYear()
        );
      });
      months.push({
        month: i === 0 ? "Current" : monthName,
        issues: monthIssues.length,
        resolved: monthIssues.filter((s) => s.status === "resolved").length,
      });
    }
    return months;
  };

  // CSV helpers (downloadCSV used in several places -> ensures the identifier exists)
  const convertToCSV = (data: any[]) => {
    if (!data || data.length === 0) return "";
    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers
        .map((h) => {
          const v = row[h];
          if (v === null || v === undefined) return "";
          const s = typeof v === "string" ? v.replace(/"/g, '""') : String(v);
          return typeof v === "string" && s.includes(",") ? `"${s}"` : s;
        })
        .join(",")
    );
    return [headers.join(","), ...rows].join("\n");
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    if (!csvContent) return;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- UI subcomponents: Nav & Notifications ---
  const CustomNotificationBell = () => {
    const [open, setOpen] = useState(false);
    useEffect(() => {
      // no-op, just to refresh unread count if needed
    }, [notifications]);
    const unreadCount = notifications.filter((n) => !n.read).length;
    const markAllRead = () =>
      setNotifications((prev) => prev.map((p) => ({ ...p, read: true })));
    return (
      <div className="relative">
        <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)}>
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>

        {open && (
          <>
            <div
              className="fixed inset-0 z-40 lg:hidden"
              onClick={() => setOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-card border border-border rounded-lg shadow-lg z-50">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllRead}>
                    Mark all read
                  </Button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b border-border cursor-pointer hover:bg-muted transition-colors ${
                        !notification.read
                          ? "bg-blue-50 dark:bg-blue-950/20"
                          : ""
                      }`}
                      onClick={() =>
                        setNotifications((prev) =>
                          prev.map((n) =>
                            n.id === notification.id ? { ...n, read: true } : n
                          )
                        )
                      }
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <Info className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground truncate">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Just now
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="w-full text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const AdminNav = () => {
    const handleLogout = async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/";
    };

    const navItems = [
      { key: "dashboard", label: "Dashboard", icon: Shield },
      { key: "issues", label: "Issues", icon: AlertTriangle },
      { key: "users", label: "Users", icon: Users },
      { key: "analytics", label: "Analytics", icon: BarChart3 },
    ];

    return (
      <nav className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-primary">
                <Crown className="w-6 h-6" />
                <span className="font-bold text-lg">Samadhan Admin</span>
              </div>

              <div className="hidden lg:flex items-center gap-2">
                {navItems.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                      activeTab === key
                        ? "text-foreground bg-muted"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{label}</span>
                  </button>
                ))}

                <button
                  onClick={() => window.open("/", "_blank")}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground px-3 py-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  <span className="text-sm">Public Site</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <CustomNotificationBell />

              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium text-foreground">
                  {currentUser?.full_name || "Admin User"}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {currentUser?.user_type === "super_admin"
                    ? "Super Admin"
                    : "Admin"}
                </Badge>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hidden sm:flex text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileNavOpen((v) => !v)}
                className="lg:hidden"
                aria-label="Open mobile menu"
              >
                {isMobileNavOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>
    );
  };

  // ---- content components ----

  const DashboardContent = () => (
    <div className="space-y-6">
      <DashboardStats />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth.uptime}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemHealth.responseTime}
            </div>
            <p className="text-xs text-muted-foreground">Average response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Registered citizens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemHealth.issuesThisWeek}
            </div>
            <p className="text-xs text-muted-foreground">New reports</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => setActiveTab("issues")}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <AlertTriangle className="w-6 h-6" />
              <span className="text-sm">Review Issues</span>
            </Button>

            <Button
              onClick={() => setActiveTab("users")}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Users className="w-6 h-6" />
              <span className="text-sm">Manage Users</span>
            </Button>

            <Button
              onClick={() => setActiveTab("analytics")}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <BarChart3 className="w-6 h-6" />
              <span className="text-sm">View Analytics</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={async () => {
                try {
                  const supabase = createClient();
                  const { data } = await supabase.from("issues").select("*");
                  const csv = convertToCSV(data || []);
                  downloadCSV(csv, "issues_export.csv");
                } catch (err) {
                  console.error("Export error:", err);
                }
              }}
            >
              <Download className="w-6 h-6" />
              <span className="text-sm">Export Data</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {issues.slice(0, 5).map((issue) => (
                <div
                  key={issue.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <img
                    src={issue.photo_url || "/placeholder.svg"}
                    alt={issue.title}
                    className="w-10 h-10 object-cover rounded-md flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {issue.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {issue.address}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={getStatusColor(issue.status)}
                  >
                    {issue.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-600" />
                  <span className="text-sm">System Status</span>
                </div>
                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                >
                  Online
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Total Users</span>
                </div>
                <span className="text-sm font-medium">{users.length}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-purple-600" />
                  <span className="text-sm">Government Users</span>
                </div>
                <span className="text-sm font-medium">
                  {
                    users.filter(
                      (u) =>
                        u.user_type === "government" || u.user_type === "admin"
                    ).length
                  }
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-sm">Pending Issues</span>
                </div>
                <span className="text-sm font-medium">
                  {stats.reported + stats.inProgress}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // --- Paginated Issues list to avoid rendering "too many issues" ---
  const IssuesContent = () => {
    const [localSearch, setLocalSearch] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    const q = (localSearch || searchTerm).toLowerCase();
    const filtered = issues.filter((issue) => {
      return (
        issue.title.toLowerCase().includes(q) ||
        (issue.description || "").toLowerCase().includes(q) ||
        (issue.address || "").toLowerCase().includes(q) ||
        (issue.category || "").toLowerCase().includes(q)
      );
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const pageSlice = filtered.slice((page - 1) * perPage, page * perPage);

    useEffect(() => {
      if (page > totalPages) setPage(totalPages);
    }, [filtered.length, perPage, totalPages]);

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span>Issues Management ({issues.length})</span>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search issues..."
                  value={localSearch}
                  onChange={(e) => {
                    setLocalSearch(e.target.value);
                    setPage(1);
                  }}
                  className="max-w-xs"
                />
                <Select
                  value={String(perPage)}
                  onValueChange={(v) => {
                    setPerPage(Number(v));
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const supabase = createClient();
                      const { data } = await supabase
                        .from("issues")
                        .select("*");
                      const csv = convertToCSV(data || []);
                      downloadCSV(csv, "issues_export.csv");
                    } catch (err) {
                      console.error("Export error:", err);
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent>
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No issues match your search / filters</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pageSlice.map((issue) => (
                  <Card key={issue.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0">
                            <img
                              src={issue.photo_url || "/placeholder.svg"}
                              alt={issue.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-base truncate">
                              {issue.title}
                            </h3>
                            <div className="flex flex-col gap-2 mt-1">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">
                                  {issue.address}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-3 h-3 flex-shrink-0" />
                                <span>
                                  Reported{" "}
                                  {new Date(issue.created_at).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 items-start sm:items-center">
                          <Badge
                            variant="outline"
                            className={getStatusColor(issue.status)}
                          >
                            {issue.status.replace("_", " ")}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={getPriorityColorClass(issue.priority)}
                          >
                            {issue.priority}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditIssue(issue)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteIssue(issue)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * perPage + 1} -{" "}
                    {Math.min(page * perPage, filtered.length)} of{" "}
                    {filtered.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Prev
                    </Button>
                    <div className="text-sm">
                      Page {page} / {totalPages}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // --- Users content (includes edit & delete flows) ---
  const UsersContent = () => {
    const q = searchTerm.toLowerCase();
    const filteredUsers = users.filter((user) => {
      const matchesSearch =
        (user.full_name || "").toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q);
      const matchesType =
        userTypeFilter === "all" || user.user_type === userTypeFilter;
      const matchesStatus =
        statusFilter === "all" || user.approval_status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });

    const updateUserApprovalStatus = async (userId: string, status: string) => {
      if (!currentUser) return;
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from("profiles")
          .update({
            approval_status: status,
            approved_by: currentUser.id,
            approved_at:
              status === "approved" ? new Date().toISOString() : null,
          })
          .eq("id", userId);
        if (error) throw error;
        await supabase.from("admin_actions").insert({
          admin_id: currentUser.id,
          action_type: status === "approved" ? "approve_user" : "reject_user",
          target_id: userId,
        });
        await fetchUsers();
      } catch (err) {
        console.error("updateUserApprovalStatus:", err);
      }
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Users Management ({filteredUsers.length})</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="citizen">Citizens</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Button
                className="w-full"
                onClick={async () => {
                  try {
                    const csv = convertToCSV(filteredUsers as any[]);
                    downloadCSV(csv, "users_export.csv");
                  } catch (err) {
                    console.error("Export error:", err);
                  }
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Users
              </Button>
            </div>

            <div className="space-y-4">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No users found matching your criteria</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <Card key={user.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-base">
                              {user.full_name || "Unnamed User"}
                            </h3>
                            <div className="flex flex-col gap-2 mt-1">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{user.email}</span>
                              </div>
                              {user.organization && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Building className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">
                                    {user.organization}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-3 h-3 flex-shrink-0" />
                                <span>
                                  Joined{" "}
                                  {new Date(
                                    user.created_at
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="capitalize">
                              {user.user_type.replace("_", " ")}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={
                                user.approval_status === "approved"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                  : user.approval_status === "pending"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                              }
                            >
                              {user.approval_status}
                            </Badge>
                          </div>

                          <div className="flex gap-1">
                            {user.approval_status === "pending" &&
                              user.user_type === "government" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      updateUserApprovalStatus(
                                        user.id,
                                        "approved"
                                      )
                                    }
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      updateUserApprovalStatus(
                                        user.id,
                                        "rejected"
                                      )
                                    }
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditUser(user)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>

                            {user.user_type !== "super_admin" &&
                              user.id !== currentUser?.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <AlertDialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Edit User</AlertDialogTitle>
              <AlertDialogDescription>
                Update user details and approval status.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="p-4 space-y-3">
              <Input
                value={editingUser?.full_name || ""}
                onChange={(e) =>
                  setEditingUser((p) =>
                    p ? { ...p, full_name: e.target.value } : p
                  )
                }
                placeholder="Full name"
              />
              <Input
                value={editingUser?.email || ""}
                onChange={(e) =>
                  setEditingUser((p) =>
                    p ? { ...p, email: e.target.value } : p
                  )
                }
                placeholder="Email"
              />
              <Select
                value={editingUser?.user_type || "citizen"}
                onValueChange={(val) =>
                  setEditingUser((p) => (p ? { ...p, user_type: val } : p))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="citizen">Citizen</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={editingUser?.approval_status || "approved"}
                onValueChange={(val) =>
                  setEditingUser((p) =>
                    p ? { ...p, approval_status: val } : p
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Input
                value={editingUser?.organization || ""}
                onChange={(e) =>
                  setEditingUser((p) =>
                    p ? { ...p, organization: e.target.value } : p
                  )
                }
                placeholder="Organization"
              />
              <Input
                value={editingUser?.rejection_reason || ""}
                onChange={(e) =>
                  setEditingUser((p) =>
                    p ? { ...p, rejection_reason: e.target.value } : p
                  )
                }
                placeholder="Rejection reason (optional)"
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={closeEditUser}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  saveUserEdits({
                    full_name: editingUser?.full_name,
                    email: editingUser?.email,
                    user_type: editingUser?.user_type,
                    organization: editingUser?.organization,
                    approval_status: editingUser?.approval_status,
                    rejection_reason: editingUser?.rejection_reason,
                  })
                }
                disabled={isSaving}
              >
                {isSaving ? "Saving…" : "Save"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete User Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{" "}
                {userToDelete?.full_name || "this user"}? This action cannot be
                undone. Their reports will be archived but preserved for
                records.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting…" : "Delete User"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  };

  // --- Analytics content ---
  const AnalyticsContent = () => {
    const total = issues.length;
    const resolvedCount = issues.filter((i) => i.status === "resolved").length;
    const resolutionRate = total > 0 ? (resolvedCount / total) * 100 : 0;

    const responseTimes = issues
      .map((i) => {
        if (i.resolved_at) {
          return (
            (new Date(i.resolved_at).getTime() -
              new Date(i.created_at).getTime()) /
            (1000 * 60 * 60)
          );
        }
        return null;
      })
      .filter(Boolean) as number[];
    const avgResponse = responseTimes.length
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    const issuesByCategory = getIssuesByCategory(issues);
    const issuesByPriority = getIssuesByPriority(issues);
    const monthly = getMonthlyTrends(issues);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Resolution Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {resolutionRate.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {resolvedCount} of {total} issues resolved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Average Resolution Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {avgResponse ? `${avgResponse.toFixed(1)}h` : "—"}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Avg time from report to resolution
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Open Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {
                  issues.filter(
                    (i) => i.status !== "resolved" && i.status !== "rejected"
                  ).length
                }
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Pending or In progress
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Issues by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {issuesByCategory.map((item) => (
                <div key={item.category} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">
                      {item.category.replace("_", " ")}
                    </span>
                    <span>
                      {item.count} ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Issues by Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {issuesByPriority.map((item) => (
                  <div
                    key={item.priority}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span className="text-sm capitalize">
                        {item.priority}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthly.map((item) => (
                  <div key={item.month} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{item.month}</span>
                      <span>
                        {item.resolved}/{item.issues} resolved
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              (item.issues /
                                Math.max(
                                  ...monthly.map((i) => i.issues || 1)
                                )) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              (item.resolved /
                                Math.max(
                                  ...monthly.map((i) => i.issues || 1)
                                )) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // ---- render & dialogs ----
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
      <AdminNav />

      {/* mobile drawer */}
      {isMobileNavOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <div className="fixed top-0 right-0 h-full w-72 bg-card z-50 shadow-lg p-4 lg:hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                <span className="font-semibold">Samadhan</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileNavOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setActiveTab("dashboard");
                    setIsMobileNavOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-3 py-2 rounded-md transition-colors ${
                    activeTab === "dashboard"
                      ? "text-foreground bg-muted"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("issues");
                    setIsMobileNavOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-3 py-2 rounded-md transition-colors ${
                    activeTab === "issues"
                      ? "text-foreground bg-muted"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span>Issues</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("users");
                    setIsMobileNavOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-3 py-2 rounded-md transition-colors ${
                    activeTab === "users"
                      ? "text-foreground bg-muted"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span>Users</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("analytics");
                    setIsMobileNavOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-3 py-2 rounded-md transition-colors ${
                    activeTab === "analytics"
                      ? "text-foreground bg-muted"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <BarChart3 className="w-5 h-5" />
                  <span>Analytics</span>
                </button>
              </div>

              <div className="border-t border-border pt-2 mt-2">
                <div className="px-2 py-2 text-sm">
                  <div className="font-medium text-foreground">
                    {currentUser?.full_name || "Admin User"}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {currentUser?.user_type === "super_admin"
                      ? "Super Admin"
                      : "Admin"}
                  </div>
                </div>

                <button
                  onClick={async () => {
                    const supabase = createClient();
                    await supabase.auth.signOut();
                    window.location.href = "/";
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {activeTab === "dashboard" && <DashboardContent />}
        {activeTab === "issues" && <IssuesContent />}
        {activeTab === "users" && <UsersContent />}
        {activeTab === "analytics" && <AnalyticsContent />}
      </div>

      {/* issue delete dialog */}
      <AlertDialog
        open={showIssueDeleteDialog}
        onOpenChange={setShowIssueDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Issue</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the issue "{issueToDelete?.title}
              "? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowIssueDeleteDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteIssue}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete Issue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="fixed bottom-4 right-4 z-50">
        <Badge variant="default" className="flex items-center gap-2 shadow-lg">
          <Activity className="w-3 h-3" />
          <span>Live</span>
        </Badge>
      </div>

      {/* Edit Issue Dialog */}
      <AlertDialog open={isEditIssueOpen} onOpenChange={setIsEditIssueOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Issue</AlertDialogTitle>
            <AlertDialogDescription>
              Modify issue details and assignment.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="p-4 space-y-3">
            <Input
              value={editingIssue?.title || ""}
              onChange={(e) =>
                setEditingIssue((p) =>
                  p ? { ...p, title: e.target.value } : p
                )
              }
              placeholder="Title"
            />
            <Input
              value={editingIssue?.description || ""}
              onChange={(e) =>
                setEditingIssue((p) =>
                  p ? { ...p, description: e.target.value } : p
                )
              }
              placeholder="Description"
            />
            <Select
              value={editingIssue?.category || "pothole"}
              onValueChange={(v) =>
                setEditingIssue((p) => (p ? { ...p, category: v } : p))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pothole">Pothole</SelectItem>
                <SelectItem value="streetlight">Streetlight</SelectItem>
                <SelectItem value="sidewalk">Sidewalk</SelectItem>
                <SelectItem value="traffic_sign">Traffic Sign</SelectItem>
                <SelectItem value="drainage">Drainage</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={editingIssue?.status || "reported"}
              onValueChange={(v) =>
                setEditingIssue((p) => (p ? { ...p, status: v } : p))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reported">Reported</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={editingIssue?.priority || "medium"}
              onValueChange={(v) =>
                setEditingIssue((p) => (p ? { ...p, priority: v } : p))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={editingIssue?.assigned_to ?? "unassigned"}
              onValueChange={(v) =>
                setEditingIssue((prev) =>
                  prev
                    ? { ...prev, assigned_to: v === "unassigned" ? null : v }
                    : prev
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Assign to" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {users
                  .filter(
                    (u) =>
                      u.user_type === "government" || u.user_type === "admin"
                  )
                  .map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Input
              value={editingIssue?.address || ""}
              onChange={(e) =>
                setEditingIssue((p) =>
                  p ? { ...p, address: e.target.value } : p
                )
              }
              placeholder="Address"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeEditIssue}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                saveIssueEdits({
                  title: editingIssue?.title,
                  description: editingIssue?.description,
                  category: editingIssue?.category,
                  status: editingIssue?.status,
                  priority: editingIssue?.priority,
                  assigned_to: editingIssue?.assigned_to,
                  address: editingIssue?.address,
                })
              }
              disabled={isSaving}
            >
              {isSaving ? "Saving…" : "Save"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
