import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { examples } from './examples.js'
import { MAX_VERTICES, solvePostman } from './solver.js'
import { Theory } from './study.jsx'
import './styles.css'

const vertex = index => String.fromCharCode(65 + index)
const indexes = count => Array.from({ length: count }, (_, index) => index)

function hasEdge(graph, from, to) {
  return graph.edges.some(edge => (
    (edge.from === from && edge.to === to) ||
    (!graph.directed && edge.from === to && edge.to === from)
  ))
}

function Graph({ graph, result, step, start, onStart, onChange }) {
  const [layout, setLayout] = useState({})
  const [connecting, setConnecting] = useState(false)
  const [origin, setOrigin] = useState(null)
  const [weight, setWeight] = useState('1')
  const [message, setMessage] = useState('')
  const svg = useRef(null)
  const drag = useRef(null)
  const positions = indexes(graph.count).map(index => {
    const angle = 2 * Math.PI * index / graph.count - Math.PI / 2
    return layout[index] ?? { x: 310 + 225 * Math.cos(angle), y: 202 + 147 * Math.sin(angle) }
  })

  function move(index, x, y) {
    setLayout(previous => ({
      ...previous,
      [index]: { x: Math.max(23, Math.min(597, x)), y: Math.max(23, Math.min(381, y)) },
    }))
  }

  function activate(index) {
    if (!connecting) {
      onStart(index)
      return
    }
    setMessage('')
    if (origin === null || origin >= graph.count) {
      setOrigin(index)
    } else if (origin === index) {
      setOrigin(null)
    } else if (hasEdge(graph, origin, index)) {
      setMessage('To połączenie już istnieje. Wybierz inny wierzchołek końcowy.')
    } else if (!Number.isInteger(Number(weight)) || Number(weight) < 1 || Number(weight) > 999) {
      setMessage('Podaj wagę całkowitą od 1 do 999.')
    } else {
      onChange({ ...graph, edges: [...graph.edges, { from: origin, to: index, weight: Number(weight) }] })
      setOrigin(null)
      setMessage(`Dodano ${vertex(origin)} ${graph.directed ? '→' : '—'} ${vertex(index)}.`)
    }
  }

  function coordinates(event) {
    const point = new DOMPoint(event.clientX, event.clientY)
    return point.matrixTransform(svg.current.getScreenCTM().inverse())
  }

  function beginDrag(event, index) {
    if (event.button !== 0 || drag.current) return
    const point = coordinates(event)
    drag.current = { pointer: event.pointerId, index, x: point.x, y: point.y, moved: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function dragVertex(event) {
    const gesture = drag.current
    if (!gesture || gesture.pointer !== event.pointerId || connecting) return
    const point = coordinates(event)
    const dx = point.x - gesture.x
    const dy = point.y - gesture.y
    if (!gesture.moved && Math.hypot(dx, dy) < 5) return
    gesture.moved = true
    move(gesture.index, point.x, point.y)
  }

  function endDrag(event) {
    const gesture = drag.current
    if (gesture?.pointer !== event.pointerId) return
    drag.current = null
    if (event.type === 'pointerup' && !gesture.moved) activate(gesture.index)
  }
  const current = result?.tour[step - 1]
  const visited = new Set(result?.tour.slice(0, step).map(move => move.index))
  const directedEdges = new Set(graph.edges.map(({ from, to }) => from * MAX_VERTICES + to))
  const active = current?.to ?? start

  return (
    <>
      <div className="graph-tools">
        <button type="button" aria-pressed={connecting} onClick={() => {
          setConnecting(!connecting)
          setOrigin(null)
          setMessage('')
        }}>Rysuj połączenia</button>
        {connecting && <label>Waga <input type="number" min="1" max="999" value={weight} onChange={event => setWeight(event.target.value)} /></label>}
        <button type="button" disabled={!Object.keys(layout).length} onClick={() => setLayout({})}>Przywróć układ</button>
      </div>
      <p className="graph-help" aria-live="polite">
        {message || (connecting
          ? origin !== null && origin < graph.count
            ? `Początek: ${vertex(origin)}. Wybierz koniec lub kliknij początek ponownie, aby anulować.`
            : 'Wybierz początek połączenia.'
          : 'Przeciągnij wierzchołek, aby go przesunąć. Kliknij, aby ustawić start trasy.')}
      </p>
      <svg ref={svg} className={`graph ${connecting ? 'connecting' : ''}`} viewBox="0 0 620 404" role="group" aria-label="Interaktywny graf" onPointerMove={dragVertex} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}>
        {graph.edges.map(({ from, to, weight }, index) => {
          const a = positions[from]
          const b = positions[to]
          const length = Math.hypot(b.x - a.x, b.y - a.y)
          if (length <= 42) return null
          const dx = (b.x - a.x) / length
          const dy = (b.y - a.y) / length
          const offset = graph.directed && directedEdges.has(to * MAX_VERTICES + from) ? 13 : 0
          const trim = offset ? 18 : 22
          const x1 = a.x + dx * trim - dy * offset
          const y1 = a.y + dy * trim + dx * offset
          const x2 = b.x - dx * trim - dy * offset
          const y2 = b.y - dy * trim + dx * offset
          const labelX = (x1 + x2) / 2
          const labelY = (y1 + y2) / 2
          const state = current?.index === index ? 'active' : visited.has(index) ? 'visited' : result?.repeats[index] ? 'repeat' : ''
          return (
            <g key={index} className={`edge ${state}`}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} />
              {graph.directed && <path d={`M ${x2 - 11 * dx + 5 * dy} ${y2 - 11 * dy - 5 * dx} L ${x2} ${y2} L ${x2 - 11 * dx - 5 * dy} ${y2 - 11 * dy + 5 * dx}`} />}
              <rect x={labelX - 15} y={labelY - 11} width="30" height="22" rx="5" />
              <text x={labelX} y={labelY}>{weight}</text>
            </g>
          )
        })}
        {positions.map(({ x, y }, index) => {
          const marked = result && (graph.directed ? result.balance[index] !== 0 : result.degree[index] % 2 !== 0)
          return (
            <g key={index} role="button" tabIndex="0" aria-label={`Wierzchołek ${vertex(index)}`}
              aria-pressed={connecting ? origin === index : start === index}
              className={`vertex ${marked ? 'marked' : ''} ${index === active ? 'active' : ''} ${connecting && origin === index ? 'origin' : ''}`}
              onPointerDown={event => beginDrag(event, index)}
              onClick={event => { if (event.detail === 0 && !event.pointerType) activate(index) }}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  activate(index)
                } else if (event.key === 'Escape' && connecting) {
                  setOrigin(null)
                  setMessage('')
                } else if (!connecting) {
                  const delta = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] }[event.key]
                  if (delta) {
                    event.preventDefault()
                    move(index, x + delta[0], y + delta[1])
                  }
                }
              }}>
              <circle cx={x} cy={y} r="20" />
              <text x={x} y={y}>{vertex(index)}</text>
            </g>
          )
        })}
      </svg>
    </>
  )
}

