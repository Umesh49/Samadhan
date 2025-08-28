"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { Bell, CheckCircle, Clock, AlertTriangle } from "lucide-react"

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  timestamp: Date
  read: boolean
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}

interface NotificationProviderProps {
  children: React.ReactNode
  userId: string
  userType: "citizen" | "government"
}

export function NotificationProvider({ children, userId, userType }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    const supabase = createClient()

    if (userType === "government") {
      // 🔔 Notify Gov when citizen raises new issue
      const issuesChannel = supabase
        .channel("new_issues")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "issues" }, (payload) => {
          const newNotification: Notification = {
            id: `issue-${payload.new.id}`,
            title: "New Issue Reported",
            message: `${payload.new.title} - ${payload.new.category}`,
            type: "info",
            timestamp: new Date(),
            read: false,
          }
          setNotifications((prev) => [newNotification, ...prev])
          toast({
            title: "New Issue Reported",
            description: payload.new.title,
            duration: 5000,
          })
        })
        .subscribe()

      return () => {
        supabase.removeChannel(issuesChannel)
      }
    } else {
      // 🔔 Notify Citizen when Gov updates issue status
      const statusUpdatesChannel = supabase
        .channel("status_updates")
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "issues" }, async (payload) => {
          if (payload.new.reporter_id === userId && payload.old.status !== payload.new.status) {
            let notificationType: "info" | "success" | "warning" = "info"
            let icon = <Bell className="w-4 h-4" />

            switch (payload.new.status) {
              case "in_progress":
                notificationType = "info"
                icon = <Clock className="w-4 h-4" />
                break
              case "resolved":
                notificationType = "success"
                icon = <CheckCircle className="w-4 h-4" />
                break
              case "rejected":
                notificationType = "warning"
                icon = <AlertTriangle className="w-4 h-4" />
                break
            }

            const newNotification: Notification = {
              id: `status-${payload.new.id}-${payload.new.status}`,
              title: "Issue Status Updated",
              message: `${payload.new.title} is now ${payload.new.status.replace("_", " ")}`,
              type: notificationType,
              timestamp: new Date(),
              read: false,
            }
            setNotifications((prev) => [newNotification, ...prev])

            toast({
              title: "Issue Status Updated",
              description: `${payload.new.title} is now ${payload.new.status.replace("_", " ")}`,
              duration: 5000,
            })
          }
        })
        .subscribe()

      return () => {
        supabase.removeChannel(statusUpdatesChannel)
      }
    }
  }, [userId, userType])

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  )
}
