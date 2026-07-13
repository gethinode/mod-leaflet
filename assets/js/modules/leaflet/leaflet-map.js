const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
const tile = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

// How long a gesture hint stays on screen after the gesture that triggered it.
const hintTimeout = 2000

// Apple keyboards zoom with the command key, everything else with control.
const modifier = /mac|iphone|ipad|ipod/i.test(navigator.userAgentData?.platform || navigator.platform || '')
  ? '⌘'
  : 'Ctrl'

// Overlay explaining why the map ignored the gesture. It is advisory only, so it stays
// hidden from assistive technology: a keyboard user reaches the zoom buttons instead and
// never triggers it.
function createHint (container) {
  const hint = document.createElement('div')
  hint.className = 'leaflet-gesture-hint'
  hint.setAttribute('aria-hidden', 'true')
  container.appendChild(hint)

  let timer = null
  return {
    show (message) {
      hint.textContent = message
      hint.classList.add('leaflet-gesture-hint-visible')
      clearTimeout(timer)
      timer = setTimeout(() => hint.classList.remove('leaflet-gesture-hint-visible'), hintTimeout)
    },
    hide () {
      clearTimeout(timer)
      hint.classList.remove('leaflet-gesture-hint-visible')
    }
  }
}

// Cooperative gestures: the map only claims a gesture that is unambiguously meant for it, so
// scrolling the page past the map is never trapped. A plain wheel and a single finger belong
// to the page; Ctrl/Cmd + wheel zooms, and two fingers pan and pinch-zoom.
//
// Every listener runs in the capture phase, which is what makes this work: Leaflet binds its
// own handlers deeper in the tree, so stopping the event here — or withdrawing the handler
// here — settles the gesture before Leaflet ever sees it.
function bindGestures (map, container, messages) {
  const hint = createHint(container)

  container.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
      hint.hide()
      return
    }
    e.stopPropagation()
    hint.show(messages.zoom)
  }, { capture: true, passive: true })

  // Dragging stays enabled for the mouse and is withdrawn only for the duration of a
  // one-finger touch, which is a page scroll rather than a pan.
  container.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) {
      hint.hide()
      map.dragging.enable()
    } else {
      map.dragging.disable()
    }
  }, { capture: true, passive: true })

  container.addEventListener('touchmove', (e) => {
    if (e.touches.length < 2) hint.show(messages.drag)
  }, { capture: true, passive: true })

  container.addEventListener('touchend', (e) => {
    if (e.touches.length === 0) map.dragging.enable()
  }, { capture: true, passive: true })
}

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

    // The shortcode renders the hints so they stay translatable. Only the modifier is
    // resolved here, because it depends on the visitor's platform.
    const zoomHint = map.getAttribute('data-leaflet-hint-zoom')
    const dragHint = map.getAttribute('data-leaflet-hint-drag')
    if (zoomHint !== null && dragHint !== null) {
      bindGestures(bind, map, {
        zoom: zoomHint.replace('{modifier}', modifier),
        drag: dragHint
      })
    }
  }
})
