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
  "cal-1": {
    "width": 514,
    "height": 1492,
    "srcSet": [
      {
        "src": "/img/cal-1-514.webp",
        "width": 514
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
    "width": 463,
    "height": 540,
    "srcSet": [
      {
        "src": "/img/espadilla-pueblo-463.webp",
        "width": 463
      }
    ]
  },
  "espadilla-montanas": {
    "width": 648,
    "height": 303,
    "srcSet": [
      {
        "src": "/img/espadilla-montanas-640.webp",
        "width": 640
      },
      {
        "src": "/img/espadilla-montanas-648.webp",
        "width": 648
      }
    ]
  },
  "espadilla-ermita": {
    "width": 361,
    "height": 355,
    "srcSet": [
      {
        "src": "/img/espadilla-ermita-361.webp",
        "width": 361
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
