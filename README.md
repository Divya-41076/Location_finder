# 📍 Location Finder (React)

A lightweight and intuitive **location finder** built with **React**.  
This app lets users either retrieve their current geographical location or search for places anywhere in the world, displaying helpful details alongside an embedded map view.

---

## 🌐 Demo

👉 [Live App on Vercel](https://v0-react-location-finder.vercel.app/)

---

## ✨ Features

- **Get My Location** – Access your device’s GPS to display your current latitude and longitude (when supported).  
- **Search Location** – Enter any place name to retrieve detailed place information globally.  
- **Display Location Details** – View coordinates, human-readable address, and an embedded map preview.  
- **Clean and Responsive UI** – User-friendly interface that adjusts to different device sizes.  

---

## 🛠️ Built With

- **React.js** – Frontend framework for managing UI components and state  
- **Geolocation API** – To fetch the user’s current coordinates  
- **OpenStreetMap / Nominatim API** – For reverse geocoding and search functionalities  
- **CSS (or Styled Components)** – For styling and layout  

---

## Getting started

Prerequisites
Node.js (v14+) & npm or yarn installed on your machine.

---

## 📖 Usage

Click “Get My Location” to fetch your current location (allow browser permission).

Or, type a place name in the search field and click Search.

Once data loads, your coordinates, address, and an embedded map will appear.

---
## 🚧 Future Enhancements

Quick Wins
📋 Copy to Clipboard – Buttons to copy coordinates or share links.

🌗 Dark/Light Mode – Theme toggle for accessibility.

🛑 Better Error Messages – Friendly feedback for denied permissions, API issues, or offline state.

---

## Advanced Features

🗺️ Interactive Map – Integrate Leaflet.js or Mapbox with zoom & draggable markers.

📌 Multiple Search Results – Select from a list when multiple matches are found.

🕒 Recent Searches – Save searches locally for quick re-access.

📱 PWA Support – Enable offline mode & app installation.

🌐 Backend Proxy – Use Node.js/Express to handle API calls & caching.

---
## 🙌 Credits

Built using modern frontend tools: React, Geolocation API, and OpenStreetMap/Nominatim

Hosted with Vercel for seamless deployment

