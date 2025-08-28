"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff } from "lucide-react"

export default function RealTimeStatus() {
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Test connection with a simple subscription
    const channel = supabase
      .channel("connection_test")
      .on("presence", { event: "sync" }, () => {
        setIsConnected(true)
        setLastUpdate(new Date())
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true)
          setLastUpdate(new Date())
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setIsConnected(false)
        }
      })

    // Heartbeat to check connection
    const heartbeat = setInterval(() => {
      if (channel.state === "joined") {
        setIsConnected(true)
        setLastUpdate(new Date())
      } else {
        setIsConnected(false)
      }
    }, 30000) // Check every 30 seconds

    return () => {
      clearInterval(heartbeat)
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-2">
        {isConnected ? (
          <>
            <Wifi className="w-3 h-3" />
            <span>Live</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3" />
            <span>Offline</span>
          </>
        )}
      </Badge>
    </div>
  )
}