function Editor({ graph, onChange }) {
  const [from, setFrom] = useState(0)
  const [to, setTo] = useState(1)
  const [weight, setWeight] = useState('1')
  const [error, setError] = useState('')
  const duplicate = hasEdge(graph, from, to)

  function addEdge(event) {
    event.preventDefault()
    if (from === to || duplicate) {
      setError(from === to ? 'Wybierz dwa różne wierzchołki.' : 'To połączenie już istnieje. Możesz zmienić jego wagę na liście.')
      return
    }
    setError('')
    onChange({ ...graph, edges: [...graph.edges, { from, to, weight: Number(weight) }] })
  }

  function removeVertex() {
    const count = graph.count - 1
    setFrom(from >= count ? 0 : from)
    setTo(to >= count ? 1 : to)
    setError('')
    onChange({ ...graph, count, edges: graph.edges.filter(edge => edge.from < count && edge.to < count) })
  }

  function changeDirection(directed) {
    const bothDirections = graph.edges.some(edge =>
      graph.edges.some(other => edge.from === other.to && edge.to === other.from))
    if (!directed && bothDirections) {
      setError('Usuń jeden z dwóch przeciwnych łuków dla każdej takiej pary przed zmianą typu grafu.')
      return
    }
    setError('')
    onChange({ ...graph, directed })
  }

  function changeWeight(index, value) {
    const edges = graph.edges.map((edge, i) => i === index ? { ...edge, weight: value === '' ? '' : Number(value) } : edge)
    onChange({ ...graph, edges })
  }

  return (
    <section className="editor">
      <h3>Edytor grafu</h3>
      <div className="editor-settings">
        <label>Typ grafu
          <select value={graph.directed ? 'directed' : 'undirected'} onChange={event => changeDirection(event.target.value === 'directed')}>
            <option value="undirected">Nieskierowany</option>
            <option value="directed">Skierowany</option>
          </select>
        </label>
        <div className="vertex-controls">
          <span>{graph.count} wierzchołków</span>
          <button type="button" disabled={graph.count === MAX_VERTICES} onClick={() => onChange({ ...graph, count: graph.count + 1 })}>Dodaj</button>
          <button type="button" disabled={graph.count === 2} onClick={removeVertex}>Usuń {vertex(graph.count - 1)}</button>
        </div>
      </div>
      <form className="edge-form" onSubmit={addEdge}>
        <label>Od<select value={from} onChange={event => setFrom(Number(event.target.value))}>{indexes(graph.count).map(i => <option key={i} value={i}>{vertex(i)}</option>)}</select></label>
        <label>Do<select value={to} onChange={event => setTo(Number(event.target.value))}>{indexes(graph.count).map(i => <option key={i} value={i}>{vertex(i)}</option>)}</select></label>
        <label>Waga<input value={weight} onChange={event => setWeight(event.target.value)} type="number" required min="1" max="999" /></label>
        <button className="primary" type="submit">Dodaj {graph.directed ? 'łuk' : 'krawędź'}</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
      <ul className="edge-list">
        {graph.edges.map(({ from, to, weight }, index) => {
          const label = `${vertex(from)} ${graph.directed ? '→' : '—'} ${vertex(to)}`
          return <li key={`${from}-${to}`}>
            <span>{label}</span>
            <input aria-label={`Waga ${label}`} type="number" min="1" max="999" value={weight} onChange={event => changeWeight(index, event.target.value)} />
            <button type="button" aria-label={`Usuń ${label}`} onClick={() => {
              setError('')
              onChange({ ...graph, edges: graph.edges.filter((_, i) => i !== index) })
            }}>×</button>
          </li>
        })}
      </ul>
    </section>
  )
}

