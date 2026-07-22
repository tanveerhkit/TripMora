import { useEffect, useState, type ReactNode } from 'react'
import { useLocationImage } from '../../hooks/useLocationImage'
import { Icon } from './Icon'
import styles from './LocationImage.module.css'

interface Props {
  /** place name, e.g. "Bali" or "Kyoto, Japan" */
  query: string
  alt: string
  className?: string
  /** overlaid content (name, badges) rendered on top of the image */
  children?: ReactNode
}

export function LocationImage({ query, alt, className = '', children }: Props) {
  const { status, url } = useLocationImage(query)
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)

  // Reset per-image load state whenever the source changes.
  useEffect(() => {
    setLoaded(false)
    setErrored(false)
  }, [url])

  const showImage = Boolean(url) && !errored
  const showPlaceholder = !showImage && status !== 'loading'
  const showShimmer = status === 'loading' || (showImage && !loaded)

  return (
    <div className={`${styles.wrap} ${className}`}>
      {showImage && url && (
        <img
          src={url}
          alt={alt}
          loading="lazy"
          className={`${styles.img} ${loaded ? styles.imgOn : ''}`}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
        />
      )}
      {showShimmer && <div className={styles.shimmer} />}
      {showPlaceholder && (
        <div className={styles.placeholder}>
          <Icon name="map" size={26} />
        </div>
      )}
      {children && <div className={styles.overlay}>{children}</div>}
    </div>
  )
}
