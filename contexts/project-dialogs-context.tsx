"use client"

import { createContext, useContext } from "react"

interface ProjectDialogsContextValue {
  openCreate: () => void
}

export const ProjectDialogsContext = createContext<ProjectDialogsContextValue>({
  openCreate: () => {},
})

export function useProjectDialogsContext() {
  return useContext(ProjectDialogsContext)
}
