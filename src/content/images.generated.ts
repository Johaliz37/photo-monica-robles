// Generado por scripts/build-images.mjs (npm run images). No editar a mano.
export interface ImageSource {
  src: string
  width: number
}
export interface ImageAsset {
  width: number
  height: number
  srcSet: ImageSource[]
}

export const IMAGES = {
  "logo": {
    "width": 795,
    "height": 304,
    "srcSet": [
      {
        "src": "/img/logo-640.webp",
        "width": 640
      },
      {
        "src": "/img/logo-795.webp",
        "width": 795
      }
    ]
  },
  "hero": {
    "width": 1055,
    "height": 495,
    "srcSet": [
      {
        "src": "/img/hero-640.webp",
        "width": 640
      },
      {
        "src": "/img/hero-1055.webp",
        "width": 1055
      }
    ]
  },
  "pkg1": {
    "width": 1055,
    "height": 776,
    "srcSet": [
      {
        "src": "/img/pkg1-640.webp",
        "width": 640
      },
      {
        "src": "/img/pkg1-1055.webp",
        "width": 1055
      }
    ]
  },
  "pkg2": {
    "width": 1055,
    "height": 730,
    "srcSet": [
      {
        "src": "/img/pkg2-640.webp",
        "width": 640
      },
      {
        "src": "/img/pkg2-1055.webp",
        "width": 1055
      }
    ]
  },
  "pkg3": {
    "width": 1036,
    "height": 763,
    "srcSet": [
      {
        "src": "/img/pkg3-640.webp",
        "width": 640
      },
      {
        "src": "/img/pkg3-1036.webp",
        "width": 1036
      }
    ]
  },
  "cal-2": {
    "width": 535,
    "height": 687,
    "srcSet": [
      {
        "src": "/img/cal-2-535.webp",
        "width": 535
      }
    ]
  },
  "studio-1": {
    "width": 1066,
    "height": 1600,
    "srcSet": [
      {
        "src": "/img/studio-1-640.webp",
        "width": 640
      },
      {
        "src": "/img/studio-1-1066.webp",
        "width": 1066
      }
    ]
  },
  "studio-2": {
    "width": 1600,
    "height": 1066,
    "srcSet": [
      {
        "src": "/img/studio-2-640.webp",
        "width": 640
      },
      {
        "src": "/img/studio-2-1280.webp",
        "width": 1280
      }
    ]
  },
  "espadilla-pueblo": {
    "width": 1024,
    "height": 1536,
    "srcSet": [
      {
        "src": "/img/espadilla-pueblo-640.webp",
        "width": 640
      },
      {
        "src": "/img/espadilla-pueblo-960.webp",
        "width": 960
      },
      {
        "src": "/img/espadilla-pueblo-1024.webp",
        "width": 1024
      }
    ]
  },
  "espadilla-montanas": {
    "width": 2000,
    "height": 1429,
    "srcSet": [
      {
        "src": "/img/espadilla-montanas-640.webp",
        "width": 640
      },
      {
        "src": "/img/espadilla-montanas-960.webp",
        "width": 960
      },
      {
        "src": "/img/espadilla-montanas-1280.webp",
        "width": 1280
      },
      {
        "src": "/img/espadilla-montanas-1920.webp",
        "width": 1920
      }
    ]
  },
  "espadilla-ermita": {
    "width": 1024,
    "height": 1536,
    "srcSet": [
      {
        "src": "/img/espadilla-ermita-640.webp",
        "width": 640
      },
      {
        "src": "/img/espadilla-ermita-960.webp",
        "width": 960
      },
      {
        "src": "/img/espadilla-ermita-1024.webp",
        "width": 1024
      }
    ]
  },
  "espadilla-trineo": {
    "width": 540,
    "height": 253,
    "srcSet": [
      {
        "src": "/img/espadilla-trineo-540.webp",
        "width": 540
      }
    ]
  }
} as const satisfies Record<string, ImageAsset>

export type ImageName = keyof typeof IMAGES
