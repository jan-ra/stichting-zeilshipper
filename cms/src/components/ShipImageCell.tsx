'use client'
import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useConfig, usePayloadAPI } from '@payloadcms/ui'

type MediaDoc = {
  url?: string
  thumbnailURL?: string
  filename?: string
  alt?: string
}

type Props = {
  cellData?: unknown
  rowData?: Record<string, unknown>
}

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'zoom-out',
      }}
    >
      <img
        src={src}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '90vw', maxHeight: '90vh',
          objectFit: 'contain', borderRadius: 4,
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          cursor: 'default',
        }}
        alt=""
      />
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 20, right: 24,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.7)', fontSize: 28, lineHeight: 1, padding: 0,
        }}
      >✕</button>
    </div>,
    document.body,
  )
}

const IMG_STYLE: React.CSSProperties = {
  height: 52, width: 78, objectFit: 'cover',
  borderRadius: 3, cursor: 'zoom-in', display: 'block',
  border: '1px solid rgba(0,0,0,0.12)',
}
const DASH = <span style={{ color: 'rgba(0,0,0,0.4)', fontSize: 12 }}>—</span>

// Rendered when the URL is already known (no API call needed).
function ShipImageDirect({ thumb, full, alt }: { thumb: string; full: string; alt: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <img src={thumb} alt={alt} style={IMG_STYLE} onClick={() => setOpen(true)} />
      {open && <Lightbox src={full} onClose={() => setOpen(false)} />}
    </>
  )
}

// Rendered when we only have an ID — fetches the media doc first.
function ShipImageFetcher({ url }: { url: string }) {
  const [open, setOpen] = useState(false)
  const [{ data }] = usePayloadAPI(url, { initialParams: { depth: 0 } })
  const doc = data as MediaDoc | undefined
  const thumb = doc?.thumbnailURL || doc?.url
  if (!thumb) return DASH
  return (
    <>
      <img src={thumb} alt={doc?.alt ?? doc?.filename ?? ''} style={IMG_STYLE} onClick={() => setOpen(true)} />
      {open && <Lightbox src={doc?.url || thumb} onClose={() => setOpen(false)} />}
    </>
  )
}

function asDoc(v: unknown): MediaDoc | null {
  return v && typeof v === 'object' ? (v as MediaDoc) : null
}

function asId(v: unknown): string | null {
  if (typeof v === 'string' && v) return v
  if (typeof v === 'number' && v) return String(v)
  return null
}

export default function ShipImageCell({ cellData, rowData }: Props) {
  const { config } = useConfig()
  const serverURL = config.serverURL || ''

  // Payload passes either a populated doc or a string ID depending on list depth.
  const doc = asDoc(cellData) ?? asDoc(rowData?.image)
  const thumb = doc?.thumbnailURL || doc?.url
  if (thumb) {
    return <ShipImageDirect thumb={thumb} full={doc?.url || thumb} alt={doc?.alt || doc?.filename || ''} />
  }

  const mediaId = asId(cellData) ?? asId(rowData?.image)
  if (mediaId) {
    return <ShipImageFetcher url={`${serverURL}/api/media/${mediaId}`} />
  }

  return DASH
}
