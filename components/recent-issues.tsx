"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface IssueResponse {
  id: string
  issue_id: string
  responder_id: string
  response_type: string
  message: string
  photo_url?: string | null
  photo_filename?: string | null
  latitude?: number | null
  longitude?: number | null
  created_at: string
}

interface Issue {
  id: string
  title: string
  category: string
  status: string
  priority: string
  address?: string | null
  created_at: string
  photo_url?: string | null
  issue_responses?: IssueResponse[]
  reporter_id?: string
}

export default function RecentIssues() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const fetchIssues = async () => {
      setIsLoading(true)
      // grab issues and their responses (responses come as an array)
      const { data, error } = await supabase
        .from("issues")
        .select("*, issue_responses(*)")
        .order("created_at", { ascending: false })
        .limit(20)

      if (!error && data) {
        setIssues(data as Issue[])
      } else {
        console.error("fetchIssues error:", error)
      }
      setIsLoading(false)
    }

    fetchIssues()

    // Realtime updates: listen to both issues and issue_responses
    const channel = supabase
      .channel("issues-and-responses")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "issues" },
        () => fetchIssues()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "issue_responses" },
        () => fetchIssues()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "reported":
        return "bg-blue-100 text-blue-800"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getLatestResponse = (issue: Issue): IssueResponse | null => {
    const responses = issue.issue_responses || []
    if (responses.length === 0) return null
    // find latest by created_at
    return responses.reduce((latest, cur) =>
      new Date(cur.created_at) > new Date(latest.created_at) ? cur : latest
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">Loading recent issues...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {issues.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">No issues reported yet.</p>
          </CardContent>
        </Card>
      ) : (
        issues.map((issue) => {
          const latestResp = getLatestResponse(issue)
          return (
            <Dialog key={issue.id}>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{issue.title}</CardTitle>
                      <div className="flex gap-2 items-center">
                        <Badge className={getStatusColor(issue.status)}>
                          {issue.status.replace("_", " ")}
                        </Badge>
                        <Badge className={getPriorityColor(issue.priority)}>
                          {issue.priority}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 items-start">
                      {/* show latest response thumbnail if present, else issue photo */}
                      <img
                        src={latestResp?.photo_url ?? issue.photo_url ?? "/placeholder.svg"}
                        alt={issue.title}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{issue.address ?? "Location not provided"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {issue.category.replace("_", " ")}
                        </Badge>
                        {latestResp && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Latest update: {latestResp.response_type.replace("_", " ")} •{" "}
                            {new Date(latestResp.created_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>

              {/* Expanded Modal */}
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">{issue.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <img
                    src={issue.photo_url ?? "/placeholder.svg"}
                    alt={issue.title}
                    className="w-full h-64 object-cover rounded-lg shadow"
                  />

                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" /> {issue.address ?? "N/A"}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />{" "}
                      {new Date(issue.created_at).toLocaleString()}
                    </p>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(issue.status)}>
                        {issue.status.replace("_", " ")}
                      </Badge>
                      <Badge className={getPriorityColor(issue.priority)}>{issue.priority}</Badge>
                    </div>
                  </div>

                  {/* Responses / Updates */}
                  <div className="pt-2 border-t">
                    <h3 className="text-sm font-semibold mb-2">Updates</h3>
                    {issue.issue_responses && issue.issue_responses.length > 0 ? (
                      <div className="space-y-4">
                        {issue.issue_responses
                          .slice()
                          .sort(
                            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                          )
                          .map((resp) => (
                            <div key={resp.id} className="flex gap-4 items-start">
                              {resp.photo_url ? (
                                <img
                                  src={resp.photo_url}
                                  alt={`response-${resp.id}`}
                                  className="w-28 h-20 object-cover rounded-md shadow-sm"
                                />
                              ) : (
                                <div className="w-28 h-20 bg-gray-50 rounded-md flex items-center justify-center text-xs text-muted-foreground">
                                  No photo
                                </div>
                              )}

                              <div className="flex-1 text-sm text-gray-700">
                                <div className="mb-1">
                                  <span className="font-medium capitalize">{resp.response_type.replace("_"," ")}</span>{" "}
                                  • <span className="text-xs text-muted-foreground">{new Date(resp.created_at).toLocaleString()}</span>
                                </div>
                                <div className="text-sm">{resp.message}</div>
                                {resp.latitude && resp.longitude && (
                                  <div className="mt-2">
                                    <a
                                      href={`https://www.google.com/maps?q=${resp.latitude},${resp.longitude}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-sm underline"
                                    >
                                      View location on map
                                    </a>
                                  </div>
                                )}
                                <div className="mt-1 text-xs text-muted-foreground">By: {resp.responder_id}</div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No updates yet.</div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )
        })
      )}
    </div>
  )
}
