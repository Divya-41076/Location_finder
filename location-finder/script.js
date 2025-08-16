import L from "leaflet"

class LocationFinder {
  constructor() {
    this.currentLocation = null
    this.map = null
    this.marker = null
    this.searchResults = []
    this.recentSearches = this.loadRecentSearches()
    this.locationHistory = this.loadLocationHistory()
    this.historyMap = null
    this.isHistoryVisible = false
    this.initializeEventListeners()
    this.initializeTheme()
    this.checkOnlineStatus()
    this.displayRecentSearches()
  }

  initializeEventListeners() {
    // Get current location button
    document.getElementById("getCurrentLocationBtn").addEventListener("click", () => {
      this.getCurrentLocation()
    })

    // Search button
    document.getElementById("searchBtn").addEventListener("click", () => {
      this.searchLocation()
    })

    // Search input enter key
    document.getElementById("searchInput").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.searchLocation()
      }
    })

    // Search input for suggestions
    document.getElementById("searchInput").addEventListener("input", (e) => {
      this.handleSearchInput(e.target.value)
    })

    // Copy buttons
    document.getElementById("copyLatBtn").addEventListener("click", () => {
      this.copyToClipboard(this.currentLocation?.latitude, "Latitude")
    })

    document.getElementById("copyLonBtn").addEventListener("click", () => {
      this.copyToClipboard(this.currentLocation?.longitude, "Longitude")
    })

    document.getElementById("copyAllBtn").addEventListener("click", () => {
      this.copyAllCoordinates()
    })

    // View on map button
    document.getElementById("viewOnMapBtn").addEventListener("click", () => {
      this.openExternalMap()
    })

    // Share location button
    document.getElementById("shareLocationBtn").addEventListener("click", () => {
      this.shareLocation()
    })

    // Theme toggle
    document.getElementById("themeToggle").addEventListener("click", () => {
      this.toggleTheme()
    })

    // Clear history button
    document.getElementById("clearHistoryBtn").addEventListener("click", () => {
      this.clearSearchHistory()
    })

    // Center map button
    document.getElementById("centerMapBtn").addEventListener("click", () => {
      this.centerMap()
    })

    // Online/offline detection
    window.addEventListener("online", () => {
      this.showToast("Connection restored! You're back online.", "success")
    })

    window.addEventListener("offline", () => {
      this.showToast("You're offline. Some features may not work.", "warning")
    })

    // Click outside to close suggestions
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".search-input-wrapper")) {
        this.hideSuggestions()
      }
    })

    // View history button
    document.getElementById("viewHistoryBtn").addEventListener("click", () => {
      this.toggleHistorySection()
    })

    // History controls
    document.getElementById("toggleHistoryBtn").addEventListener("click", () => {
      this.toggleHistorySection()
    })

    document.getElementById("clearHistoryBtn").addEventListener("click", () => {
      this.clearLocationHistory()
    })

    document.getElementById("exportHistoryBtn").addEventListener("click", () => {
      this.exportHistory()
    })

    document.getElementById("showHistoryMapBtn").addEventListener("click", () => {
      this.showHistoryMap()
    })

    document.getElementById("historyFilter").addEventListener("change", (e) => {
      this.filterHistory(e.target.value)
    })
  }

  initializeTheme() {
    const savedTheme = localStorage.getItem("theme") || "light"
    document.documentElement.setAttribute("data-theme", savedTheme)
    this.updateThemeIcon(savedTheme)
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme")
    const newTheme = currentTheme === "dark" ? "light" : "dark"

    document.documentElement.setAttribute("data-theme", newTheme)
    localStorage.setItem("theme", newTheme)
    this.updateThemeIcon(newTheme)

    this.showToast(`Switched to ${newTheme} mode`, "success")
  }

  updateThemeIcon(theme) {
    const icon = document.querySelector("#themeToggle i")
    icon.className = theme === "dark" ? "fas fa-sun" : "fas fa-moon"
  }

  checkOnlineStatus() {
    if (!navigator.onLine) {
      this.showError("You're offline. Please connect to the internet to use location services.")
    }
  }

  async handleSearchInput(query) {
    if (query.length < 3) {
      this.hideSuggestions()
      return
    }

    // Show recent searches that match
    const matchingRecent = this.recentSearches.filter((search) => search.toLowerCase().includes(query.toLowerCase()))

    if (matchingRecent.length > 0) {
      this.showSuggestions(matchingRecent.map((search) => ({ display_name: search, type: "recent" })))
    } else {
      this.hideSuggestions()
    }
  }

  showSuggestions(suggestions) {
    const container = document.getElementById("searchSuggestions")
    container.innerHTML = ""

    suggestions.forEach((suggestion) => {
      const item = document.createElement("div")
      item.className = "suggestion-item"
      item.innerHTML = `
        ${suggestion.type === "recent" ? '<i class="fas fa-history"></i> ' : ""}
        ${suggestion.display_name}
      `
      item.addEventListener("click", () => {
        document.getElementById("searchInput").value = suggestion.display_name
        this.hideSuggestions()
        if (suggestion.type === "recent") {
          this.searchLocation()
        }
      })
      container.appendChild(item)
    })

    container.classList.remove("hidden")
  }

  hideSuggestions() {
    document.getElementById("searchSuggestions").classList.add("hidden")
  }

  showLoading(message = "Getting location...") {
    this.hideAllMessages()
    const loadingElement = document.getElementById("loadingMessage")
    loadingElement.querySelector("span").textContent = message
    loadingElement.classList.remove("hidden")
    this.setButtonsDisabled(true)
  }

  hideLoading() {
    document.getElementById("loadingMessage").classList.add("hidden")
    this.setButtonsDisabled(false)
  }

  showError(message) {
    this.hideAllMessages()
    const errorElement = document.getElementById("errorMessage")
    errorElement.textContent = message
    errorElement.classList.remove("hidden")
  }

  hideAllMessages() {
    document.getElementById("errorMessage").classList.add("hidden")
    document.getElementById("loadingMessage").classList.add("hidden")
    document.getElementById("noLocationMessage").classList.add("hidden")
    document.getElementById("searchResults").classList.add("hidden")
  }

  setButtonsDisabled(disabled) {
    document.getElementById("getCurrentLocationBtn").disabled = disabled
    document.getElementById("searchBtn").disabled = disabled

    const getCurrentBtn = document.getElementById("getCurrentLocationBtn")
    const searchBtn = document.getElementById("searchBtn")

    if (disabled) {
      getCurrentBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Getting Location...</span>'
      searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Searching...</span>'
    } else {
      getCurrentBtn.innerHTML = '<i class="fas fa-crosshairs"></i><span>Get My Location</span>'
      searchBtn.innerHTML = '<i class="fas fa-search"></i><span>Search</span>'
    }
  }

  getCurrentLocation() {
    if (!navigator.onLine) {
      this.showError("You're offline. Please connect to the internet to get your location.")
      return
    }

    if (!navigator.geolocation) {
      this.showError("Geolocation is not supported by this browser. Please try a different browser.")
      return
    }

    this.showLoading("Getting your precise location...")

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 300000, // 5 minutes
    }

    navigator.geolocation.getCurrentPosition(
      (position) => this.handleLocationSuccess(position),
      (error) => this.handleLocationError(error),
      options,
    )
  }

  async handleLocationSuccess(position) {
    const { latitude, longitude, accuracy } = position.coords

    try {
      const addressData = await this.reverseGeocode(latitude, longitude)

      this.currentLocation = {
        latitude,
        longitude,
        accuracy,
        ...addressData,
      }

      this.currentLocation.method = "gps"
      this.addToLocationHistory(this.currentLocation)

      this.displayLocationData()
      this.initializeMap()
      this.showToast("Location found successfully!", "success")
    } catch (error) {
      this.currentLocation = {
        latitude,
        longitude,
        accuracy,
      }

      this.currentLocation.method = "gps"
      this.addToLocationHistory(this.currentLocation)

      this.displayLocationData()
      this.initializeMap()
      this.showToast("Location found, but address lookup failed", "warning")
    }

    this.hideLoading()
  }

  handleLocationError(error) {
    let errorMessage = "Unable to retrieve your location."

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage =
          "Location access denied. Please enable location permissions in your browser settings and try again."
        break
      case error.POSITION_UNAVAILABLE:
        errorMessage = "Location information is unavailable. Please check your GPS settings and try again."
        break
      case error.TIMEOUT:
        errorMessage = "Location request timed out. Please check your connection and try again."
        break
    }

    this.showError(errorMessage)
    this.hideLoading()
  }

  async searchLocation() {
    const searchQuery = document.getElementById("searchInput").value.trim()

    if (!searchQuery) {
      this.showError("Please enter a location to search for.")
      return
    }

    if (!navigator.onLine) {
      this.showError("You're offline. Please connect to the internet to search for locations.")
      return
    }

    this.showLoading("Searching for locations...")
    this.hideSuggestions()

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`,
      )

      if (!response.ok) {
        throw new Error("Search request failed")
      }

      const data = await response.json()

      if (data.length === 0) {
        this.showError("No locations found for your search. Please try different keywords or check your spelling.")
        this.hideLoading()
        return
      }

      this.searchResults = data
      this.addToRecentSearches(searchQuery)

      if (data.length === 1) {
        // Single result - show directly
        this.selectSearchResult(data[0])
      } else {
        // Multiple results - show list
        this.displaySearchResults(data)
      }

      this.hideLoading()
    } catch (error) {
      this.showError("Failed to search for locations. Please check your internet connection and try again.")
      this.hideLoading()
    }
  }

  displaySearchResults(results) {
    this.hideAllMessages()

    const container = document.getElementById("searchResults")
    const list = document.getElementById("searchResultsList")

    list.innerHTML = ""

    results.forEach((result, index) => {
      const item = document.createElement("div")
      item.className = "search-result-item"
      item.innerHTML = `
        <h5>${result.name || result.display_name.split(",")[0]}</h5>
        <p>${result.display_name}</p>
      `
      item.addEventListener("click", () => {
        this.selectSearchResult(result)
      })
      list.appendChild(item)
    })

    container.classList.remove("hidden")
  }

  selectSearchResult(result) {
    this.currentLocation = {
      latitude: Number.parseFloat(result.lat),
      longitude: Number.parseFloat(result.lon),
      address: result.display_name,
      city: result.address?.city || result.address?.town || result.address?.village,
      country: result.address?.country,
    }

    this.currentLocation.method = "search"
    this.addToLocationHistory(this.currentLocation)

    this.displayLocationData()
    this.initializeMap()
    this.showToast("Location selected successfully!", "success")
  }

  async reverseGeocode(lat, lon) {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
    )

    if (!response.ok) {
      throw new Error("Reverse geocoding failed")
    }

    const data = await response.json()

    return {
      address: data.display_name,
      city: data.address?.city || data.address?.town || data.address?.village,
      country: data.address?.country,
    }
  }

  displayLocationData() {
    if (!this.currentLocation) return

    this.hideAllMessages()
    document.getElementById("locationDetails").classList.remove("hidden")

    // Update coordinates
    document.getElementById("latitude").textContent = this.currentLocation.latitude.toFixed(6)
    document.getElementById("longitude").textContent = this.currentLocation.longitude.toFixed(6)

    // Update accuracy if available
    if (this.currentLocation.accuracy) {
      document.getElementById("accuracyInfo").classList.remove("hidden")
      document.getElementById("accuracy").textContent = `±${Math.round(this.currentLocation.accuracy)} meters`
    } else {
      document.getElementById("accuracyInfo").classList.add("hidden")
    }

    // Update address information
    this.updateInfoItem("addressInfo", "address", this.currentLocation.address)
    this.updateInfoItem("cityInfo", "city", this.currentLocation.city)
    this.updateInfoItem("countryInfo", "country", this.currentLocation.country)
  }

  updateInfoItem(containerId, elementId, value) {
    const container = document.getElementById(containerId)
    const element = document.getElementById(elementId)

    if (value) {
      container.classList.remove("hidden")
      element.textContent = value
    } else {
      container.classList.add("hidden")
    }
  }

  initializeMap() {
    if (!this.currentLocation) return

    const { latitude, longitude } = this.currentLocation

    // Initialize map if not already done
    if (!this.map) {
      this.map = L.map("leafletMap").setView([latitude, longitude], 13)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(this.map)
    } else {
      this.map.setView([latitude, longitude], 13)
    }

    // Remove existing marker
    if (this.marker) {
      this.map.removeLayer(this.marker)
    }

    // Add new marker
    this.marker = L.marker([latitude, longitude])
      .addTo(this.map)
      .bindPopup(`
        <strong>Location</strong><br>
        Lat: ${latitude.toFixed(6)}<br>
        Lng: ${longitude.toFixed(6)}
        ${this.currentLocation.address ? `<br><br>${this.currentLocation.address}` : ""}
      `)
      .openPopup()

    document.getElementById("mapSection").classList.remove("hidden")
  }

  centerMap() {
    if (this.map && this.currentLocation) {
      this.map.setView([this.currentLocation.latitude, this.currentLocation.longitude], 15)
      if (this.marker) {
        this.marker.openPopup()
      }
    }
  }

  async copyToClipboard(value, label) {
    if (!value) return

    try {
      await navigator.clipboard.writeText(value.toString())
      this.showToast(`${label} copied to clipboard!`, "success")
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = value.toString()
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      this.showToast(`${label} copied to clipboard!`, "success")
    }
  }

  async copyAllCoordinates() {
    if (!this.currentLocation) return

    const coordinates = `${this.currentLocation.latitude}, ${this.currentLocation.longitude}`
    await this.copyToClipboard(coordinates, "Coordinates")
  }

  openExternalMap() {
    if (!this.currentLocation) return

    const { latitude, longitude } = this.currentLocation
    const mapUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`
    window.open(mapUrl, "_blank")
  }

  async shareLocation() {
    if (!this.currentLocation) return

    const { latitude, longitude } = this.currentLocation
    const shareText = `Check out this location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    const shareUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Location Share",
          text: shareText,
          url: shareUrl,
        })
      } catch (error) {
        this.copyToClipboard(shareUrl, "Location URL")
      }
    } else {
      this.copyToClipboard(shareUrl, "Location URL")
    }
  }

  addToRecentSearches(query) {
    // Remove if already exists
    this.recentSearches = this.recentSearches.filter((search) => search !== query)

    // Add to beginning
    this.recentSearches.unshift(query)

    // Keep only last 5
    this.recentSearches = this.recentSearches.slice(0, 5)

    // Save to localStorage
    localStorage.setItem("recentSearches", JSON.stringify(this.recentSearches))

    this.displayRecentSearches()
  }

  loadRecentSearches() {
    try {
      return JSON.parse(localStorage.getItem("recentSearches")) || []
    } catch {
      return []
    }
  }

  displayRecentSearches() {
    const container = document.getElementById("recentSearches")
    const list = document.getElementById("recentSearchesList")

    if (this.recentSearches.length === 0) {
      container.classList.add("hidden")
      return
    }

    list.innerHTML = ""

    this.recentSearches.forEach((search) => {
      const item = document.createElement("span")
      item.className = "recent-search-item"
      item.textContent = search
      item.addEventListener("click", () => {
        document.getElementById("searchInput").value = search
        this.searchLocation()
      })
      list.appendChild(item)
    })

    container.classList.remove("hidden")
  }

  clearSearchHistory() {
    this.recentSearches = []
    localStorage.removeItem("recentSearches")
    this.displayRecentSearches()
    this.showToast("Search history cleared", "success")
  }

  loadLocationHistory() {
    try {
      return JSON.parse(localStorage.getItem("locationHistory")) || []
    } catch {
      return []
    }
  }

  saveLocationHistory() {
    localStorage.setItem("locationHistory", JSON.stringify(this.locationHistory))
  }

  addToLocationHistory(location) {
    const historyItem = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      address: location.address,
      city: location.city,
      country: location.country,
      method: location.method || "unknown", // 'gps', 'search', etc.
    }

    // Calculate distance from previous location
    if (this.locationHistory.length > 0) {
      const lastLocation = this.locationHistory[0]
      historyItem.distanceFromPrevious = this.calculateDistance(
        lastLocation.latitude,
        lastLocation.longitude,
        location.latitude,
        location.longitude,
      )
    }

    // Add to beginning of array
    this.locationHistory.unshift(historyItem)

    // Keep only last 100 locations
    this.locationHistory = this.locationHistory.slice(0, 100)

    this.saveLocationHistory()
    this.updateHistoryStats()
    this.displayLocationHistory()
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180)
  }

  toggleHistorySection() {
    const section = document.getElementById("historySection")
    this.isHistoryVisible = !this.isHistoryVisible

    if (this.isHistoryVisible) {
      section.classList.remove("hidden")
      this.displayLocationHistory()
      this.updateHistoryStats()
      document.getElementById("toggleHistoryBtn").innerHTML = '<i class="fas fa-eye-slash"></i>'
    } else {
      section.classList.add("hidden")
      document.getElementById("toggleHistoryBtn").innerHTML = '<i class="fas fa-eye"></i>'
    }
  }

  updateHistoryStats() {
    const totalLocations = this.locationHistory.length
    const totalDistance = this.locationHistory.reduce((sum, item) => {
      return sum + (item.distanceFromPrevious || 0)
    }, 0)

    const accuracies = this.locationHistory.filter((item) => item.accuracy).map((item) => item.accuracy)
    const averageAccuracy =
      accuracies.length > 0 ? accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length : 0

    document.getElementById("totalLocations").textContent = totalLocations
    document.getElementById("totalDistance").textContent = `${totalDistance.toFixed(1)} km`
    document.getElementById("averageAccuracy").textContent = `${Math.round(averageAccuracy)}m`
  }

  displayLocationHistory(filteredHistory = null) {
    const timeline = document.getElementById("historyTimeline")
    const noHistoryMessage = document.getElementById("noHistoryMessage")
    const history = filteredHistory || this.locationHistory

    if (history.length === 0) {
      noHistoryMessage.classList.remove("hidden")
      timeline.innerHTML = ""
      timeline.appendChild(noHistoryMessage)
      return
    }

    noHistoryMessage.classList.add("hidden")
    timeline.innerHTML = ""

    history.forEach((item, index) => {
      const timelineItem = this.createTimelineItem(item, index === 0)
      timeline.appendChild(timelineItem)
    })
  }

  createTimelineItem(item, isCurrent = false) {
    const div = document.createElement("div")
    div.className = `timeline-item ${isCurrent ? "current" : ""}`

    const date = new Date(item.timestamp)
    const timeString = date.toLocaleString()
    const relativeTime = this.getRelativeTime(date)

    div.innerHTML = `
      <div class="timeline-content" data-id="${item.id}">
        <div class="timeline-header">
          <div class="timeline-time">${relativeTime}</div>
          ${item.accuracy ? `<div class="timeline-accuracy">±${Math.round(item.accuracy)}m</div>` : ""}
        </div>
        
        <div class="timeline-location">
          ${item.city || "Unknown Location"}
        </div>
        
        ${item.address ? `<div class="timeline-address">${item.address}</div>` : ""}
        
        <div class="timeline-coordinates">
          ${item.latitude.toFixed(6)}, ${item.longitude.toFixed(6)}
        </div>
        
        ${
          item.distanceFromPrevious
            ? `<div class="timeline-distance">
            ${item.distanceFromPrevious.toFixed(2)} km from previous location
          </div>`
            : ""
        }
        
        <div class="timeline-actions">
          <span class="timeline-action" onclick="locationFinder.goToLocation(${item.latitude}, ${item.longitude})">
            <i class="fas fa-map-marker-alt"></i> Go Here
          </span>
          <span class="timeline-action" onclick="locationFinder.copyCoordinates(${item.latitude}, ${item.longitude})">
            <i class="fas fa-copy"></i> Copy
          </span>
          <span class="timeline-action" onclick="locationFinder.shareHistoryLocation('${item.id}')">
            <i class="fas fa-share"></i> Share
          </span>
          <span class="timeline-action" onclick="locationFinder.deleteHistoryItem('${item.id}')">
            <i class="fas fa-trash"></i> Delete
          </span>
        </div>
      </div>
    `

    // Add click event to timeline content
    div.querySelector(".timeline-content").addEventListener("click", (e) => {
      if (!e.target.closest(".timeline-action")) {
        this.goToLocation(item.latitude, item.longitude)
      }
    })

    return div
  }

  getRelativeTime(date) {
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`

    return date.toLocaleDateString()
  }

  filterHistory(filter) {
    const now = new Date()
    let filteredHistory = this.locationHistory

    switch (filter) {
      case "today":
        filteredHistory = this.locationHistory.filter((item) => {
          const itemDate = new Date(item.timestamp)
          return itemDate.toDateString() === now.toDateString()
        })
        break
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        filteredHistory = this.locationHistory.filter((item) => {
          return new Date(item.timestamp) >= weekAgo
        })
        break
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        filteredHistory = this.locationHistory.filter((item) => {
          return new Date(item.timestamp) >= monthAgo
        })
        break
      default:
        filteredHistory = this.locationHistory
    }

    this.displayLocationHistory(filteredHistory)
  }

  goToLocation(lat, lng) {
    this.currentLocation = {
      latitude: lat,
      longitude: lng,
      method: "history",
    }

    this.displayLocationData()
    this.initializeMap()
    this.showToast("Navigated to historical location", "success")
  }

  async copyCoordinates(lat, lng) {
    const coordinates = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    await this.copyToClipboard(coordinates, "Historical coordinates")
  }

  shareHistoryLocation(itemId) {
    const item = this.locationHistory.find((h) => h.id.toString() === itemId)
    if (!item) return

    const shareText = `Location from ${new Date(item.timestamp).toLocaleString()}: ${item.latitude.toFixed(6)}, ${item.longitude.toFixed(6)}`
    const shareUrl = `https://www.openstreetmap.org/?mlat=${item.latitude}&mlon=${item.longitude}&zoom=15`

    if (navigator.share) {
      navigator
        .share({
          title: "Historical Location",
          text: shareText,
          url: shareUrl,
        })
        .catch(() => {
          this.copyToClipboard(shareUrl, "Historical location URL")
        })
    } else {
      this.copyToClipboard(shareUrl, "Historical location URL")
    }
  }

  deleteHistoryItem(itemId) {
    if (confirm("Are you sure you want to delete this location from your history?")) {
      this.locationHistory = this.locationHistory.filter((item) => item.id.toString() !== itemId)
      this.saveLocationHistory()
      this.displayLocationHistory()
      this.updateHistoryStats()
      this.showToast("Location removed from history", "success")
    }
  }

  clearLocationHistory() {
    if (confirm("Are you sure you want to clear your entire location history? This cannot be undone.")) {
      this.locationHistory = []
      this.saveLocationHistory()
      this.displayLocationHistory()
      this.updateHistoryStats()
      this.showToast("Location history cleared", "success")
    }
  }

  exportHistory() {
    if (this.locationHistory.length === 0) {
      this.showToast("No history to export", "warning")
      return
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      totalLocations: this.locationHistory.length,
      locations: this.locationHistory,
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })

    const link = document.createElement("a")
    link.href = URL.createObjectURL(dataBlob)
    link.download = `location-history-${new Date().toISOString().split("T")[0]}.json`
    link.click()

    this.showToast("History exported successfully", "success")
  }

  showHistoryMap() {
    if (this.locationHistory.length === 0) {
      this.showToast("No history to display on map", "warning")
      return
    }

    // Create modal overlay
    const overlay = document.createElement("div")
    overlay.className = "history-map-overlay"
    overlay.innerHTML = `
      <div class="history-map-modal">
        <div class="history-map-header">
          <h3><i class="fas fa-route"></i> Location History Map</h3>
          <button class="close-history-map">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="history-map-container">
          <div id="historyMapView" class="history-map"></div>
        </div>
      </div>
    `

    document.body.appendChild(overlay)

    // Initialize history map
    setTimeout(() => {
      this.initializeHistoryMap()
    }, 100)

    // Close button event
    overlay.querySelector(".close-history-map").addEventListener("click", () => {
      document.body.removeChild(overlay)
      if (this.historyMap) {
        this.historyMap.remove()
        this.historyMap = null
      }
    })

    // Close on overlay click
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay)
        if (this.historyMap) {
          this.historyMap.remove()
          this.historyMap = null
        }
      }
    })
  }

  initializeHistoryMap() {
    if (this.locationHistory.length === 0) return

    // Get bounds for all locations
    const lats = this.locationHistory.map((item) => item.latitude)
    const lngs = this.locationHistory.map((item) => item.longitude)
    const bounds = [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ]

    // Initialize map
    this.historyMap = L.map("historyMapView").fitBounds(bounds, { padding: [20, 20] })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(this.historyMap)

    // Add markers for each location
    const colors = ["red", "blue", "green", "orange", "violet", "yellow", "black"]

    this.locationHistory.forEach((item, index) => {
      const color = colors[index % colors.length]
      const isRecent = index < 5

      const marker = L.circleMarker([item.latitude, item.longitude], {
        radius: isRecent ? 8 : 5,
        fillColor: color,
        color: "white",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      }).addTo(this.historyMap)

      const popupContent = `
        <div style="min-width: 200px;">
          <strong>${item.city || "Unknown Location"}</strong><br>
          <small>${new Date(item.timestamp).toLocaleString()}</small><br>
          <code>${item.latitude.toFixed(6)}, ${item.longitude.toFixed(6)}</code>
          ${item.accuracy ? `<br><small>Accuracy: ±${Math.round(item.accuracy)}m</small>` : ""}
          ${item.distanceFromPrevious ? `<br><small>Distance: ${item.distanceFromPrevious.toFixed(2)} km</small>` : ""}
        </div>
      `

      marker.bindPopup(popupContent)
    })

    // Draw path between locations
    if (this.locationHistory.length > 1) {
      const pathCoords = this.locationHistory.map((item) => [item.latitude, item.longitude])
      L.polyline(pathCoords, {
        color: "#4f46e5",
        weight: 3,
        opacity: 0.7,
        dashArray: "5, 10",
      }).addTo(this.historyMap)
    }
  }

  showToast(message, type = "success") {
    const container = document.getElementById("toastContainer")
    const toast = document.createElement("div")
    toast.className = `toast ${type}`
    toast.textContent = message

    container.appendChild(toast)

    // Auto remove after 3 seconds
    setTimeout(() => {
      toast.style.animation = "slideInRight 0.3s ease reverse"
      setTimeout(() => {
        if (container.contains(toast)) {
          container.removeChild(toast)
        }
      }, 300)
    }, 3000)
  }
}

// Make locationFinder globally accessible for timeline actions
let locationFinder

// Initialize the application when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  locationFinder = new LocationFinder()
})

// Service Worker registration for PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration)
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError)
      })
  })
}
