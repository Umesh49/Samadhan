"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Activity,
    TrendingUp,
    Users,
    Calendar,
    AlertTriangle,
    BarChart3,
    Download,
    Building,
    Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SystemHealth, AdminStats, Issue, User } from "./admin-types";
import DashboardStats from "@/components/dashboard-stats";

interface AdminOverviewProps {
    systemHealth: SystemHealth;
    stats: AdminStats;
    issues: Issue[];
    users: User[];
    setActiveTab: (tab: string) => void;
    getStatusColor: (status: string) => string;
}

export const AdminOverview = ({
    systemHealth,
    stats,
    issues,
    users,
    setActiveTab,
    getStatusColor,
}: AdminOverviewProps) => {
    // CSV helpers
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

    return (
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
};