function Result({ graph, result, start, step, setStep, playing, setPlaying, speed, setSpeed }) {
  const current = result.tour[step - 1]
  const max = result.tour.length
  const accrued = result.tour.slice(0, step).reduce((sum, move) => sum + move.weight, 0)

  function jump(index) {
    setPlaying(false)
    setStep(index)
  }

  return (
    <aside className="result">
      <h3>Najkrótsza trasa</h3>
      <div className="total"><output>{result.totalCost}</output><span>koszt całkowity</span></div>
      <dl className="cost">
        <div><dt>Połączenia w grafie</dt><dd>{result.baseCost}</dd></div>
        <div><dt>Dodatkowe przejścia</dt><dd>+{result.extraCost}</dd></div>
      </dl>
      <div className="player">
        <div className="step-title"><strong>Przebieg trasy</strong><span>{step} / {max}</span></div>
        <input aria-label="Krok trasy" type="range" min="0" max={max} value={step} onChange={event => jump(Number(event.target.value))} />
        <div className="player-buttons">
          <button aria-label="Wróć na początek" onClick={() => jump(0)} disabled={!step}>↺</button>
          <button aria-label="Poprzedni krok" onClick={() => jump(step - 1)} disabled={!step}>←</button>
          <button className="primary" onClick={() => {
            if (step === max) setStep(0)
            setPlaying(!playing)
          }}>{playing ? 'Pauza' : 'Odtwórz'}</button>
          <button aria-label="Następny krok" onClick={() => jump(step + 1)} disabled={step === max}>→</button>
        </div>
        <p className="current-step" aria-live={playing ? 'off' : 'polite'}>
          {current ? `${vertex(current.from)} → ${vertex(current.to)} · koszt ${current.weight}` : `Start w ${vertex(start)}`}
          {step === max && ' · powrót do startu'}
        </p>
        <div className="player-options">
          <span>Koszt do tej pory <strong>{accrued} / {result.totalCost}</strong></span>
          <label>Tempo <select value={speed} onChange={event => setSpeed(Number(event.target.value))}>
            <option value={0.5}>0,5×</option>
            <option value={1}>1×</option>
            <option value={2}>2×</option>
            <option value={4}>4×</option>
          </select></label>
        </div>
      </div>
      <details>
        <summary>{graph.directed ? 'Bilans łuków' : 'Stopnie wierzchołków'}</summary>
        <ul className="breakdown">
          {result.degree.map((degree, i) => <li key={i}><b>{vertex(i)}</b> {graph.directed
            ? `wejścia ${result.incoming[i]}, wyjścia ${result.outgoing[i]}, bilans ${result.balance[i]}`
            : `stopień ${degree}${degree % 2 ? ' (nieparzysty)' : ''}`}</li>)}
        </ul>
      </details>
      <details>
        <summary>Co trzeba powtórzyć?</summary>
        {result.additions.length ? <ul className="breakdown">
          {result.additions.map(({ from, to, steps, times, cost }) => <li key={`${from}-${to}`}>
            <b>{[from, ...steps.map(move => move.to)].map(vertex).join(' → ')}</b> · {times} × przejście · koszt {cost}
          </li>)}
        </ul> : <p>Graf ma już cykl Eulera. Każde połączenie wystarczy pokonać raz.</p>}
      </details>
      <details>
        <summary>Pełna trasa</summary>
        <p className="route">{[start, ...result.tour.map(move => move.to)].map(vertex).join(' → ')}</p>
      </details>
    </aside>
  )
}

