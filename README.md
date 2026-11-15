# Problem chińskiego listonosza

Interaktywna demonstracja w React i Vite. Dla zadanego grafu program szuka najtańszej zamkniętej trasy przechodzącej co najmniej raz przez każdą krawędź lub każdy łuk.

## Uruchomienie lokalne

Wymagany Node.js 24 z npm. W katalogu projektu wykonaj:

```sh
npm ci
npm run dev
```

Otwórz adres podany przez Vite, domyślnie `http://localhost:5173`. Polecenie `npm run build` tworzy pliki produkcyjne w katalogu `dist/`. Aplikacja oblicza trasę w przeglądarce i działa bez zewnętrznych usług.

## Wdrożenie w Dockerze

W katalogu projektu na serwerze wykonaj:

```sh
docker build -t chinski-listonosz .
docker run -d --name chinski-listonosz --restart unless-stopped -p 8080:80 chinski-listonosz
```

Strona będzie dostępna na porcie 8080 serwera. Przy wdrożeniu pod domeną możesz skierować reverse proxy na ten port. Możesz zmienić port 8080 po lewej stronie mapowania.

## Wdrożenie przez Portainera

### Stack z repozytorium Git

Na środowisku Docker Standalone obsługującym budowanie obrazów umieść projekt z `compose.yaml` w repozytorium Git. W Portainerze przejdź do **Stacks → Add stack → Git repository**, podaj adres i gałąź repozytorium, ustaw **Compose path** na `compose.yaml` i kliknij **Deploy the stack**. W razie potrzeby ustaw zmienną `LISTONOSZ_PORT` na wybrany port. Domyślny to 8080.

### Stack z obrazu dostępnego na serwerze

Jeśli Portainer zarządza zdalnym środowiskiem Docker przez agenta lub wolisz wdrożyć bez repozytorium, zbuduj obraz na docelowym serwerze poleceniem `docker build -t chinski-listonosz:local .`. Następnie w Portainerze wybierz **Stacks → Add stack → Web editor** i wklej:

```yaml
services:
  listonosz:
    image: chinski-listonosz:local
    pull_policy: never
    ports:
      - "8080:80"
    restart: unless-stopped
```

Kliknij **Deploy the stack** i otwórz `http://ADRES_IP_SERWERA:8080`. Jeśli działa już poprzedni kontener na porcie 8080, ustaw inny port po lewej stronie mapowania.

## Scenariusz prezentacji

1. Wybierz **Osiedle**. Rozwiń stopnie wierzchołków i dodatkowe przejścia. Suma wag wynosi 31, najtańsze powtórzenia kosztują 9, a optymalna trasa kosztuje 40.
2. Wybierz **Ulice jednokierunkowe**. Pokaż bilans wejść i wyjść, a następnie odtwórz zamkniętą trasę. Kierunek każdego łuku musi zostać zachowany.
3. Wybierz **Cykl Eulera**. Koszt powtórzeń wynosi 0, a trasa pokonuje każdą krawędź dokładnie raz.
4. Kliknij **Własny graf**, dodaj połączenia i zmień ich wagi. **Edytuj graf** otwiera także edytor aktualnego przykładu. Wybierz punkt startowy i porównaj koszty w panelu wyniku.

Na rysunku kliknięcie wierzchołka ustawia punkt startowy, a przeciągnięcie zmienia układ. Przycisk **Rysuj połączenia** pozwala wpisać wagę i wskazać kolejno oba końce. W grafie skierowanym kolejność wyznacza kierunek łuku. Z klawiatury użyj Tab i Enter, a w trybie układania także strzałek. Podczas odtwarzania można zmieniać tempo i obserwować narastający koszt.

## Dane i metoda

- Edytor przyjmuje od 2 do 16 wierzchołków i wagi całkowite od 1 do 999. Krawędzie i łuki łączą różne wierzchołki. W grafie skierowanym można dodać dwa przeciwne łuki.
- Graf nieskierowany musi być spójny, a skierowany musi być silnie spójny. Aplikacja przelicza wynik po zmianie grafu i wyświetla komunikat dla niepoprawnych danych.
- Floyd–Warshall wyznacza odległości i pozwala odtworzyć najkrótsze ścieżki w czasie O(V³).
- Wariant nieskierowany dobiera pary wierzchołków o nieparzystych stopniach za pomocą programowania dynamicznego po maskach. Dla k nieparzystych wierzchołków ograniczenie czasowe wynosi O(k² · 2ᵏ). Limit edytora utrzymuje ten etap w skali odpowiedniej dla demonstracji.
- Wariant skierowany wyrównuje liczbę wejść i wyjść za pomocą przepływu o minimalnym koszcie. Kolejne ścieżki powiększające w sieci resztowej wyznacza algorytm Bellmana–Forda.
- Algorytm Hierholzera składa trasę Eulera po dodaniu kopii połączeń. Całkowity koszt to suma wag oryginalnych połączeń i koszt ich koniecznych powtórzeń.
- Obliczenia znajdują się w `src/solver.js`, przykłady w `src/examples.js`, a interfejs i omówienie na stronie w `src/main.jsx`.

Literatura: [J. Edmonds i E. L. Johnson, *Matching, Euler tours and the Chinese postman* (1973)](https://research.ibm.com/publications/matching-euler-tours-and-the-chinese-postman).
