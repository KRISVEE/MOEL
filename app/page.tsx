"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { Shuffle, Trash2 } from "lucide-react"

export default function Home() {
  const [reels, setReels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [viewCount, setViewCount] = useState(0)

  const feedRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    fetchReels()
  }, [])

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
    return (
      <div className="bg-black text-white h-screen flex items-center justify-center">
        Loading...
      </div>
    )
  }

  if (reels.length === 0) {
    return (
      <div className="bg-black text-white h-screen flex items-center justify-center">
        No reels found
      </div>
    )
  }

  const extendedReels = [...reels, ...reels, ...reels]

  return (
    <div className="bg-black text-white h-screen w-screen relative overflow-hidden">

      {/* FEED */}
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
            <div
              key={index}
              className="h-screen w-screen flex items-center justify-center snap-start relative bg-black"
            >
              {activeIndex === currentIndex && (
                <iframe
                  key={activeIndex}
                  src={`https://www.instagram.com/reel/${reelId}/embed/captioned`}
                  className="w-full h-full border-0"
                  allow="autoplay; encrypted-media"
                />
              )}

              {viewCount % 5 === 4 && (
                <div className="absolute bottom-10 text-white/40 text-xs">
                  Refreshing...
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* CONTROLS (VISIBLE ALWAYS) */}
      <div className="absolute top-4 right-4 flex flex-col gap-3 z-50">

        {/* Shuffle */}
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
          className="bg-black/40 backdrop-blur-xl border border-white/20 text-white p-2 rounded-full shadow-lg active:scale-95 transition"
        >
          <Shuffle size={16} />
        </button>

        {/* Delete */}
        <button
          onClick={async () => {
            if (!confirm("Delete this reel?")) return

            const current = reels[activeIndex % reels.length]
            if (!current) return

            await supabase.from("reels").delete().eq("id", current.id)
            fetchReels()
          }}
          className="bg-black/40 backdrop-blur-xl border border-white/20 text-white p-2 rounded-full shadow-lg active:scale-95 transition"
        >
          <Trash2 size={16} />
        </button>

      </div>

    </div>
  )
}
