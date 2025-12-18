"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Download,
    AlertTriangle,
    MapPin,
    Calendar,
    Edit,
    Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Issue, User } from "./admin-types";

interface AdminIssuesProps {
    issues: Issue[];
    users: User[];
    currentUser: User | null;
    refreshIssues: () => Promise<void>;
    globalSearchTerm: string;
}

export const AdminIssues = ({
    issues,
    users,
    currentUser,
    refreshIssues,
    globalSearchTerm,
}: AdminIssuesProps) => {
    const [localSearch, setLocalSearch] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
    const [isEditIssueOpen, setIsEditIssueOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [issueToDelete, setIssueToDelete] = useState<Issue | null>(null);
    const [showIssueDeleteDialog, setShowIssueDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const q = (localSearch || globalSearchTerm).toLowerCase();
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
    }, [filtered.length, perPage, totalPages, page]);

    // Actions
    const openEditIssue = (i: Issue) => {
        setEditingIssue(i);
        setIsEditIssueOpen(true);
    };
    const closeEditIssue = () => {
        setEditingIssue(null);
        setIsEditIssueOpen(false);
    };

    const saveIssueEdits = async () => {
        if (!editingIssue || !currentUser) return;
        setIsSaving(true);
        try {
            const supabase = createClient();
            const updates = {
                title: editingIssue.title,
                description: editingIssue.description,
                category: editingIssue.category,
                status: editingIssue.status,
                priority: editingIssue.priority,
                assigned_to: editingIssue.assigned_to,
                address: editingIssue.address,
            };

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

            await refreshIssues();
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
            await refreshIssues();
            setShowIssueDeleteDialog(false);
            setIssueToDelete(null);
        } catch (err) {
            console.error("confirmDeleteIssue:", err);
        } finally {
            setIsDeleting(false);
        }
    };

    // Helpers
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
                                onClick={() => {
                                    const csv = convertToCSV(issues as any[]);
                                    downloadCSV(csv, "issues_export.csv");
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
                                                            <span className="truncate">{issue.address}</span>
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
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
                        <AlertDialogCancel onClick={closeEditIssue}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={saveIssueEdits} disabled={isSaving}>
                            {isSaving ? "Saving…" : "Save"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Issue Dialog */}
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
        </div>
    );
};
