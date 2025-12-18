"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Issue } from "./admin-types";

interface AdminAnalyticsProps {
    issues: Issue[];
}

export const AdminAnalytics = ({ issues }: AdminAnalyticsProps) => {
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
                                        <span className="text-sm capitalize">{item.priority}</span>
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
                                                    width: `${(item.issues /
                                                            Math.max(...monthly.map((i) => i.issues || 1))) *
                                                        100
                                                        }%`,
                                                }}
                                            />
                                        </div>
                                        <div className="flex-1 bg-muted rounded-full h-2">
                                            <div
                                                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${(item.resolved /
                                                            Math.max(...monthly.map((i) => i.issues || 1))) *
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
