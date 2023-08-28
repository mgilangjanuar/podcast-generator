import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

type ResultResp = {
  narrative?: string,
  topic?: string,
  language?: string,
  voices?: {
    voice_id: string,
    preview_url: string,
    name: string
  }[],
  voiceId?: string,
  audioUrl?: string
}

export default function App() {
  const form = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<{ elevenlabskey: string, openaikey: string, replicatekey?: string }>()
  const [response, setResponse] = useState<ResultResp>({
    language: 'indonesia',
  })
  const [noKeysAlert, setNoKeysAlert] = useState(false)

  useEffect(() => {
    const localData = localStorage.getItem('secret:keys')
    if (!localData) {
      setNoKeysAlert(true)
    }
    setData(JSON.parse(localData || '{}'))
  }, [])

  useEffect(() => {
    if (data?.elevenlabskey) {
      fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': data?.elevenlabskey,
        }
      }).then(r => r.json()).then(data => {
        data.voices.sort((a: any, b: any) => a.name.localeCompare(b.name))
        setResponse((resp?: ResultResp) => ({
          ...resp || {},
          voices: data.voices,
          voiceId: data.voices[0].voice_id
        }))
      })
    }
  }, [data])

  const generateTopic = () => {
    if (data?.openaikey) {
      fetch('https://api.openai.com/v1/chat/completions', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data?.openaikey}`,
        },
        method: 'POST',
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          temperature: 0.8,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant who can generate a random topic for a short podcast episode witout any quotes symbol.\n\nThe podcast is about a motivational, cringe, etc. poetry narrative.'
            },
            {
              role: 'user',
              content: 'Please generate a topic for me in less than 80 characters with Bahasa Indonesia.'
            }
          ],
        })
      }).then(r => r.json()).then(data => {
        setResponse((resp?: ResultResp) => ({ ...resp || {}, topic: data.choices[0].message.content.replace(/^"|"$/g, '') }))
      })
    }
  }

  return <div>
    <div className="max-w-prose">
      {noKeysAlert ? <div className="alert alert-warning">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        <span>Please add your keys!</span>
        <div>
          <Link to="/app/settings" className="btn btn-sm">
            Set up
          </Link>
        </div>
      </div> : <></>}

      <form ref={form} onSubmit={async e => {
        e.preventDefault()
        document.querySelectorAll('audio.hidden').forEach(el => el.remove())
        if (!data?.openaikey) return
        if (!response?.narrative) {
          setLoading(true)
          const formdata = Object.fromEntries(new FormData(e.target as HTMLFormElement))
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${data?.openaikey}`,
            },
            method: 'POST',
            body: JSON.stringify({
              model: 'gpt-3.5-turbo',
              temperature: 0.8,
              stream: true,
              messages: [
                {
                  role: 'system',
                  content: `You are a helpful assistant who can generate exactly 1 brief narrative paragraph with a given topic in less than 400 characters with the language: ${formdata.language}.`
                },
                {
                  role: 'user',
                  content: `Topic: ${formdata.topic}`
                }
              ],
            }),
          })

          const respdata = res.body
          if (!respdata) {
            return
          }
          const reader = respdata.getReader()
          const decoder = new TextDecoder()
          let done = false

          let responseText: string = ''
          let responses: string[] = []

          while (!done) {
            const { value, done: doneReading } = await reader.read()
            done = doneReading
            const chunkValue = decoder.decode(value)
            if (!chunkValue) break

            responseText += chunkValue
            responses = responseText.split('\n\n')
            const message: { role: string, content: string } = { role: '', content: '' }

            for (const res of responses) {
              const process = () => {
                const c = JSON.parse(res.replace(/^data: /, '').trim())
                if (c.error) {
                  setLoading(false)
                  if (c.error === 'Unauthorized') {
                    (window as any).openLogin.showModal()
                  } else if (c.error === 'Payment Required') {
                    console.log('Payment Required')
                  } else {
                    console.error(c.error)
                  }
                  return null
                }

                message.role = c.choices[0].delta.role ?? message.role
                message.content += c.choices[0].delta.content || ''

                if (c.choices[0].finish_reason === 'stop') {
                  setLoading(false)
                  setResponse((resp?: ResultResp) => ({ ...resp || {}, narrative: message.content }))
                }
              }
              try {
                const c = process()
                if (c === null) break
              } catch (err) {
                // console.error(err)
              }
            }

            if (message.content.trim()) {
              const process = () => {
                // console.log('reply:', message.content)
                setResponse((resp?: ResultResp) => ({ ...resp || {}, narrative: message.content }))
              }
              try {
                process()
              } catch (error) {
                // console.error(error)
              }
            }
          }
        } else {
          setLoading(true)
          fetch(`https://api.elevenlabs.io/v1/text-to-speech/${response.voiceId}`, {
            method: 'POST',
            body: JSON.stringify({
              text: response.narrative,
              model_id: 'eleven_multilingual_v2',
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.5
              }
            }),
            headers: {
              'Content-Type': 'application/json',
              'xi-api-key': data?.elevenlabskey,
            }
          }).then(r => {
            if (!r.ok) throw new Error(r.statusText)
            return r
          }).then(r => r.blob()).then(ttsData => {
            setLoading(false)
            setResponse((resp?: ResultResp) => ({ ...resp || {}, audioUrl: URL.createObjectURL(ttsData) }))
          }).catch(err => {
            setLoading(false)
            console.error(err)
          })
        }
      }}>
        <div className="flex gap-3 items-end">
          <div className="form-control grow">
            <label className="label">
              <span className="label-text">
                Topic
              </span>
              <span className="label-text-alt">
                <span className="text-red-500">*</span> Required
              </span>
            </label>
            <input required type="text" name="topic" value={response?.topic} onChange={({ target }) => setResponse((res: ResultResp) => ({ ...res, topic: target.value }))} className="input input-bordered" placeholder="Motivational, sad story, or etc..." />
          </div>
          <div>
            <button type="button" className="btn btn-primary" onClick={generateTopic}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" width="44" height="44" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="form-control mt-2">
          <label className="label">
            <span className="label-text">
              Language
            </span>
            <span className="label-text-alt">
              <span className="text-red-500">*</span> Required
            </span>
          </label>
          <select required name="language" className="select select-bordered w-full" onChange={({ target }) => {
            setResponse((resp?: ResultResp) => ({ ...resp || {}, language: target.value }))
          }}>
            <option value="indonesia">Bahasa Indonesia</option>
            <option value="english">English</option>
          </select>
        </div>
        {response?.narrative ? <>
          <div className="form-control mt-2">
            <label className="label">
              <span className="label-text">
                Narrative
              </span>
              <span className="label-text-alt">
                <span className="text-red-500">*</span> Required
              </span>
            </label>
            <textarea required name="narrative" value={response?.narrative} onChange={({ target }) =>
              setResponse((resp?: ResultResp) => ({ ...resp || {}, narrative: target.value }))
            } className="textarea textarea-bordered min-h-fit leading-7 text-[1rem]" />
          </div>
          <div className="form-control mt-2">
            <label className="label">
              <span className="label-text">
                Voice
              </span>
              <span className="label-text-alt">
                <span className="text-red-500">*</span> Required
              </span>
            </label>
            <select required name="voice" className="select select-bordered w-full" onChange={({ target }) => {
              const voice = response?.voices?.find(voice => voice.voice_id === target.value)
              if (voice) {
                document.querySelectorAll('audio.hidden')?.forEach(el => el.remove())
                setResponse((resp?: ResultResp) => ({ ...resp || {}, voiceId: voice.voice_id }))

                const audio = new Audio(voice.preview_url)
                audio.style.display = 'none'
                audio.classList.add('hidden')
                document.body.append(audio)
                audio.play()
                audio.addEventListener('ended', () => {
                  audio.currentTime = 0
                  document.querySelectorAll('audio.hidden').forEach(el => el.remove())
                })
              }
            }}>
              {response?.voices?.map((voice, i) => <option key={i} value={voice.voice_id}>{voice.name}</option>)}
            </select>
          </div>
        </> : <></>}
        <div className="flex flex-wrap gap-3 justify-between mt-5">
          <div>
            <button type="submit" className="btn btn-block md:btn-wide btn-primary" disabled={loading}>
              {loading ? <span className="loading loading-spinner"></span> : <></>}
              {!response?.narrative ? 'Generate Story' : 'Generate Podcast'}
            </button>
          </div>
          {response?.audioUrl ? <audio src={response?.audioUrl} controls></audio> : <></>}
        </div>
      </form>
    </div>
  </div>
}