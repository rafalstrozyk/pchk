import React, { useRef, useState } from 'react'

const paper = 'https://research.ibm.com/publications/matching-euler-tours-and-the-chinese-postman'

function WorkedExample({ directed }) {
  return directed ? (
    <>
      <p>W przykładzie <strong>Ulice jednokierunkowe</strong> bilans `wyjścia − wejścia` wynosi −1 dla B i C, +1 dla A i E oraz 0 dla D. Trzeba dodać po jednym wyjściu z B i C oraz po jednym wejściu do A i E.</p>
      <div className="study-table">
        <table>
          <caption>Koszt najkrótszych ścieżek zgodnych z kierunkiem łuków</caption>
          <thead><tr><th scope="col">Początek</th><th scope="col">Do A</th><th scope="col">Do E</th></tr></thead>
          <tbody>
            <tr><th scope="row">B</th><td>11</td><td>9</td></tr>
            <tr><th scope="row">C</th><td>8</td><td>6</td></tr>
          </tbody>
        </table>
      </div>
      <p>Oba przydziały kosztują 17. Program może powtórzyć B → C → D → E → A oraz C → D → E. Łuki C → D i D → E zyskują po dwie dodatkowe kopie. Koszt całej trasy to <strong>21 + 17 = 38</strong>.</p>
    </>
  ) : (
    <>
      <p>W przykładzie <strong>Osiedle</strong> wierzchołki A, B, C i E mają stopień 3. D i F mają stopień 2. Cztery nieparzyste wierzchołki dają trzy sposoby parowania.</p>
      <div className="study-table">
        <table>
          <caption>Koszty parowania według najkrótszych ścieżek</caption>
          <thead><tr><th scope="col">Pary</th><th scope="col">Koszt</th></tr></thead>
          <tbody>
            <tr><td>A–B oraz C–E</td><td>3 + 6 = 9</td></tr>
            <tr><td>A–C oraz B–E</td><td>7 + 2 = 9</td></tr>
            <tr><td>A–E oraz B–C</td><td>5 + 4 = 9</td></tr>
          </tbody>
        </table>
      </div>
      <p>Jedno z rozwiązań powtarza A–B oraz ścieżkę C–B–E. Najkrótsza droga między A i C biegnie przez B i kosztuje 7, choć bezpośrednia krawędź ma wagę 8. Koszt całej trasy to <strong>31 + 9 = 40</strong>.</p>
    </>
  )
}

const slides = [
  {
    title: 'Problem chińskiego listonosza',
    body: <><p>Jak przejść każdą ulicę co najmniej raz, wrócić do miejsca startu i zminimalizować koszt?</p><p>Wierzchołki reprezentują skrzyżowania, połączenia reprezentują ulice, a waga może oznaczać długość lub czas przejścia.</p></>,
    notes: 'Zaproponuj przykład zastosowania, taki jak odśnieżanie wszystkich ulic. Zwróć uwagę, że każda ulica jest częścią zadania.',
  },
  {
    title: 'Dolna granica i cykl Eulera',
    body: <><p>Suma wag ulic to dolna granica kosztu. Cykl Eulera osiąga ją, bo pokonuje każde połączenie dokładnie raz.</p><ul><li>Graf nieskierowany musi być spójny, a każdy stopień parzysty.</li><li>Graf skierowany musi być silnie spójny, a liczba wejść i wyjść musi się zgadzać w każdym wierzchołku.</li></ul></>,
    notes: 'Wyjaśnij parzystość przez parowanie wejścia z wyjściem. W przykładzie Cykl Eulera koszt dodatkowych przejść wynosi zero.',
  },
  {
    title: 'Graf nieskierowany',
    body: <WorkedExample directed={false} />,
    notes: 'Pokaż, że powtórzenie ścieżki zmienia parzystość tylko na końcach. Wewnątrz ścieżki stopień rośnie o dwa.',
  },
  {
    title: 'Graf skierowany',
    body: <WorkedExample directed />,
    notes: 'Wskaż znaki bilansu. Dodatkowe przejście zaczyna się w wierzchołku z brakującym wyjściem i kończy w wierzchołku z brakującym wejściem.',
  },
  {
    title: 'Dlaczego wynik jest optymalny?',
    body: <ol><li>Każda zamknięta trasa musi zawierać każde oryginalne połączenie.</li><li>Kopie muszą usunąć nieparzystość stopni albo wyrównać bilans łuków.</li><li>Najtańsze poprawki daje skojarzenie par lub przepływ o minimalnym koszcie. Hierholzer układa oryginały i kopie w jedną trasę.</li></ol>,
    notes: 'Przejdź od dolnej granicy do konstrukcji trasy, która ją osiąga po doliczeniu minimalnego kosztu poprawek.',
  },
  {
    title: 'Demonstracja na żywo',
    body: <ol><li>Wybierz Osiedle i rozwiń „Co trzeba powtórzyć?”.</li><li>Ustaw punkt startowy, odtwórz trasę i pokaż koszt 40.</li><li>Przełącz na Ulice jednokierunkowe. Porównaj bilans i pokaż koszt 38.</li><li>Na końcu zmień jedną wagę w edytorze i sprawdź nowy wynik.</li></ol>,
    notes: 'Poproś o przewidzenie, czy zmiana punktu startowego zmieni koszt. Następnie sprawdź to na grafie.',
  },
]

