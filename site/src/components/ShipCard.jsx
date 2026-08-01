import { useState } from 'react'
import { asset } from '../utils/asset.js'
import { useLanguage } from '../context/LanguageContext.jsx'
import './shipCard.css'

// The selected-ship card, shared by the fleet page and the home hero. Positions itself
// over the globe it belongs to (the parent must be a positioned element) and becomes a
// bottom sheet on narrow screens. Owns its own image lightbox so a page only has to
// hand it a ship.
export default function ShipCard({ ship, onClose }) {
  const { t } = useLanguage()
  const [zoomed, setZoomed] = useState(false)

  if (!ship) return null

  return (
    <>
      <div className="sz-shipcard">
        {ship.image && (
          <div className="sz-shipcard__media" onClick={() => setZoomed(true)}>
            <img src={asset(ship.image)} alt={ship.name} className="sz-shipcard__img" />
            <div className="sz-shipcard__zoom">&#10530;</div>
          </div>
        )}
        <div className="sz-shipcard__body">
          <div className="sz-shipcard__head">
            <div>
              <div className="sz-shipcard__kicker">{ship.type} &middot; {ship.year}</div>
              <div className="sz-shipcard__name">{ship.name}</div>
            </div>
            <button type="button" className="sz-shipcard__close" onClick={onClose} aria-label={t('fleet.close')}>
              &times;
            </button>
          </div>

          <div className="sz-shipcard__facts">
            {[
              [t('fleet.port'), ship.port],
              [t('fleet.passengers'), ship.passengers],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="sz-shipcard__factLabel">{label}</div>
                <div className="sz-shipcard__factValue">{value}</div>
              </div>
            ))}
          </div>

          <div className="sz-shipcard__meta">
            {ship.lat == null
              ? t('fleet.noPosition')
              : ship.positionUpdatedAt
                ? `${t('fleet.positionUpdated')}: ${new Date(ship.positionUpdatedAt).toLocaleString()}`
                : null}
          </div>
        </div>
      </div>

      {zoomed && ship.image && (
        <div className="sz-lightbox" onClick={() => setZoomed(false)}>
          <img src={asset(ship.image)} alt="" onClick={e => e.stopPropagation()} />
          <button type="button" className="sz-lightbox__close" onClick={() => setZoomed(false)} aria-label={t('fleet.close')}>
            &times;
          </button>
        </div>
      )}
    </>
  )
}
