'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import globalBlack from '@/public/global_black.png'
import globalWhite from '@/public/global_white.png'

const SLIDES = [
  { src: '/photos/gathering-crowd.jpg', caption: 'Fellowship' },
  { src: '/photos/worship-hands-raised.jpg', caption: 'Worship - Ashesi' },
  { src: '/photos/fire-night-ashesi.jpg', caption: 'Fire Night - Ashesi' },
  { src: '/photos/listening.jpg', caption: 'In Session' },
  { src: '/photos/knust-worship.jpg', caption: 'Apostolos KNUST' },
]

export function PhotoCarousel() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % SLIDES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div
      className="hidden md:block w-1/2 relative overflow-hidden bg-black"
      style={{ height: '100vh', flexShrink: 0 }}
    >
      {SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: i === active ? 1 : 0,
            transition: 'opacity 800ms ease-in-out',
          }}
        >
          <Image
            src={slide.src}
            alt={slide.caption}
            fill
            sizes="50vw"
            style={{ objectFit: 'cover' }}
            priority={i === 0}
          />
        </div>
      ))}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
          zIndex: 10,
        }}
      />

      <div style={{ position: 'absolute', top: '24px', left: '28px', zIndex: 20 }}>
        <Image
          src={globalWhite}
          alt="Love Inc"
          width={60}
          height={40}
          style={{ display: 'block', width: 'auto', height: '100px' }}
        />
      </div>

      <div style={{ position: 'absolute', bottom: '28px', left: '28px', zIndex: 20 }}>
        <p style={{ color: 'white', fontSize: '13px', fontWeight: 400, marginBottom: '10px' }}>
          {SLIDES[active].caption}
        </p>
        <div style={{ display: 'flex', gap: '6px' }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Go to slide ${i + 1}`}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: i === active ? 'white' : 'rgba(255,255,255,0.4)',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'background-color 300ms ease',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
