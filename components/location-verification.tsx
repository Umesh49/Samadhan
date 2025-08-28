"use client"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import { calculateDistance, formatDistance, getLocationAccuracy, type Location } from "@/lib/geolocation"

interface LocationVerificationProps {
  originalLocation: Location
  currentLocation: Location | null
  showDetails?: boolean
}

export default function LocationVerification({
  originalLocation,
  currentLocation,
  showDetails = true,
}: LocationVerificationProps) {
  const [distance, setDistance] = useState<number | null>(null)
  const [accuracy, setAccuracy] = useState<ReturnType<typeof getLocationAccuracy> | null>(null)

  useEffect(() => {
    if (originalLocation && currentLocation) {
      const dist = calculateDistance(originalLocation, currentLocation)
      setDistance(dist)
      setAccuracy(getLocationAccuracy(dist))
    }
  }, [originalLocation, currentLocation])

  if (!currentLocation || distance === null || !accuracy) {
    return (
      <Alert>
        <MapPin className="h-4 w-4" />
        <AlertDescription>Location verification pending...</AlertDescription>
      </Alert>
    )
  }

  const getIcon = () => {
    switch (accuracy.level) {
      case "excellent":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "good":
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case "fair":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "poor":
        return <XCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getBadgeVariant = () => {
    switch (accuracy.level) {
      case "excellent":
      case "good":
        return "default"
      case "fair":
        return "secondary"
      case "poor":
        return "destructive"
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {getIcon()}
        <Badge variant={getBadgeVariant()} className="capitalize">
          {accuracy.level} Match
        </Badge>
        <span className="text-sm text-gray-600">{formatDistance(distance)} away</span>
      </div>

      {showDetails && (
        <Alert className={distance > 50 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
          <MapPin className="h-4 w-4" />
          <AlertDescription>
            <span className={accuracy.color}>{accuracy.description}</span>
            {distance > 50 && (
              <span className="block mt-1 text-red-600">
                Warning: Response location is {formatDistance(distance)} from the original issue location.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {showDetails && (
        <div className="text-xs text-gray-500 space-y-1">
          <div>
            Original: {originalLocation.latitude.toFixed(6)}, {originalLocation.longitude.toFixed(6)}
          </div>
          <div>
            Current: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
          </div>
        </div>
      )}
    </div>
  )
}
