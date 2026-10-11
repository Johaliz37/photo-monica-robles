import SectionTitle from '@/components/SectionTitle'
import { profilePhotoUrl, showAboutSection, type PublicProfile } from '@/lib/profile'

/**
 * "Sobre mí", con el texto y la foto del perfil. Se oculta si está desactivado en
 * /admin/perfil o si no hay ni texto ni foto.
 */
export default function AboutMe({ profile }: { profile: PublicProfile }) {
  if (!showAboutSection(profile)) return null
  const photoUrl = profilePhotoUrl(import.meta.env.VITE_SUPABASE_URL, profile.photo_path)
  const about = profile.about.trim()

  return (
    <section aria-labelledby="sobre-mi" className="bg-white/40 px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <SectionTitle id="sobre-mi" script="Sobre mí">
          Conóceme
        </SectionTitle>
        {photoUrl && (
          <img
            src={photoUrl}
            alt={profile.full_name || 'Mónica Robles'}
            width={160}
            height={160}
            loading="lazy"
            className={`relative z-10 mx-auto size-36 rounded-full object-cover shadow-md ring-4 ring-gold-light sm:size-40 ${about ? '-mb-12' : ''}`}
          />
        )}
        {about && (
          <div
            className={`relative rounded-sm bg-cream/80 p-6 shadow-sm ring-1 ring-gold-light/50 sm:p-8 ${photoUrl ? 'pt-16 sm:pt-16' : ''}`}
          >
            {!photoUrl && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-6 left-4 font-script text-7xl leading-none text-gold-light"
              >
                “
              </span>
            )}
            <p className="text-sm leading-relaxed tracking-wide whitespace-pre-line sm:text-base">
              {about}
            </p>
            {profile.full_name && (
              <p className="mt-6 text-right font-script text-4xl text-gold-dark">
                {profile.full_name}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