export function Presentation() {
  const dialog = useRef(null)
  const [index, setIndex] = useState(0)
  const { title, body, notes } = slides[index]

  function advance(delta) {
    setIndex(current => Math.max(0, Math.min(slides.length - 1, current + delta)))
  }

  return (
    <>
      <button className="primary" type="button" onClick={() => dialog.current.showModal()}>Otwórz prezentację</button>
      <dialog ref={dialog} className="slide-dialog" aria-labelledby="slide-title" onKeyDown={event => {
        if (event.altKey || event.ctrlKey || event.metaKey) return
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault()
          advance(event.key === 'ArrowRight' ? 1 : -1)
        }
      }}>
        <div className="slide-frame">
          <div className="slide-bar">
            <span aria-live="polite">Slajd {index + 1} z {slides.length}</span>
            <button type="button" onClick={() => dialog.current.close()}>Zamknij prezentację</button>
          </div>
          <div className="slide-content" aria-live="polite">
            <h2 id="slide-title">{title}</h2>
            {body}
          </div>
          <details key={index}>
            <summary>Notatka do omówienia</summary>
            <p>{notes}</p>
          </details>
          <div className="slide-controls">
            <button type="button" onClick={() => advance(-1)} disabled={index === 0}>← Wstecz</button>
            <button className="primary" type="button" onClick={() => advance(1)} disabled={index === slides.length - 1}>Dalej →</button>
            <a href="#demo-title" onClick={() => dialog.current.close()}>Przejdź do demonstracji</a>
          </div>
        </div>
      </dialog>
    </>
  )
}

