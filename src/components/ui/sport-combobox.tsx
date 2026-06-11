"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { Search, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

const SPORT_LIBRARY: { category: string; sports: string[] }[] = [
  { category: 'Team sports', sports: ['Football', 'Futsal', 'Basketball', 'Volleyball', 'Handball', 'Hockey', 'Floorball', 'Bandy', 'Rugby', 'Baseball', 'Softball', 'American Football', 'Lacrosse', 'Water Polo', 'Cricket'] },
  { category: 'Racket sports', sports: ['Tennis', 'Padel', 'Badminton', 'Squash', 'Table Tennis', 'Pickleball'] },
  { category: 'Combat / martial arts', sports: ['Boxing', 'Kickboxing', 'Wrestling', 'Judo', 'BJJ', 'MMA', 'Fencing'] },
  { category: 'Dance & gymnastics', sports: ['Dance', 'Gymnastics', 'Cheerleading', 'Aerobics'] },
  { category: 'Other group activities', sports: ['CrossFit', 'Yoga', 'Pilates', 'Climbing', 'Rowing', 'Kayaking', 'Horse Riding', 'Martial Arts'] },
]

interface SportComboboxProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
}

export function SportCombobox({ value, onValueChange, placeholder = "Search sports..." }: SportComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const filteredLibrary = SPORT_LIBRARY.map(cat => ({
    ...cat,
    sports: cat.sports.filter(s => s.toLowerCase().includes(query.toLowerCase())),
  })).filter(cat => cat.sports.length > 0)

  const totalMatches = filteredLibrary.reduce((sum, cat) => sum + cat.sports.length, 0)

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-xl border bg-background px-3 py-2 text-sm transition-colors",
          "hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring",
          !value && "text-muted-foreground"
        )}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner sideOffset={4} className="z-50 w-[var(--anchor-width)]">
          <PopoverPrimitive.Popup
            className="w-full rounded-xl border bg-card shadow-lg animate-in fade-in-0 zoom-in-95"
          >
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search sports..."
                className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="max-h-52 overflow-y-auto p-1">
              {totalMatches === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No matches found.</p>
              ) : (
                filteredLibrary.map(cat => (
                  <div key={cat.category}>
                    <p className="px-2 pt-2 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                      {cat.category}
                    </p>
                    {cat.sports.map(sport => (
                      <button
                        key={sport}
                        onClick={() => {
                          onValueChange(sport)
                          setOpen(false)
                          setQuery("")
                        }}
                        className={cn(
                          "relative flex w-full cursor-pointer select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-sm outline-none transition-colors",
                          "hover:bg-muted/50",
                          value === sport && "bg-primary/10 text-primary font-semibold"
                        )}
                      >
                        {value === sport && (
                          <Check className="absolute left-2 h-4 w-4" />
                        )}
                        {sport}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