const tutorialSteps = [
  {
    title: 'Uruchom gotowy przykład',
    instructions: <p>W sekcji <strong>Demonstracja</strong> wybierz <strong>Osiedle</strong>. Kliknij wierzchołek B na grafie, aby ustawić start. Użyj przycisku <strong>Następny krok</strong>, żeby przejść jedną krawędź, lub <strong>Odtwórz</strong>, żeby zobaczyć całą trasę. Jeśli animacja jest za szybka, ustaw <strong>Tempo</strong> na 0,5×.</p>,
  },
  {
    title: 'Odczytaj wynik',
    instructions: <p>W przykładzie <strong>Osiedle</strong> koszt wszystkich ulic wynosi 31, a powtórzenia dodają 9. Rozwiń <strong>Co trzeba powtórzyć?</strong>, żeby zobaczyć ścieżki odpowiedzialne za ten dodatkowy koszt. W sekcji <strong>Pełna trasa</strong> sprawdź, czy pierwszy i ostatni wierzchołek są takie same.</p>,
  },
  {
    title: 'Zbuduj własny graf',
    instructions: <p>Wybierz <strong>Własny graf</strong> i ustaw typ <strong>Nieskierowany</strong> w edytorze. W pustym grafie włącz <strong>Rysuj połączenia</strong>, wpisz wagę 2 i kliknij A, potem B. Zmień wagę na 3 i kliknij B, potem C. Po połączeniu wszystkich trzech wierzchołków zobaczysz koszt trasy 10. Każdą z dwóch krawędzi trzeba pokonać w obie strony.</p>,
  },
  {
    title: 'Sprawdź graf skierowany',
    instructions: <p>Wybierz <strong>Ulice jednokierunkowe</strong>. Przy odtwarzaniu śledź strzałki na grafie i rozwiń <strong>Bilans łuków</strong>, żeby porównać liczbę wejść i wyjść. Tworząc własny graf skierowany, ustaw kierunek przez kliknięcie najpierw początku, a potem końca łuku. Trasa jest możliwa, gdy z każdego wierzchołka da się dotrzeć do pozostałych zgodnie ze strzałkami.</p>,
  },
]

function Tutorial() {
  const [step, setStep] = useState(0)
  const { title, instructions } = tutorialSteps[step]
  const last = step === tutorialSteps.length - 1

  return (
    <section id="samouczek" className="tutorial" aria-labelledby="tutorial-title">
      <h2 id="tutorial-title">Jak korzystać z aplikacji?</h2>
      <ol className="tutorial-steps" aria-label="Kroki samouczka">
        {tutorialSteps.map(({ title }, index) => (
          <li key={title}>
            <button type="button" aria-current={step === index ? 'step' : undefined}
              onClick={() => setStep(index)}>{index + 1}. {title}</button>
          </li>
        ))}
      </ol>
      <div className="tutorial-instructions" aria-live="polite" aria-atomic="true">
        <h3>{title}</h3>
        {instructions}
      </div>
      <div className="tutorial-actions">
        <a href="#demo-title" className="primary tutorial-link">Wypróbuj w demonstracji</a>
        <button type="button" disabled={step === 0} onClick={() => setStep(step - 1)}>Wstecz</button>
        <button type="button" onClick={() => setStep(last ? 0 : step + 1)}>{last ? 'Od początku' : 'Dalej'}</button>
      </div>
    </section>
  )
}

