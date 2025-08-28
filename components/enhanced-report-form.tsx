"use client"
import type React from "react"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, MapPin, Upload, Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { getCurrentLocation, isValidLocation, type Location } from "@/lib/geolocation"

interface EnhancedReportFormProps {
  userId: string
}

export default function EnhancedReportForm({ userId }: EnhancedReportFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [priority, setPriority] = useState("medium")
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [location, setLocation] = useState<Location | null>(null)
  const [address, setAddress] = useState("")
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const getLocation = async () => {
    setIsGettingLocation(true)
    setError(null)

    try {
      const currentLocation = await getCurrentLocation()

      if (!isValidLocation(currentLocation)) {
        throw new Error("Invalid location coordinates received")
      }

      setLocation(currentLocation)

      // Get additional location info if available
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocationAccuracy(position.coords.accuracy)
          },
          () => {
            // Ignore accuracy errors
          },
          { enableHighAccuracy: true },
        )
      }

      // Simple reverse geocoding (in a real app, you'd use a proper geocoding service)
      setAddress(`${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to get your location")
    } finally {
      setIsGettingLocation(false)
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhoto(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!photo || !location || !category) {
      setError("Please fill in all required fields, add a photo, and get your location.")
      return
    }

    if (!isValidLocation(location)) {
      setError("Invalid location data. Please get your location again.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Upload photo to Blob storage
      const formData = new FormData()
      formData.append("file", photo)

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload photo")
      }

      const { url: photoUrl, filename } = await uploadResponse.json()

      // Create issue in database
      const supabase = createClient()
      const { error: dbError } = await supabase.from("issues").insert({
        title,
        description,
        category,
        priority,
        latitude: location.latitude,
        longitude: location.longitude,
        address,
        photo_url: photoUrl,
        photo_filename: filename,
        reporter_id: userId,
      })

      if (dbError) throw dbError

      // Reset form
      setTitle("")
      setDescription("")
      setCategory("")
      setPriority("medium")
      setPhoto(null)
      setPhotoPreview(null)
      setLocation(null)
      setAddress("")
      setLocationAccuracy(null)

      router.refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const getLocationAccuracyInfo = () => {
    if (!locationAccuracy) return null

    if (locationAccuracy <= 10) {
      return {
        icon: <CheckCircle className="w-4 h-4 text-green-600" />,
        text: "High accuracy",
        color: "text-green-600",
      }
    } else if (locationAccuracy <= 50) {
      return { icon: <CheckCircle className="w-4 h-4 text-blue-600" />, text: "Good accuracy", color: "text-blue-600" }
    } else {
      return {
        icon: <AlertTriangle className="w-4 h-4 text-yellow-600" />,
        text: "Low accuracy",
        color: "text-yellow-600",
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Report Infrastructure Issue
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Issue Title</Label>
            <Input
              id="title"
              placeholder="e.g., Large pothole on Main Street"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select issue type" />
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
          </div>

          <div className="grid gap-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
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
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label>Photo Evidence</Label>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1">
                <Upload className="w-4 h-4 mr-2" />
                {photo ? "Change Photo" : "Upload Photo"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
                required
              />
            </div>
            {photoPreview && (
              <div className="mt-2">
                <img
                  src={photoPreview || "/placeholder.svg"}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-md border"
                />
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Location</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={getLocation}
                className="flex-1 bg-transparent"
                disabled={isGettingLocation}
              >
                {isGettingLocation ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    {location ? "Update Location" : "Get Current Location"}
                  </>
                )}
              </Button>
            </div>

            {location && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Location: {address}</p>
                {locationAccuracy && (
                  <div className="flex items-center gap-2 text-sm">
                    {getLocationAccuracyInfo()?.icon}
                    <span className={getLocationAccuracyInfo()?.color}>
                      {getLocationAccuracyInfo()?.text} (±{Math.round(locationAccuracy)}m)
                    </span>
                  </div>
                )}
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    Location captured successfully. This will help authorities locate and fix the issue quickly.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>

          {error && (
            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting Report...
              </>
            ) : (
              "Submit Report"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
