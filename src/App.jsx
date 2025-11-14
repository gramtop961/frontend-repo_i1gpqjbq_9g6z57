import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Scissors, Images, FileDown, Combine } from 'lucide-react'

function getDefaultBackendBase() {
  try {
    const origin = window.location.origin
    // Handle typical localhost or port-based dev: :3000 -> :8000
    if (origin.includes(':3000')) return origin.replace(':3000', ':8000')
    // Handle hosted preview pattern: -3000.<domain> -> -8000.<domain>
    if (origin.includes('-3000.')) return origin.replace('-3000.', '-8000.')
    // Fallback: same origin
    return origin
  } catch {
    return ''
  }
}

const RAW_BACKEND = import.meta.env.VITE_BACKEND_URL || ''
const BASE = (RAW_BACKEND || getDefaultBackendBase()).replace(/\/$/, '')
const API = (path) => `${BASE}${path}`

function ToolCard({ icon: Icon, title, description, actionLabel, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -4, boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}
      whileTap={{ scale: 0.98 }}
      className="w-full text-left p-5 rounded-2xl bg-white/80 backdrop-blur border border-slate-200 hover:border-slate-300 transition flex gap-4 items-center"
    >
      <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-sky-50 text-indigo-600">
        <Icon size={24} />
      </div>
      <div className="flex-1">
        <div className="font-semibold text-slate-800">{title}</div>
        <div className="text-sm text-slate-500">{description}</div>
      </div>
      <div className="text-indigo-600 font-medium">{actionLabel} →</div>
    </motion.button>
  )
}

function Dropzone({ label, accept, multiple, onFiles }) {
  const inputRef = useRef(null)
  const [isOver, setIsOver] = useState(false)

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsOver(true) }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault(); setIsOver(false)
        const files = Array.from(e.dataTransfer.files)
        const valid = files.filter(f => accept.split(',').some(ext => f.name.toLowerCase().endsWith(ext.trim().slice(1))))
        if (valid.length) onFiles(valid)
      }}
      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${isOver ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-300 hover:border-slate-400 bg-white/60'}`}
      onClick={() => inputRef.current?.click()}
    >
      <Upload className="mx-auto text-indigo-500 mb-3" />
      <div className="font-medium text-slate-700">{label}</div>
      <div className="text-xs text-slate-500 mt-1">Drag & drop or click to choose</div>
      <input ref={inputRef} type="file" multiple={multiple} accept={accept} className="hidden" onChange={(e) => onFiles(Array.from(e.target.files || []))} />
    </div>
  )
}

