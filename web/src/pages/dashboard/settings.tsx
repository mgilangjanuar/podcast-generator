import { useEffect, useRef, useState } from 'react'

export default function Settings() {
  const form = useRef<HTMLFormElement>(null)
  const [alert, setAlert] = useState(false)

  useEffect(() => {
    if (form.current) {
      const data = JSON.parse(localStorage.getItem('secret:keys') || '{}')
      for (const key of Object.keys(data)) {
        const input = form.current[key]
        if (input) {
          input.value = data[key]
        }
      }
    }
  }, [form])

  useEffect(() => {
    const t = setTimeout(() => {
      if (alert) {
        setAlert(false)
      }
    }, 3500)
    return () => clearTimeout(t)
  }, [alert])

  return <div>
    <div className="max-w-prose">
      {alert ? <div className="alert alert-success mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span>Your keys have been saved locally.</span>
        <div>
          <button className="btn btn-sm btn-ghost md:btn-circle" onClick={() => setAlert(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" width="44" height="44" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M18 6l-12 12" />
              <path d="M6 6l12 12" />
            </svg>
            <span className="inline md:hidden">Close</span>
          </button>
        </div>
      </div> : <></>}
      <form ref={form} onSubmit={e => {
        e.preventDefault()
        const data = Object.fromEntries(new FormData(e.target as HTMLFormElement))
        localStorage.setItem('secret:keys', JSON.stringify(data))
        setAlert(true)
      }}>
        <div className="form-control">
          <label className="label">
            <span className="label-text">
              OpenAI API Key
            </span>
            <span className="label-text-alt">
              <span className="text-red-500">*</span> Required
            </span>
          </label>
          <input required type="text" name="openaikey" className="input input-bordered" placeholder="sk-..." />
        </div>
        <div className="form-control mt-2">
          <label className="label">
            <span className="label-text">
              ElevenLabs API Key
            </span>
            <span className="label-text-alt">
              <span className="text-red-500">*</span> Required
            </span>
          </label>
          <input required type="text" name="elevenlabskey" className="input input-bordered" placeholder="xxxx" />
        </div>
        {/* <div className="form-control mt-2">
          <label className="label">
            <span className="label-text">
              Replicate API Key
            </span>
            <span className="label-text-alt">
              Optional
            </span>
          </label>
          <input type="text" name="replicatekey" className="input input-bordered" placeholder="r8_..." />
        </div> */}
        <div className="form-control mt-5">
          <button type="submit" className="btn btn-block md:btn-wide btn-primary">
            Save
          </button>
        </div>
      </form>
    </div>
  </div>
}