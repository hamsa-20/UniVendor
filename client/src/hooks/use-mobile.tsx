import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    try {
      // First set based on window size
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      
      // Then setup listener for changes
      if (typeof window !== 'undefined' && window.matchMedia) {
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
        
        const onChange = () => {
          setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
        }
        
        // Modern browsers
        if (mql.addEventListener) {
          mql.addEventListener("change", onChange)
          return () => mql.removeEventListener("change", onChange)
        } 
        // Safari and older browsers
        else if (mql.addListener) {
          mql.addListener(onChange)
          return () => mql.removeListener(onChange)
        }
      }
    } catch (error) {
      console.error("Error setting up mobile detection:", error)
    }
  }, [])

  return isMobile
}
