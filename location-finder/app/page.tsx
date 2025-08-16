"use client"

import type React from "react"

import { useState } from "react"
import { MapPin, Navigation, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface LocationData {
  latitude: number
  longitude: number
  address?: string
  city?: string
  country?: string
  accuracy?: number
}

export default function LocationFinder() {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchLoading, setSearchLoading] = useState(false)

  // Get current location using browser's geolocation API
  const getCurrentLocation = () => {
    setLoading(true)
    setError("")

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.")
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords

        try {
          // Reverse geocoding to get address
          const addressData = await reverseGeocode(latitude, longitude)

          setLocation({
            latitude,
            longitude,
            accuracy,
            ...addressData,
          })
        } catch (err) {
          setLocation({
            latitude,
            longitude,
            accuracy,
          })
        }

        setLoading(false)
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location."

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable."
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out."
            break
        }

        setError(errorMessage)
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  }

  // Reverse geocoding using OpenStreetMap Nominatim API
  const reverseGeocode = async (lat: number, lon: number) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
    )

    if (!response.ok) {
      throw new Error("Failed to fetch address")
    }

    const data = await response.json()

    return {
      address: data.display_name,
      city: data.address?.city || data.address?.town || data.address?.village,
      country: data.address?.country,
    }
  }

  // Search for location by query
  const searchLocation = async () => {
    if (!searchQuery.trim()) return

    setSearchLoading(true)
    setError("")

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1`,
      )

      if (!response.ok) {
        throw new Error("Search failed")
      }

      const data = await response.json()

      if (data.length === 0) {
        setError("No location found for your search.")
        setSearchLoading(false)
        return
      }

      const result = data[0]
      setLocation({
        latitude: Number.parseFloat(result.lat),
        longitude: Number.parseFloat(result.lon),
        address: result.display_name,
        city: result.address?.city || result.address?.town || result.address?.village,
        country: result.address?.country,
      })
    } catch (err) {
      setError("Failed to search location. Please try again.")
    }

    setSearchLoading(false)
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchLocation()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <MapPin className="text-blue-600" />
            Location Finder
          </h1>
          <p className="text-gray-600">Find your current location or search for any place worldwide</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                Location Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={getCurrentLocation} disabled={loading} className="w-full" size="lg">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4 mr-2" />
                    Get My Location
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search for a location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="pl-10"
                />
              </div>

              <Button
                onClick={searchLocation}
                disabled={searchLoading || !searchQuery.trim()}
                variant="outline"
                className="w-full bg-transparent"
              >
                {searchLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search Location
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Location Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert className="mb-4 border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              {location ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Latitude</label>
                      <p className="text-lg font-mono">{location.latitude.toFixed(6)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Longitude</label>
                      <p className="text-lg font-mono">{location.longitude.toFixed(6)}</p>
                    </div>
                  </div>

                  {location.accuracy && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Accuracy</label>
                      <p className="text-sm text-gray-700">{Math.round(location.accuracy)} meters</p>
                    </div>
                  )}

                  {location.address && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Address</label>
                      <p className="text-sm text-gray-700 break-words">{location.address}</p>
                    </div>
                  )}

                  {location.city && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">City</label>
                      <p className="text-sm text-gray-700">{location.city}</p>
                    </div>
                  )}

                  {location.country && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Country</label>
                      <p className="text-sm text-gray-700">{location.country}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <Button
                      onClick={() => {
                        const url = `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}&zoom=15`
                        window.open(url, "_blank")
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      View on Map
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No location data available</p>
                  <p className="text-sm">Click "Get My Location" or search for a place</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Map View */}
        {location && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Map View</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                <iframe
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.01},${location.latitude - 0.01},${location.longitude + 0.01},${location.latitude + 0.01}&layer=mapnik&marker=${location.latitude},${location.longitude}`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  title="Location Map"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Navigation className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold">GPS Location</h3>
                <p className="text-sm text-gray-600">Get your precise current location using GPS</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Search className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-semibold">Location Search</h3>
                <p className="text-sm text-gray-600">Search for any location worldwide</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-semibold">Detailed Info</h3>
                <p className="text-sm text-gray-600">Get coordinates, address, and map view</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
