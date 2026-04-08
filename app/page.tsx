"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"

export default function Home() {
  const [reels, setReels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [viewCount, setViewCount] = useState(0)

  const feedRef = useRef<HTMLDivElement | null>(null)
  const lastY = useRef(0)

  useEffect(() => {
    fetchReels()
  }, [])

  // 🔥 PROPER SHUFFLE
  const shuffleArray = (array: any[], currentId?: string) => {
    const newArray = [...array]

    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }

    if (currentId && newArray[0]?.id === currentId && newArray.length > 1) {
      ;[newArray[0], newArray[1]] = [newArray[1], newArray[0]]
    }

    return newArray
  }

  const fetchReels = async () => {
    const { data } = await supabase.from("reels").select("*")
    if (data) setReels(shuffleArray(data))
    setLoading(false)
  }

  // 🔄 Auto refresh
  useEffect(() => {
    if (viewCount !== 0 && viewCount % 5 === 0) {
      const current = reels[activeIndex % reels.length]
      setReels(shuffleArray(reels, current?.id))

      if (feedRef.current) {
        feedRef.current.scrollTop = 0
      }

      setActiveIndex(0)
    }
  }, [viewCount])

  if (loading) {
    return <div className="bg-black text-white h-screen flex items-center justify-center">Loading...</div>
  }

  if (reels.length === 0) {
    return <div className="bg-black text-white h-screen flex items-center justify-center">No reels found</div>
  }

  const extendedReels = [...reels, ...reels, ...reels]

  return (
    <div className="bg-black text-white h-screen w-screen relative overflow-hidden">

      <div
        ref={feedRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
        onScroll={(e) => {
          const scrollTop = e.currentTarget.scrollTop
          const height = window.innerHeight
          const index = Math.round(scrollTop / height)

          if (index !== activeIndex) {
            setActiveIndex(index % reels.length)
            setViewCount((prev) => prev + 1)

            if (feedRef.current) {
              feedRef.current.scrollTo({
                top: index * height,
                behavior: "smooth",
              })
            }
          }

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
            <div key={index} className="h-screen w-screen flex items-center justify-center snap-start relative bg-black">
              {activeIndex === currentIndex && (
                <iframe
                  key={activeIndex}
                  src={`https://www.instagram.com/reel/${reelId}/embed/captioned`}
                  className="w-full h-full border-0"
                  allow="autoplay; encrypted-media"
                />
              )}
            </div>
          )
        })}
      </div>

      {/* CONTROLS */}
      <div className="absolute top-4 right-[50px] flex flex-col gap-2 z-50">

        <button
          onClick={() => {
            const current = reels[activeIndex % reels.length]
            const shuffled = shuffleArray(reels, current?.id)

            setReels(shuffled)

            if (feedRef.current) {
              feedRef.current.scrollTop = 0
            }

            setActiveIndex(0)
          }}
          className="bg-white/10 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full"
        >
          Shuffle
        </button>

        <button
          onClick={async () => {
            if (!confirm("Delete this reel?")) return

            const current = reels[activeIndex % reels.length]
            if (!current) return

            await supabase.from("reels").delete().eq("id", current.id)
            fetchReels()
          }}
          className="bg-white/10 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full"
        >
          Delete
        </button>

      </div>

      {/* SCROLL STRIP */}
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
