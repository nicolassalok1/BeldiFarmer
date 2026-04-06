export function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW registration failed — not critical
      })
    })
  }
}

/**
 * Pre-cache map tiles for a bounding box at multiple zoom levels.
 * This allows the user to browse the map offline in the field.
 */
export function cacheTilesForBounds(
  bounds: { south: number; north: number; west: number; east: number },
  minZoom: number,
  maxZoom: number,
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  return new Promise((resolve) => {
    const tileUrls: string[] = []

    for (let z = minZoom; z <= maxZoom; z++) {
      const minTile = latLngToTile(bounds.north, bounds.west, z)
      const maxTile = latLngToTile(bounds.south, bounds.east, z)

      for (let x = minTile.x; x <= maxTile.x; x++) {
        for (let y = minTile.y; y <= maxTile.y; y++) {
          // Google Satellite
          tileUrls.push(`https://mt1.google.com/vt/lyrs=s&x=${x}&y=${y}&z=${z}`)
        }
      }
    }

    if (!tileUrls.length) { resolve(); return }

    // Listen for progress from service worker
    const handler = (event: MessageEvent) => {
      if (event.data.type === 'CACHE_PROGRESS') {
        onProgress?.(event.data.done, event.data.total)
        if (event.data.done >= event.data.total) {
          navigator.serviceWorker.removeEventListener('message', handler)
          resolve()
        }
      }
    }
    navigator.serviceWorker.addEventListener('message', handler)

    // Send tiles to SW for caching
    navigator.serviceWorker.controller?.postMessage({
      type: 'CACHE_TILES',
      tiles: tileUrls,
    })

    // Timeout fallback
    setTimeout(() => {
      navigator.serviceWorker.removeEventListener('message', handler)
      resolve()
    }, 120000)
  })
}

function latLngToTile(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom)
  const x = Math.floor(((lng + 180) / 360) * n)
  const latRad = (lat * Math.PI) / 180
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n)
  return { x, y }
}

export function isOnline(): boolean {
  return navigator.onLine
}

export function estimateTileCount(
  bounds: { south: number; north: number; west: number; east: number },
  minZoom: number,
  maxZoom: number
): number {
  let count = 0
  for (let z = minZoom; z <= maxZoom; z++) {
    const minTile = latLngToTile(bounds.north, bounds.west, z)
    const maxTile = latLngToTile(bounds.south, bounds.east, z)
    count += (maxTile.x - minTile.x + 1) * (maxTile.y - minTile.y + 1)
  }
  return count
}
