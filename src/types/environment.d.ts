// Types globaux pour l'environnement

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test'
    NEXT_PUBLIC_APP_URL?: string
    NEXT_PUBLIC_APP_NAME?: string
    NEXT_PUBLIC_ENABLE_ANALYTICS?: string
    ANALYZE?: string
    PORT?: string
    HOSTNAME?: string
  }
}

// Types pour les APIs Web
declare interface Window {
  // Performance monitoring
  performanceMonitor?: {
    startTimer: (name: string) => () => void
    getWebVitalsReport: () => any
    logMetric: (name: string, value: number) => void
  }
  
  // Development tools
  __REACT_DEVTOOLS_GLOBAL_HOOK__?: any
  
  // Analytics (si ajouté plus tard)
  gtag?: (...args: any[]) => void
  dataLayer?: any[]
}

// Types pour les modules sans déclarations
declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>
  export default content
}

declare module '*.png' {
  const content: string
  export default content
}

declare module '*.jpg' {
  const content: string
  export default content
}

declare module '*.jpeg' {
  const content: string
  export default content
}

declare module '*.gif' {
  const content: string
  export default content
}

declare module '*.webp' {
  const content: string
  export default content
}

declare module '*.ico' {
  const content: string
  export default content
}

// Types pour les fichiers CSS modules (si utilisés)
declare module '*.module.css' {
  const classes: { readonly [key: string]: string }
  export default classes
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string }
  export default classes
}

// Types pour Web Vitals
declare module 'web-vitals' {
  export interface Metric {
    name: string
    value: number
    delta: number
    id: string
    navigationType: 'navigate' | 'reload' | 'back_forward' | 'prerender'
  }

  export type ReportHandler = (metric: Metric) => void

  export function getCLS(onReport: ReportHandler): void
  export function getFID(onReport: ReportHandler): void
  export function getFCP(onReport: ReportHandler): void
  export function getLCP(onReport: ReportHandler): void
  export function getTTFB(onReport: ReportHandler): void
}

// Types utilitaires
export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type NonNullable<T> = T extends null | undefined ? never : T