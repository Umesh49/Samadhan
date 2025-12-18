export interface User {
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

export interface Issue {
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

export interface SystemHealth {
    uptime: string;
    responseTime: string;
    activeUsers: number;
    issuesThisWeek: number;
}

export interface AdminStats {
    total: number;
    reported: number;
    inProgress: number;
    resolved: number;
    rejected: number;
}
