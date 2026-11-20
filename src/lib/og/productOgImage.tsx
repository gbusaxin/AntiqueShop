import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

export const OG_SIZE = { width: 1200, height: 630 }

const PAPER = '#F6F1E8'
const INK = '#1C1713'
const MUTED = '#6B6052'
const BRONZE = '#7E5F36'
const DEEP = '#ECE4D6'

export interface ProductOgData {
  name: string
  price: string
  /** e.g. "ca. 1890 · Porcelain" — optional details line */
  details?: string
  /** PNG/JPEG data URI (Satori cannot decode WebP, so convert before passing) */
  image?: string
  eyebrow: string
}

let fontsPromise: Promise<{ regular: Buffer; italic: Buffer }> | null = null

/** OFL-licensed serif with Cyrillic — see assets/fonts/LICENSE-LiberationSerif.txt */
function loadFonts() {
  fontsPromise ??= Promise.all([
    readFile(join(process.cwd(), 'assets/fonts/LiberationSerif-Regular.ttf')),
    readFile(join(process.cwd(), 'assets/fonts/LiberationSerif-Italic.ttf')),
  ]).then(([regular, italic]) => ({ regular, italic }))
  return fontsPromise
}

function Ornament() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24">
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" fill={BRONZE} />
    </svg>
  )
}

/** Branded 1200×630 share card: the piece in a museum arch + name, details and price. */
export async function renderProductOgImage(data: ProductOgData) {
  const { regular, italic } = await loadFonts()
  const nameSize = data.name.length > 70 ? 46 : data.name.length > 40 ? 54 : 64

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: PAPER, fontFamily: 'Serif', position: 'relative' }}>
        {/* hairline frame */}
        <div style={{ position: 'absolute', top: 22, left: 22, right: 22, bottom: 22, border: `1px solid ${BRONZE}55`, display: 'flex' }} />

        {/* exhibit */}
        <div style={{ display: 'flex', width: 470, height: '100%', alignItems: 'flex-end', justifyContent: 'center', paddingLeft: 70, paddingBottom: 60 }}>
          <div
            style={{
              display: 'flex',
              width: 380,
              height: 500,
              borderRadius: '190px 190px 0 0',
              overflow: 'hidden',
              background: DEEP,
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 30px 60px -30px rgba(60,40,15,0.45)',
            }}
          >
            {data.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img>
              <img src={data.image} width={380} height={500} style={{ objectFit: 'cover', width: 380, height: 500 }} alt="" />
            ) : (
              <div style={{ display: 'flex', fontSize: 120, fontStyle: 'italic', color: `${BRONZE}66` }}>VE</div>
            )}
          </div>
        </div>

        {/* copy */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '78px 80px 70px 70px', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: BRONZE, fontSize: 20, letterSpacing: 6, textTransform: 'uppercase' }}>
              <div style={{ display: 'flex', width: 36, height: 1, background: BRONZE }} />
              {data.eyebrow}
            </div>
            <div style={{ display: 'flex', marginTop: 34, fontSize: nameSize, lineHeight: 1.08, color: INK, maxHeight: nameSize * 1.08 * 4, overflow: 'hidden' }}>
              {data.name}
            </div>
            {data.details && (
              <div style={{ display: 'flex', marginTop: 22, fontSize: 26, fontStyle: 'italic', color: MUTED }}>{data.details}</div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ display: 'flex', flex: 1, height: 1, background: `${BRONZE}66` }} />
              <div style={{ display: 'flex', fontSize: 50, color: INK }}>{data.price}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 26 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 30, color: INK }}>
                <Ornament />
                <span>Vintag</span>
                <span style={{ fontStyle: 'italic', color: BRONZE, marginLeft: -10 }}>Empire</span>
              </div>
              <div style={{ display: 'flex', fontSize: 18, letterSpacing: 4, color: MUTED, textTransform: 'uppercase' }}>Wien · Est. 1987</div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: 'Serif', data: regular, style: 'normal', weight: 400 },
        { name: 'Serif', data: italic, style: 'italic', weight: 400 },
      ],
    }
  )
}
