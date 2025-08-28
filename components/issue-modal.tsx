"use client"
import type React from "react"
import LocationVerification from "@/components/location-verification"

import { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Clock, User, Upload, Loader2, AlertTriangle } from "lucide-react"
import { getCurrentLocation, isValidLocation, type Location } from "@/lib/geolocation"

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

interface IssueModalProps {
  issue: Issue
  userId: string
  onClose: () => void
  onUpdate: (updatedIssue: Issue) => void
}

export default function IssueModal({ issue, userId, onClose, onUpdate }: IssueModalProps) {
  const [status, setStatus] = useState(issue.status)
  const [responseMessage, setResponseMessage] = useState("")
  const [responsePhoto, setResponsePhoto] = useState<File | null>(null)
  const [responsePhotoPreview, setResponsePhotoPreview] = useState<string | null>(null)
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const originalLocation: Location = {
    latitude: issue.latitude,
    longitude: issue.longitude,
  }

  useEffect(() => {
    // Auto-get location when modal opens for resolution responses
    if (status === "resolved") {
      handleGetLocation()
    }
  }, [status])

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

  const handleGetLocation = async () => {
    setIsGettingLocation(true)
    setError(null)

    try {
      const location = await getCurrentLocation()

      if (!isValidLocation(location)) {
        throw new Error("Invalid location coordinates received")
      }

      setCurrentLocation(location)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to get your location")
    } finally {
      setIsGettingLocation(false)
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setResponsePhoto(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setResponsePhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!responseMessage.trim()) {
      setError("Please enter a response message")
      return
    }

    // For resolution responses, require location verification
    if (status === "resolved" && !currentLocation) {
      setError("Please verify your location for resolution responses")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Upload photo if provided
      let photoUrl = null
      let photoFilename = null

      if (responsePhoto) {
        const formData = new FormData()
        formData.append("file", responsePhoto)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload photo")
        }

        const { url, filename } = await uploadResponse.json()
        photoUrl = url
        photoFilename = filename
      }

      // Create response with location data
      const responseData: any = {
        issue_id: issue.id,
        responder_id: userId,
        response_type: status === "resolved" ? "resolution" : "status_update",
        message: responseMessage,
        photo_url: photoUrl,
        photo_filename: photoFilename,
      }

      // Add location data if available
      if (currentLocation) {
        responseData.latitude = currentLocation.latitude
        responseData.longitude = currentLocation.longitude
      }

      const { error: responseError } = await supabase.from("issue_responses").insert(responseData)

      if (responseError) throw responseError

      // Update issue status and assignment
      const updateData: any = {
        status,
        assigned_to: userId,
        updated_at: new Date().toISOString(),
      }

      if (status === "resolved") {
        updateData.resolved_at = new Date().toISOString()
      }

      const { data: updatedIssue, error: updateError } = await supabase
        .from("issues")
        .update(updateData)
        .eq("id", issue.id)
        .select(
          `
          *,
          profiles!issues_reporter_id_fkey (
            full_name,
            email
          )
        `,
        )
        .single()

      if (updateError) throw updateError

      onUpdate(updatedIssue)
      setResponseMessage("")
      setResponsePhoto(null)
      setResponsePhotoPreview(null)
      setCurrentLocation(null)
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{issue.title}</span>
            <div className="flex gap-2">
              <Badge className={getStatusColor(issue.status)}>{issue.status.replace("_", " ")}</Badge>
              <Badge className={getPriorityColor(issue.priority)}>{issue.priority}</Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Issue Details</h3>
              <p className="text-gray-600 mb-4">{issue.description}</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{issue.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span>
                    {issue.profiles?.full_name} ({issue.profiles?.email})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>Reported on {new Date(issue.created_at).toLocaleDateString()}</span>
                </div>
                <Badge variant="outline" className="capitalize">
                  {issue.category.replace("_", " ")}
                </Badge>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Photo Evidence</h3>
              <img
                src={issue.photo_url || "/placeholder.svg"}
                alt={issue.title}
                className="w-full h-64 object-cover rounded-md border"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-4">Government Response</h3>
              <form onSubmit={handleSubmitResponse} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">Update Status</Label>
                  <Select value={status} onValueChange={setStatus}>
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

                <div className="grid gap-2">
                  <Label htmlFor="message">Response Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Enter your response to the citizen..."
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    required
                  />
                </div>

                {status === "resolved" && (
                  <>
                    <div className="grid gap-2">
                      <Label>Location Verification</Label>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGetLocation}
                        disabled={isGettingLocation}
                        className="bg-transparent"
                      >
                        {isGettingLocation ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Getting Location...
                          </>
                        ) : (
                          <>
                            <MapPin className="w-4 h-4 mr-2" />
                            {currentLocation ? "Update Location" : "Verify Location"}
                          </>
                        )}
                      </Button>

                      {currentLocation && (
                        <LocationVerification
                          originalLocation={originalLocation}
                          currentLocation={currentLocation}
                          showDetails={true}
                        />
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label>Resolution Photo</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 bg-transparent"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {responsePhoto ? "Change Photo" : "Upload Photo"}
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </div>
                      {responsePhotoPreview && (
                        <div className="mt-2">
                          <img
                            src={responsePhotoPreview || "/placeholder.svg"}
                            alt="Resolution preview"
                            className="w-full h-48 object-cover rounded-md border"
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}

                {error && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Response"
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={onClose} className="bg-transparent">
                    Close
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
