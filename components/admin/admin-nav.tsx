"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Crown,
    LogOut,
    Shield,
    Home,
    AlertTriangle,
    Users,
    BarChart3,
    Bell,
    Info,
    Menu,
    X,
} from "lucide-react";
import { User } from "./admin-types";
import { createClient } from "@/lib/supabase/client";

interface AdminNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    currentUser: User | null;
    notifications: any[];
    setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
    isMobileNavOpen: boolean;
    setIsMobileNavOpen: (open: boolean) => void;
}

export const AdminNav = ({
    activeTab,
    setActiveTab,
    currentUser,
    notifications,
    setNotifications,
    isMobileNavOpen,
    setIsMobileNavOpen,
}: AdminNavProps) => {
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

    const unreadCount = notifications.filter((n) => !n.read).length;
    const markAllRead = () =>
        setNotifications((prev) => prev.map((p) => ({ ...p, read: true })));

    const CustomNotificationBell = () => {
        const [open, setOpen] = useState(false);

        return (
            <div className="relative">
                <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)} className="hover:bg-white/10">
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-accent text-primary">
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
                        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white/90 dark:bg-black/90 backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-50">
                            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                <h3 className="font-semibold">Notifications</h3>
                                {unreadCount > 0 && (
                                    <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs h-8">
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
                                            className={`p-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${!notification.read
                                                ? "bg-accent/5"
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
                                                    <Info className="w-4 h-4 text-accent" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="text-sm font-medium text-foreground truncate">
                                                            {notification.title}
                                                        </p>
                                                        {!notification.read && (
                                                            <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0" />
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
                            <div className="p-2 border-t border-white/10">
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

    return (
        <nav className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-primary">
                            <Crown className="w-6 h-6 text-accent drop-shadow-md" />
                            <span className="font-bold text-lg hidden sm:block">Samadhan Admin</span>
                            <span className="font-bold text-lg sm:hidden">Admin</span>
                        </div>

                        <div className="hidden lg:flex items-center gap-2">
                            {navItems.map(({ key, label, icon: Icon }) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveTab(key)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 ${activeTab === key
                                        ? "text-primary bg-accent/20 font-medium shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="text-sm">{label}</span>
                                </button>
                            ))}

                            <button
                                onClick={() => window.open("/", "_blank")}
                                className="flex items-center gap-2 text-muted-foreground hover:text-foreground px-3 py-2 rounded-md hover:bg-white/10 transition-colors"
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
                            <Badge variant="outline" className="text-xs border-accent/50 text-accent-foreground bg-accent/10">
                                {currentUser?.user_type === "super_admin"
                                    ? "Super Admin"
                                    : "Admin"}
                            </Badge>
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLogout}
                            className="hidden sm:flex text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                            className="lg:hidden hover:bg-white/10"
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
