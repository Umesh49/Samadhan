"use client";

import React, { useState } from "react";
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
    Search,
    Download,
    User as UserIcon,
    Mail,
    Building,
    Calendar,
    CheckCircle,
    XCircle,
    Edit,
    Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { User } from "./admin-types";

interface AdminUsersProps {
    users: User[];
    currentUser: User | null;
    refreshUsers: () => Promise<void>;
}

export const AdminUsers = ({
    users,
    currentUser,
    refreshUsers,
}: AdminUsersProps) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [userTypeFilter, setUserTypeFilter] = useState("all");

    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isEditUserOpen, setIsEditUserOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Filter Logic
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

    // CSV Export
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

    // Actions
    const updateUserApprovalStatus = async (userId: string, status: string) => {
        if (!currentUser) return;
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("profiles")
                .update({
                    approval_status: status,
                    approved_by: currentUser.id,
                    approved_at: status === "approved" ? new Date().toISOString() : null,
                })
                .eq("id", userId);
            if (error) throw error;
            await supabase.from("admin_actions").insert({
                admin_id: currentUser.id,
                action_type: status === "approved" ? "approve_user" : "reject_user",
                target_id: userId,
            });
            await refreshUsers();
        } catch (err) {
            console.error("updateUserApprovalStatus:", err);
        }
    };

    const openEditUser = (u: User) => {
        setEditingUser(u);
        setIsEditUserOpen(true);
    };
    const closeEditUser = () => {
        setEditingUser(null);
        setIsEditUserOpen(false);
    };

    const saveUserEdits = async () => {
        if (!editingUser || !currentUser) return;
        setIsSaving(true);
        try {
            const supabase = createClient();
            const updates = {
                full_name: editingUser.full_name,
                email: editingUser.email,
                user_type: editingUser.user_type,
                organization: editingUser.organization,
                approval_status: editingUser.approval_status,
                rejection_reason: editingUser.rejection_reason,
            };

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

            await refreshUsers();
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
            await refreshUsers();
            setShowDeleteDialog(false);
            setUserToDelete(null);
        } catch (err) {
            console.error("confirmDelete:", err);
        } finally {
            setIsDeleting(false);
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
                            onClick={() => {
                                const csv = convertToCSV(filteredUsers as any[]);
                                downloadCSV(csv, "users_export.csv");
                            }}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export Users
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {filteredUsers.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <UserIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No users found matching your criteria</p>
                            </div>
                        ) : (
                            filteredUsers.map((user) => (
                                <Card key={user.id}>
                                    <CardContent className="p-4">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <UserIcon className="w-6 h-6 text-primary" />
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
                                                                {new Date(user.created_at).toLocaleDateString()}
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
                                setEditingUser((p) => (p ? { ...p, email: e.target.value } : p))
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
                                setEditingUser((p) => (p ? { ...p, approval_status: val } : p))
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
                        <AlertDialogCancel onClick={closeEditUser}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={saveUserEdits} disabled={isSaving}>
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
                            undone. Their reports will be archived but preserved for records.
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