function App() {
  const [graph, setGraph] = useState(examples[0])
  const [selected, setSelected] = useState(0)
  const [start, setStart] = useState(0)
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [graphVersion, setGraphVersion] = useState(0)
  const [editorOpen, setEditorOpen] = useState(false)
  const { result, error } = useMemo(() => {
    try {
      return { result: solvePostman(graph.count, graph.edges, graph.directed, start) }
    } catch (error) {
      return { error: error.message }
    }
  }, [graph, start])

  useEffect(() => {
    if (!playing || !result || step >= result.tour.length) return
    const timer = setTimeout(() => {
      setStep(step + 1)
      if (step + 1 === result.tour.length) setPlaying(false)
    }, 650 / speed)
    return () => clearTimeout(timer)
  }, [playing, result, step, speed])

  function chooseStart(index) {
    setPlaying(false)
    setStep(0)
    setStart(index)
  }

  function loadGraph(next, selection) {
    setGraphVersion(version => version + 1)
    chooseStart(0)
    update(next, selection)
  }

  function update(next, selection = -1) {
    setGraph(next)
    setSelected(selection)
    setPlaying(false)
    setStep(0)
    if (selection >= 0 || start >= next.count) setStart(0)
  }

  return (
    <>
      <header className="masthead">
        <div className="container nav">
          <a href="#top" className="brand"><span aria-hidden="true">↬</span> Laboratorium tras</a>
          <nav aria-label="Nawigacja"><a href="#demo">Demonstracja</a><a href="#samouczek">Samouczek</a><a href="#algorytm">Algorytm</a></nav>
        </div>
      </header>
      <main id="top" className="container">
        <section className="hero">
          <p className="eyebrow">Interaktywna teoria grafów</p>
          <h1>Problem chińskiego<br />listonosza<span>.</span></h1>
          <p>Jak przejść każdą ulicę co najmniej raz, wrócić do punktu startu i zapłacić jak najmniej? Sprawdź na gotowym przykładzie lub zbuduj własny graf.</p>
          <a className="hero-study-link" href="#algorytm">Dokumentacja i prezentacja ↓</a>
        </section>
        <section id="demo" className="demo" aria-labelledby="demo-title">
          <div className="demo-header">
            <h2 id="demo-title" tabIndex={-1}>Demonstracja</h2>
            <a className="tutorial-shortcut" href="#samouczek">Otwórz samouczek</a>
            <button onClick={() => setEditorOpen(!editorOpen)} aria-expanded={editorOpen}>{editorOpen ? 'Zwiń edytor' : 'Edytuj graf'}</button>
          </div>
          <div className="presets" aria-label="Przykłady">
            {examples.map((example, i) => <button key={example.name} aria-pressed={selected === i} onClick={() => loadGraph(example, i)}>{example.name}</button>)}
            <button aria-pressed={selected === -1} onClick={() => {
              if (selected !== -1) loadGraph({ count: 3, directed: graph.directed, edges: [] }, -1)
              setEditorOpen(true)
            }}>Własny graf</button>
          </div>
          {editorOpen && <Editor key={graphVersion} graph={graph} onChange={update} />}
          <div className="workspace">
            <div className="map">
              <div className="map-header"><strong>{graph.directed ? 'Graf skierowany' : 'Graf nieskierowany'}</strong>
                <label>Start <select value={start} onChange={event => chooseStart(Number(event.target.value))}>{indexes(graph.count).map(i => <option key={i} value={i}>{vertex(i)}</option>)}</select></label>
              </div>
              <Graph key={graphVersion} {...{ graph, result, step, start }} onStart={chooseStart} onChange={update} />
              <div className="legend">
                <span><i className="mark" />{graph.directed ? 'Niezrównoważony wierzchołek' : 'Nieparzysty stopień'}</span>
                <span><i className="dash" />Do powtórzenia</span>
                <span><i className="live" />Przejście trasy</span>
              </div>
              <details className="map-edges"><summary>Lista połączeń i wag</summary>
                <ul className="breakdown">
                  {graph.edges.map(({ from, to, weight }, index) => <li key={index}>{vertex(from)} {graph.directed ? '→' : '—'} {vertex(to)} · waga {weight === '' ? '—' : weight}{result?.repeats[index] ? ` · dodatkowe przejścia ${result.repeats[index]}` : ''}</li>)}
                </ul>
              </details>
            </div>
            {result ? <Result {...{ graph, result, start, step, setStep, playing, setPlaying, speed, setSpeed }} /> :
              <aside className="result"><h3>Trasa</h3><p className="error" role="status">{error}</p></aside>}
          </div>
        </section>
        <Tutorial />
        <Theory />
      </main>
      <footer><div className="container">Problem chińskiego listonosza</div></footer>
    </>
  )
}

createRoot(document.querySelector('#root')).render(<App />)
