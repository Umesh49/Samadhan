"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Clock, User, Search, Filter, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { env } from "@/lib/env"

interface Issue {
  id: string
  title: string
  description: string
  category: string
  status: string
  priority: string
  latitude: number
  longitude: number
  address: string
  photo_url: string
  photo_filename: string
  reporter_id: string
  assigned_to: string | null
  created_at: string
  updated_at: string
  profiles: {
    full_name: string
    email: string
  }
}

interface IssuesListProps {
  userId: string
}

export default function IssuesList({ userId }: IssuesListProps) {
  const [issues, setIssues] = useState<Issue[]>([])
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")

  // Modal State
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const fetchIssues = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("issues")
        .select(
          `
          *,
          profiles!issues_reporter_id_fkey (
            full_name,
            email
          )
        `,
        )
        .order("created_at", { ascending: false })

      if (!error && data) {
        setIssues(data as any)
        setFilteredIssues(data as any)
      }
      setIsLoading(false)
    }

    fetchIssues()

    // Set up real-time subscription
    const supabase = createClient()
    const channel = supabase
      .channel("issues_list")
      .on("postgres_changes", { event: "*", schema: "public", table: "issues" }, () => {
        fetchIssues()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    let filtered = issues

    if (searchTerm) {
      filtered = filtered.filter(
        (issue) =>
          issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          issue.address.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((issue) => issue.status === statusFilter)
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((issue) => issue.category === categoryFilter)
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((issue) => issue.priority === priorityFilter)
    }

    setFilteredIssues(filtered)
  }, [issues, searchTerm, statusFilter, categoryFilter, priorityFilter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "reported":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
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

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedIssue) return
    setIsUpdating(true)
    const supabase = createClient()

    // Optimistic update
    const updatedIssue = { ...selectedIssue, status: newStatus }
    setSelectedIssue(updatedIssue)
    setIssues(prev => prev.map(i => i.id === selectedIssue.id ? updatedIssue : i))

    try {
      await supabase
        .from('issues')
        .update({ status: newStatus })
        .eq('id', selectedIssue.id)

      await supabase.from('issue_responses').insert({
        issue_id: selectedIssue.id,
        responder_id: userId,
        content: `Status updated to ${newStatus.replace('_', ' ')}`,
        is_internal: false
      })
    } catch (err) {
      console.error("Failed to update status", err)
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading issues...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="reported">Reported</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="pothole">Pothole</SelectItem>
                <SelectItem value="streetlight">Streetlight</SelectItem>
                <SelectItem value="sidewalk">Sidewalk</SelectItem>
                <SelectItem value="traffic_sign">Traffic Sign</SelectItem>
                <SelectItem value="drainage">Drainage</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Issues ({filteredIssues.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredIssues.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No issues found matching your filters.</p>
          ) : (
            <div className="space-y-4">
              {filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedIssue(issue)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg">{issue.title}</h3>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(issue.status)} variant="secondary">{issue.status.replace("_", " ")}</Badge>
                      <Badge className={getPriorityColor(issue.priority)} variant="outline">{issue.priority}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    {issue.photo_url && (
                      <img
                        src={issue.photo_url}
                        alt={issue.title}
                        className="w-24 h-24 object-cover rounded-md"
                      />
                    )}
                    <div className="flex-1 space-y-2">
                      <p className="text-muted-foreground text-sm line-clamp-2">{issue.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{issue.address}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{issue.profiles?.full_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {issue.category.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inline Modal */}
      <Dialog open={!!selectedIssue} onOpenChange={(open) => !open && setSelectedIssue(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedIssue?.title}</DialogTitle>
          </DialogHeader>

          {selectedIssue && (
            <div className="space-y-6">
              <div className="aspect-video relative rounded-lg overflow-hidden bg-muted">
                <img
                  src={selectedIssue.photo_url || "/placeholder.svg"}
                  alt={selectedIssue.title}
                  className="object-cover w-full h-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Select
                      value={selectedIssue.status}
                      onValueChange={handleStatusUpdate}
                      disabled={isUpdating}
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
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Priority</Label>
                  <div className="mt-1 font-medium capitalize">{selectedIssue.priority}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <div className="mt-1 font-medium capitalize">{selectedIssue.category.replace('_', ' ')}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Reported By</Label>
                  <div className="mt-1 font-medium">{selectedIssue.profiles?.full_name}</div>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1">{selectedIssue.description}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Location</Label>
                <p className="mt-1 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {selectedIssue.address}
                </p>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setSelectedIssue(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
