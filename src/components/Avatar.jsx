import { LogoMark } from './Logo.jsx'

// Shows the user's profile picture if set, otherwise the easy "e" mark.
export default function Avatar({ src, className = 'h-11 w-11' }) {
  if (src) {
    return (
      <img
        src={src}
        alt="Profile"
        className={`shrink-0 rounded-xl object-cover ring-1 ring-brand/30 ${className}`}
      />
    )
  }
  return <LogoMark className={className} />
}

// Downscale + center-crop an uploaded image to a small square data URL so it
// fits comfortably in localStorage.
export function fileToAvatar(file, cb, size = 256) {
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      const min = Math.min(img.width, img.height)
      const sx = (img.width - min) / 2
      const sy = (img.height - min) / 2
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size)
      try {
        cb(canvas.toDataURL('image/jpeg', 0.85))
      } catch {
        cb(reader.result)
      }
    }
    img.src = reader.result
  }
  reader.readAsDataURL(file)
}
