const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
const tile = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

document.querySelectorAll('div.leaflet-map').forEach(map => {
  const viewLat = map.getAttribute('data-leaflet-view-lat')
  const viewLong = map.getAttribute('data-leaflet-view-long')
  const zoom = map.getAttribute('data-leaflet-view-zoom')
  const popup = map.getAttribute('data-leaflet-popup-caption')
  const popupLat = map.getAttribute('data-leaflet-popup-lat')
  const popupLong = map.getAttribute('data-leaflet-popup-long')
  const view = [viewLat, viewLong]

  if (viewLat === null || viewLong === null || zoom === null) {
    console.error('leaflet-map.js: expected lat, long, and zoom')
  } else {
    const bind = L.map(map).setView(view, zoom)
    L.tileLayer(tile, { attribution }).addTo(bind)

    if (popup !== null && popupLat !== null && popupLong !== null) {
      L.marker([popupLat, popupLong]).addTo(bind)
        .bindPopup(popup)
        .openPopup()
    }
  }
})
