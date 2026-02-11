'use client'

const basePath = '/models'

const customerLogos = [
  { src: '/assets/Phreesia.png', alt: 'Phreesia' },
  { src: '/assets/Snorkel.png', alt: 'Snorkel AI' },
  { src: '/assets/Bain.png', alt: 'Bain & Company' },
  { src: '/assets/Paloalto.png', alt: 'Palo Alto Networks' },
  { src: '/assets/Postman.png', alt: 'Postman' },
  { src: '/assets/Perficient.png', alt: 'Perficient' },
  { src: '/assets/Internet 2.png', alt: 'Internet2' },
  { src: '/assets/RVO Health.png', alt: 'RVO Health' },
  { src: '/assets/Qure.png', alt: 'Qure.ai' },
  { src: '/assets/HackerRank.png', alt: 'HackerRank' },
  { src: '/assets/Clearcover.png', alt: 'Clearcover' },
  { src: '/assets/Cyera.png', alt: 'Cyera' },
  { src: '/assets/Qoala.png', alt: 'Qoala' },
  { src: '/assets/Syngenta.png', alt: 'Syngenta' },
]

export default function LogoRibbon() {
  return (
    <section className="py-6 overflow-hidden bg-bg-base">
      <div className="text-center mb-4">
        <p className="text-xs text-text-muted uppercase tracking-[0.2em] font-medium">
          Trusted by leading teams
        </p>
      </div>
      
      <div className="relative">
        {/* Gradient Masks */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-bg-base to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-bg-base to-transparent z-10 pointer-events-none" />
        
        {/* Scrolling Container */}
        <div className="flex animate-scroll-x">
          {/* First set of logos */}
          <div className="flex items-center gap-14 shrink-0 px-6">
            {customerLogos.map((logo, index) => (
              <div key={`logo-1-${index}`} className="flex items-center justify-center flex-shrink-0">
                <img 
                  src={`${basePath}${logo.src}`}
                  alt={logo.alt}
                  width={140}
                  height={48}
                  className="h-8 w-auto object-contain opacity-50 grayscale hover:opacity-80 hover:grayscale-0 transition-all duration-300"
                />
              </div>
            ))}
          </div>
          
          {/* Duplicate for seamless loop */}
          <div className="flex items-center gap-14 shrink-0 px-6">
            {customerLogos.map((logo, index) => (
              <div key={`logo-2-${index}`} className="flex items-center justify-center flex-shrink-0">
                <img 
                  src={`${basePath}${logo.src}`}
                  alt={logo.alt}
                  width={140}
                  height={48}
                  className="h-8 w-auto object-contain opacity-50 grayscale hover:opacity-80 hover:grayscale-0 transition-all duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