export function Theory() {
  return (
    <section id="algorytm" className="theory study">
      <header className="study-header">
        <h2>Dokumentacja algorytmu</h2>
        <Presentation />
      </header>
      <p className="theory-intro">Minimalizujemy koszt zamkniętej trasy, która pokonuje wszystkie krawędzie lub łuki co najmniej raz. Koszt przejścia liczymy za każdym razem, także przy powrocie tą samą ulicą.</p>
      <div className="theory-grid">
        <article>
          <h3>Model i założenia</h3>
          <p>Graf G = (V, E) opisuje skrzyżowania i ulice. Każde połączenie ma dodatnią wagę. W demonstracji wagi są całkowite, od 1 do 999. Sieć musi być spójna, a w wariancie skierowanym silnie spójna, by dało się obsłużyć wszystkie ulice w jednej zamkniętej trasie.</p>
          <p>Jeśli m(e) oznacza liczbę przejść po połączeniu e, koszt wynosi Σ w(e) · m(e), przy m(e) ≥ 1. Suma wag oryginalnych połączeń jest stała, więc optymalizujemy koszt dodatkowych przejść.</p>
        </article>
        <article>
          <h3>Najkrótsze ścieżki</h3>
          <p>Floyd–Warshall oblicza odległości między wszystkimi parami. Dla kolejnego wierzchołka k sprawdzamy, czy ścieżka z i do j przez k jest tańsza od dotychczasowej. Zapamiętujemy też pierwszy krok, aby odtworzyć krawędzie wybranej ścieżki.</p>
          <p>Odległość jest nieskończona, gdy nie istnieje ścieżka. Program wykrywa w ten sposób rozłączony graf lub brak silnej spójności. Obliczenia zajmują O(n³) czasu i O(n²) pamięci dla n wierzchołków.</p>
        </article>
        <article>
          <h3>Graf nieskierowany. Parowanie stopni</h3>
          <p>Wejście i wyjście z wierzchołka zużywa parę krawędzi. Każdy stopień w cyklu Eulera jest więc parzysty. Powielenie ścieżki dodaje jeden do stopnia obu końców i dwa do stopnia każdego wewnętrznego wierzchołka.</p>
          <p>Program wybiera pierwszy nieparzysty wierzchołek, rozważa każdego dostępnego partnera i dodaje minimalny koszt sparowania reszty. Zapamiętuje wyniki dla podzbiorów. Złożoność czasowa ma górne ograniczenie O(k² · 2ᵏ) dla k nieparzystych wierzchołków. Edytor dopuszcza do 16 wierzchołków.</p>
          <WorkedExample directed={false} />
        </article>
        <article>
          <h3>Graf skierowany. Wyrównanie bilansu</h3>
          <p>Definiujemy bilans jako stopień wyjściowy minus wejściowy. Dodatkowa ścieżka zwiększa bilans początku o jeden i zmniejsza bilans końca o jeden. Bilans wierzchołków pośrednich się nie zmienia.</p>
          <p>Zadanie przepływu wyznacza, ile ścieżek poprowadzić od wierzchołków z ujemnym bilansem do wierzchołków z dodatnim. Kosztem jednostki jest długość najkrótszej ścieżki. Algorytm Bellmana–Forda szuka kolejnych ścieżek w sieci resztowej, której łuki wsteczne pozwalają skorygować wcześniejsze przydziały.</p>
          <WorkedExample directed />
        </article>
        <article>
          <h3>Uzasadnienie optymalności</h3>
          <p>Weź dowolną poprawną trasę i odłóż po jednym przejściu każdego połączenia. Pozostałe przejścia rozkładają się na ścieżki naprawiające stopnie lub bilans oraz na cykle. Cykle mają dodatni koszt i nie są potrzebne do naprawy bilansu. Koszt każdej ścieżki jest co najmniej równy odległości między jej końcami.</p>
          <p>Minimalne skojarzenie lub minimalny przepływ daje więc dolną granicę kosztu dodatkowych przejść. Osiągamy ją, kopiując wybrane najkrótsze ścieżki. Powiększony graf ma wtedy cykl Eulera, który wykorzystuje każdą kopię dokładnie raz.</p>
        </article>
        <article>
          <h3>Budowa i kontrola trasy</h3>
          <p>Hierholzer przechodzi po nieużytych połączeniach. Gdy nie ma już gdzie przejść, wycofuje się po stosie i zapisuje kroki w odwrotnej kolejności. W ten sposób łączy zamknięte fragmenty w jeden cykl. Czas działania jest liniowy względem liczby połączeń po dodaniu kopii.</p>
          <p>W demonstracji można sprawdzić, czy początek i koniec trasy są identyczne, czy wszystkie połączenia zostały pokonane i czy suma wag kroków odpowiada kosztowi całkowitemu. Punkt startowy może zmienić kolejność przejścia. Kilka różnych tras może mieć ten sam minimalny koszt.</p>
        </article>
      </div>
      <p className="source"><a href={paper} target="_blank" rel="noreferrer">J. Edmonds i E. L. Johnson, „Matching, Euler tours and the Chinese postman” (1973)</a></p>
    </section>
  )
}
