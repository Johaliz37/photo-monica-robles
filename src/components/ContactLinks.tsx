import type { ComponentType } from 'react'
import {
  socialLinks,
  telHref,
  whatsappUrl,
  type PublicProfile,
  type SocialLink,
} from '@/lib/profile'
import { FacebookIcon, InstagramIcon, MailIcon, PhoneIcon, TikTokIcon } from './SocialIcons'
import WhatsAppIcon from './WhatsAppIcon'

const SOCIAL_ICON: Record<SocialLink['network'], ComponentType<{ className?: string }>> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  tiktok: TikTokIcon,
}

type Item = {
  key: string
  label: string
  text: string
  href: string
  external: boolean
  Icon: ComponentType<{ className?: string }>
  iconClass?: string
}

function contactItems(profile: PublicProfile): Item[] {
  const items: Item[] = socialLinks(profile).map((s) => ({
    key: s.network,
    label: s.label,
    text: s.handle,
    href: s.url,
    external: true,
    Icon: SOCIAL_ICON[s.network],
  }))
  if (profile.phone) {
    items.push(
      {
        key: 'whatsapp',
        label: 'WhatsApp',
        text: 'WhatsApp',
        href: whatsappUrl(profile.phone),
        external: true,
        Icon: WhatsAppIcon,
        iconClass: 'text-whatsapp',
      },
      {
        key: 'phone',
        label: 'Teléfono',
        text: profile.phone,
        href: telHref(profile.phone),
        external: false,
        Icon: PhoneIcon,
      },
    )
  }
  if (profile.email) {
    items.push({
      key: 'email',
      label: 'Email',
      text: profile.email,
      href: `mailto:${profile.email}`,
      external: false,
      Icon: MailIcon,
    })
  }
  return items
}

type Props = {
  profile: PublicProfile
  /** "full": icono y texto (CTA final). "icons": solo iconos (pie de página). */
  variant: 'full' | 'icons'
  className?: string
}

/** Redes sociales, WhatsApp, teléfono y email del perfil (solo los que estén rellenos). */
export default function ContactLinks({ profile, variant, className = '' }: Props) {
  const items = contactItems(profile)
  if (items.length === 0) return null

  return (
    <ul className={className}>
      {items.map(({ key, label, text, href, external, Icon, iconClass }) => (
        <li key={key}>
          <a
            href={href}
            {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
            aria-label={variant === 'icons' ? `${label}: ${text}` : undefined}
            className={
              variant === 'icons'
                ? 'inline-flex size-11 items-center justify-center rounded-full transition hover:bg-cream hover:text-gold-dark'
                : 'inline-flex min-h-11 items-center gap-3 font-display tracking-[0.1em] break-all text-gold-dark hover:text-ink'
            }
          >
            <Icon
              className={`${variant === 'icons' ? 'size-5' : 'size-6'} shrink-0 ${iconClass ?? ''}`}
            />
            {variant === 'full' && text}
          </a>
        </li>
      ))}
    </ul>
  )
}