function ResultBanner({ link, onClose }) {
  return (
    <AnimatePresence>
      {link && (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white shadow-xl border border-slate-200 rounded-full px-4 py-2 flex items-center gap-3">
          <FileDown className="text-emerald-600" size={18} />
          <a href={link} target="_blank" className="text-sm font-medium text-emerald-700">Download result</a>
          <button onClick={onClose} className="text-slate-400 text-xs">Dismiss</button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Header() {
  return (
    <div className="py-8">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500" />
            <div className="text-xl font-bold text-slate-800">PDF Studio</div>
          </div>
          <div className="text-slate-500 text-sm">Fast • Private • Free</div>
        </div>
      </div>
    </div>
  )
}

function AdsensePlaceholder() {
  return (
    <div className="max-w-5xl mx-auto px-6 mt-6">
      <div className="h-24 rounded-xl border border-slate-200 bg-white/70 grid place-items-center text-slate-400">
        Google AdSense Slot
      </div>
    </div>
  )
}

function App() {
  const [active, setActive] = useState(null) // 'merge' | 'split' | 'images'
  const [download, setDownload] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleMerge = async (selected) => {
    setError(''); setLoading(true)
    const form = new FormData()
    selected.forEach(f => form.append('files', f))
    try {
      const res = await fetch(API('/api/pdf/merge'), { method: 'POST', body: form })
      if (!res.ok) throw new Error('Merge failed')
      const data = await res.json()
      setDownload(`${BASE}${data.download_url}`)
    } catch (e) {
      setError(e.message)
    } finally { setLoading(false) }
  }

  const handleSplit = async (selected, range) => {
    setError(''); setLoading(true)
    const form = new FormData()
    form.append('file', selected[0])
    form.append('start_page', range.start)
    form.append('end_page', range.end)
    try {
      const res = await fetch(API('/api/pdf/split'), { method: 'POST', body: form })
      if (!res.ok) throw new Error('Split failed')
      const data = await res.json()
      setDownload(`${BASE}${data.download_url}`)
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  const handleImages = async (selected) => {
    setError(''); setLoading(true)
    const form = new FormData()
    selected.forEach(f => form.append('images', f))
    try {
      const res = await fetch(API('/api/pdf/images-to-pdf'), { method: 'POST', body: form })
      if (!res.ok) throw new Error('Conversion failed')
      const data = await res.json()
      setDownload(`${BASE}${data.download_url}`)
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <Header />

      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center py-10">
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold text-slate-800">
            All-in-one PDF toolkit
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .05 }} className="text-slate-600 mt-2">
            Merge, split, and convert images to PDF — fast and private in your browser.
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ToolCard icon={Combine} title="Merge PDFs" description="Combine multiple PDFs into one" actionLabel="Open" onClick={() => setActive('merge')} />
          <ToolCard icon={Scissors} title="Split PDF" description="Extract a page range" actionLabel="Open" onClick={() => setActive('split')} />
          <ToolCard icon={Images} title="Images → PDF" description="Turn JPG/PNG to a single PDF" actionLabel="Open" onClick={() => setActive('images')} />
        </div>

        <AdsensePlaceholder />

        <AnimatePresence mode="wait">
          {active === 'merge' && (
            <motion.div key="merge" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="mt-8">
              <div className="bg-white/80 backdrop-blur p-6 rounded-2xl border border-slate-200">
                <div className="font-semibold text-slate-700 mb-3">Upload PDFs to merge</div>
                <Dropzone label="Choose PDF files" accept=".pdf" multiple onFiles={handleMerge} />
              </div>
            </motion.div>
          )}

          {active === 'split' && (
            <motion.div key="split" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="mt-8">
              <div className="bg-white/80 backdrop-blur p-6 rounded-2xl border border-slate-200">
                <div className="font-semibold text-slate-700 mb-4">Upload a PDF and set a range</div>
                <SplitTool onSubmit={handleSplit} />
              </div>
            </motion.div>
          )}

          {active === 'images' && (
            <motion.div key="images" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="mt-8">
              <div className="bg-white/80 backdrop-blur p-6 rounded-2xl border border-slate-200">
                <div className="font-semibold text-slate-700 mb-3">Upload images to convert</div>
                <Dropzone label="Choose images" accept=".png,.jpg,.jpeg,.webp,.bmp" multiple onFiles={handleImages} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && (
          <div className="text-center text-slate-500 text-sm mt-6">Processing…</div>
        )}
        {error && (
          <div className="text-center text-rose-500 text-sm mt-2">{error}</div>
        )}
      </div>

      <ResultBanner link={download} onClose={() => setDownload('')} />

      <footer className="mt-16 py-10 text-center text-slate-400 text-sm">
        © {new Date().getFullYear()} PDF Studio. Not affiliated with iLovePDF.
      </footer>
    </div>
  )
}

function SplitTool({ onSubmit }) {
  const [file, setFile] = useState(null)
  const [start, setStart] = useState('1')
  const [end, setEnd] = useState('1')

  const send = () => {
    if (!file) return
    onSubmit([file], { start, end })
  }

  return (
    <div className="space-y-4">
      <Dropzone label="Choose a PDF" accept=".pdf" multiple={false} onFiles={(f) => setFile(f[0])} />
      <div className="grid grid-cols-2 gap-3">
        <input type="number" min="1" value={start} onChange={(e) => setStart(e.target.value)} placeholder="Start page" className="px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
        <input type="number" min="1" value={end} onChange={(e) => setEnd(e.target.value)} placeholder="End page" className="px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
      </div>
      <button onClick={send} className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition">Split PDF</button>
    </div>
  )
}

export default App
