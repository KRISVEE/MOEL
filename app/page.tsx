"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"

export default function Home() {
  const [reels, setReels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)

  const feedRef = useRef<HTMLDivElement | null>(null)
  const lastY = useRef(0)

  useEffect(() => {
    fetchReels()
  }, [])

  // 🎲 Shuffle
  const shuffleArray = (array: any[]) => {
    return [...array].sort(() => Math.random() - 0.5)
  }

  const fetchReels = async () => {
    const { data, error } = await supabase
      .from("reels")
      .select("*")

    if (!error && data) {
      setReels(shuffleArray(data))
    }

    setLoading(false)
  }

  // 🔄 Loading
  if (loading) {
    return (
      <div className="bg-black text-white h-screen flex items-center justify-center">
        Loading...
      </div>
    )
  }

  // ❌ Empty
  if (reels.length === 0) {
    return (
      <div className="bg-black text-white h-screen flex items-center justify-center">
        No reels found
      </div>
    )
  }

  // 🔁 Infinite list
  const extendedReels = [...reels, ...reels, ...reels]

  return (
    <div className="bg-black text-white h-screen w-screen relative overflow-hidden">

      {/* 📺 FEED */}
      <div
        ref={feedRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
        onScroll={(e) => {
          const scrollTop = e.currentTarget.scrollTop
          const height = window.innerHeight
          const index = Math.round(scrollTop / height)

          setActiveIndex(index % reels.length)

          // 🔁 Reset scroll for infinite feel
          if (feedRef.current) {
            const maxScroll = reels.length * height
            if (feedRef.current.scrollTop > maxScroll * 2) {
              feedRef.current.scrollTop = maxScroll
            }
          }
        }}
      >
        {extendedReels.map((reel, index) => {
          const reelId = reel.url.match(/reel\/([^/?]+)/)?.[1]
          if (!reelId) return null

          const currentIndex = index % reels.length

          return (
            <div
              key={index}
              className="h-screen w-screen flex items-center justify-center snap-start relative bg-black"
            >
              {/* 🎥 ONLY ACTIVE REEL */}
              {activeIndex === currentIndex && (
                <iframe
                  key={activeIndex} // 🔥 force reset
                  src={`https://www.instagram.com/reel/${reelId}/embed/captioned`}
                  className="w-full h-full border-0"
                  allow="autoplay; encrypted-media"
                />
              )}
            </div>
          )
        })}
      </div>

      {/* 🎛️ CONTROLS */}
      <div className="absolute top-4 right-[50px] flex flex-col gap-2 z-50">

        {/* 🔀 Shuffle */}
        <button
          onClick={() => setReels(shuffleArray(reels))}
          className="bg-white/10 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full opacity-70 hover:opacity-100 transition"
        >
          Shuffle
        </button>

        {/* 🗑 Delete current */}
        <button
          onClick={async () => {
            const current = reels[activeIndex % reels.length]
            if (!current) return

            await supabase.from("reels").delete().eq("id", current.id)
            fetchReels()
          }}
          className="bg-white/10 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full opacity-70 hover:opacity-100 transition"
        >
          Delete
        </button>

      </div>

      {/* 👉 RIGHT SCROLL STRIP */}
      <div
        className="absolute top-0 right-0 h-full w-[40px] z-40 bg-white/5"
        onTouchStart={(e) => {
          lastY.current = e.touches[0].clientY
        }}
        onTouchMove={(e) => {
          const currentY = e.touches[0].clientY
          const diff = lastY.current - currentY

          if (feedRef.current) {
            feedRef.current.scrollTop += diff
          }

          lastY.current = currentY
        }}
      />

    </div>
  )
}