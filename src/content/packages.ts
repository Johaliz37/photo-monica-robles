import type { ImageName } from './images.generated'

export type PackageCode = 'P1' | 'P2' | 'P3'

export interface Package {
  code: PackageCode
  number: '01' | '02' | '03'
  /** Nombre comercial, fácil de recordar para el cliente. */
  name: string
  durationMin: number
  priceCents: number
  presalePriceCents: number
  items: string[]
  image: ImageName
  imageAlt: string
}

// Texto literal del PDF (páginas 2 a 4). La duración y los precios deben coincidir con la fase 3 (SQL).
export const PACKAGES: Package[] = [
  {
    code: 'P1',
    number: '01',
    name: 'Cajita de Recuerdos',
    durationMin: 30,
    priceCents: 8500,
    presalePriceCents: 7650,
    items: [
      '30 min. de sesión',
      '5 fotos editadas + retoque de piel profesional + eliminación de objetos y manchas',
      'Felicitación digital',
      '3 felicitaciones impresas tamaño 13x18',
      'Cajita + 5 fotografías impresas 13x18',
    ],
    image: 'pkg1',
    imageAlt:
      'Cajita navideña con marco de acebo y una fotografía de dos niños, junto a un sobre de papel vegetal',
  },
  {
    code: 'P2',
    number: '02',
    name: 'Kit Navideño',
    durationMin: 30,
    priceCents: 14500,
    presalePriceCents: 13050,
    items: [
      '30 min. de sesión',
      '10 fotografías editadas + retoque de piel profesional + eliminación de objetos y manchas',
      'Felicitación digital',
      '10 fotografías impresas 15 × 20 cm',
      '6 imanes 6 × 6 cm',
      '6 felicitaciones díptico 30 × 15 cm',
      'Pegatinas',
    ],
    image: 'pkg2',
    imageAlt:
      'Kit navideño sobre una mesa de madera: caja estampada, fotografías impresas, imanes, felicitaciones y pegatinas',
  },
  {
    code: 'P3',
    number: '03',
    name: 'Álbum de Navidad',
    durationMin: 45,
    priceCents: 19500,
    presalePriceCents: 17550,
    items: [
      '45 min de sesión',
      '15 fotos editadas + retoque de piel profesional + eliminación de objetos y manchas',
      'Felicitación digital',
      'Álbum tamaño 20x20 con 5 hojas',
      '6 calendarios de faldilla 10x15',
      '3 felicitaciones díptico 30x15',
    ],
    image: 'pkg3',
    imageAlt:
      'Álbum de tapa granate con lomo de cuadros escoceses, una foto de dos niños y el texto «Navidad 2026»',
  },
]

export function findPackage(code: string | null | undefined): Package | undefined {
  return PACKAGES.find((p) => p.code === code)
}
