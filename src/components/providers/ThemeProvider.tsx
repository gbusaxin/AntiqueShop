'use client'

import {useEffect, useState, type ReactNode} from 'react'

type Theme = 'light' | 'dark'

export function ThemeProvider({children}: {children: ReactNode}) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('theme') as Theme | null
    const nextTheme = savedTheme ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    setTheme(nextTheme)
    document.documentElement.classList.toggle('dark', nextTheme === 'dark')
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem('theme', theme)
  }, [theme])

  return <ThemeContext.Provider value={{theme, setTheme}}>{children}</ThemeContext.Provider>
}

import {createContext, useContext} from 'react'

const ThemeContext = createContext<{theme: Theme; setTheme: (theme: Theme) => void}>({theme: 'dark', setTheme: () => undefined})
export const useTheme = () => useContext(ThemeContext)
