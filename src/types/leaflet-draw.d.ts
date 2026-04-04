/* eslint-disable @typescript-eslint/no-namespace */
import 'leaflet'

declare module 'leaflet' {
  namespace Draw {
    class Polygon extends Handler {
      constructor(map: Map, options?: DrawOptions.PolygonOptions)
      enable(): void
      disable(): void
    }
    namespace Event {
      const CREATED: string
    }
  }

  namespace DrawOptions {
    interface PolygonOptions {
      shapeOptions?: PathOptions
    }
  }

  namespace DrawEvents {
    interface Created {
      layer: Layer
      layerType: string
    }
  }

  namespace Control {
    class Draw extends Control {
      constructor(options?: DrawControlOptions)
    }
  }

  interface DrawControlOptions {
    edit?: {
      featureGroup: FeatureGroup
      edit?: boolean
      remove?: boolean
    }
    draw?: {
      polygon?: DrawOptions.PolygonOptions | boolean
      rectangle?: boolean
      circle?: boolean
      marker?: boolean
      polyline?: boolean
      circlemarker?: boolean
    }
  }
}
