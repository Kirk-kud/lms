'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ClassRecord } from '@/lib/hooks/useClasses'

interface TutorClassContextValue {
  classes: ClassRecord[]
  selectedClassId: string | null
  selectedClass: ClassRecord | null
  cohortId: string | null
  setSelectedClassId: (id: string) => void
}

const TutorClassContext = createContext<TutorClassContextValue>({
  classes: [],
  selectedClassId: null,
  selectedClass: null,
  cohortId: null,
  setSelectedClassId: () => {},
})

export function TutorClassProvider({
  classes,
  children,
}: {
  classes: ClassRecord[]
  children: React.ReactNode
}) {
  const [selectedClassId, setSelectedClassIdState] = useState<string | null>(
    () => (typeof window !== 'undefined' ? localStorage.getItem('tutor_selected_class') : null),
  )

  // Default to first class if nothing stored
  useEffect(() => {
    if (!selectedClassId && classes.length > 0) {
      setSelectedClassIdState(classes[0].id)
    }
  }, [classes, selectedClassId])

  const setSelectedClassId = (id: string) => {
    setSelectedClassIdState(id)
    if (typeof window !== 'undefined') {
      localStorage.setItem('tutor_selected_class', id)
    }
  }

  const selectedClass = classes.find((c) => c.id === selectedClassId) ?? null
  const cohortId = selectedClass?.cohort_id ?? null

  return (
    <TutorClassContext.Provider
      value={{ classes, selectedClassId, selectedClass, cohortId, setSelectedClassId }}
    >
      {children}
    </TutorClassContext.Provider>
  )
}

export function useTutorClass() {
  return useContext(TutorClassContext)
}
