export const MAX_VERTICES = 16

function shortestPaths(count, edges, directed) {
  const distance = Array.from({ length: count }, (_, a) =>
    Array.from({ length: count }, (_, b) => a === b ? 0 : Infinity))
  const next = distance.map(row => row.map(() => null))

  function connect(from, to, index, weight) {
    if (weight < distance[from][to]) {
      distance[from][to] = weight
      next[from][to] = { to, index }
    }
  }

  edges.forEach(({ from, to, weight }, index) => {
    connect(from, to, index, weight)
    if (!directed) connect(to, from, index, weight)
  })

  for (let k = 0; k < count; k++) {
    for (let a = 0; a < count; a++) {
      for (let b = 0; b < count; b++) {
        const candidate = distance[a][k] + distance[k][b]
        if (candidate < distance[a][b]) {
          distance[a][b] = candidate
          next[a][b] = next[a][k]
        }
      }
    }
  }

  function path(from, to) {
    const steps = []
    while (from !== to) {
      const step = next[from][to]
      steps.push({ ...step, from })
      from = step.to
    }
    return steps
  }

  return { distance, path }
}

function matchOdd(odd, distance) {
  const memo = new Map([[0, { cost: 0 }]])
  function best(mask) {
    if (memo.has(mask)) return memo.get(mask)
    const first = Math.log2(mask & -mask)
    const remaining = mask ^ (1 << first)
    let result = { cost: Infinity }
    for (let second = first + 1; second < odd.length; second++) {
      if (!(remaining & (1 << second))) continue
      const rest = remaining ^ (1 << second)
      const cost = distance[odd[first]][odd[second]] + best(rest).cost
      if (cost < result.cost) result = { cost, second, rest }
    }
    memo.set(mask, result)
    return result
  }

  const pairs = []
  let mask = (1 << odd.length) - 1
  while (mask) {
    const { second, rest } = best(mask)
    pairs.push({ from: odd[Math.log2(mask & -mask)], to: odd[second], times: 1 })
    mask = rest
  }
  return pairs
}

function balanceArcs(balance, distance) {
  const count = balance.length
  const source = count
  const sink = count + 1
  const network = []
  const assignments = []
  const supply = balance.reduce((sum, value) => sum + Math.max(0, value), 0)

  function addArc(from, to, capacity, cost) {
    const forward = { from, to, capacity, cost }
    const reverse = { from: to, to: from, capacity: 0, cost: -cost, reverse: forward }
    forward.reverse = reverse
    network.push(forward, reverse)
    return forward
  }

  balance.forEach((value, vertex) => {
    if (value < 0) {
      addArc(source, vertex, -value, 0)
      balance.forEach((demand, to) => {
        if (demand > 0) assignments.push(addArc(vertex, to, supply, distance[vertex][to]))
      })
    }
    if (value > 0) addArc(vertex, sink, value, 0)
  })

  let sent = 0
  while (sent < supply) {
    const costs = Array(count + 2).fill(Infinity)
    const predecessor = Array(count + 2).fill(null)
    costs[source] = 0
    // Arcs in the residual network can have negative costs.
    for (let i = 0; i < count + 1; i++) {
      let changed = false
      for (const arc of network) {
        const candidate = costs[arc.from] + arc.cost
        if (arc.capacity > 0 && candidate < costs[arc.to]) {
          costs[arc.to] = candidate
          predecessor[arc.to] = arc
          changed = true
        }
      }
      if (!changed) break
    }

    const path = []
    for (let at = sink; at !== source; at = predecessor[at].from) {
      path.push(predecessor[at])
    }
    const amount = Math.min(...path.map(arc => arc.capacity))
    for (const arc of path) {
      arc.capacity -= amount
      arc.reverse.capacity += amount
    }
    sent += amount
  }

  return assignments
    .filter(arc => arc.reverse.capacity > 0)
    .map(({ from, to, reverse }) => ({ from, to, times: reverse.capacity }))
}

function eulerTour(count, edges, repeats, directed, start) {
  const adjacency = Array.from({ length: count }, () => [])
  edges.forEach(({ from, to, weight }, index) => {
    for (let copy = 0; copy <= repeats[index]; copy++) {
      const shared = { used: false }
      adjacency[from].push({ from, to, weight, index, shared })
      if (!directed) adjacency[to].push({ from: to, to: from, weight, index, shared })
    }
  })

  const stack = [{ to: start }]
  const tour = []
  while (stack.length) {
    const outgoing = adjacency[stack.at(-1).to]
    while (outgoing.at(-1)?.shared.used) outgoing.pop()
    const step = outgoing.pop()
    if (step) {
      step.shared.used = true
      stack.push(step)
    } else {
      const finished = stack.pop()
      if (finished.shared) {
        const { from, to, weight, index } = finished
        tour.push({ from, to, weight, index })
      }
    }
  }
  return tour.reverse()
}

export function solvePostman(count, edges, directed, start = 0) {
  if (!Number.isInteger(count) || count < 2 || count > MAX_VERTICES) {
    throw new Error('Podaj od 2 do 16 wierzchołków.')
  }
  if (!Number.isInteger(start) || start < 0 || start >= count) {
    throw new Error('Wybierz poprawny punkt startowy.')
  }
  const incoming = Array(count).fill(0)
  const outgoing = Array(count).fill(0)
  for (const { from, to, weight } of edges) {
    if (![from, to].every(v => Number.isInteger(v) && v >= 0 && v < count) || from === to) {
      throw new Error('Każde połączenie musi łączyć dwa różne wierzchołki.')
    }
    if (!Number.isInteger(weight) || weight < 1 || weight > 999) {
      throw new Error('Każda waga musi być liczbą całkowitą od 1 do 999.')
    }
    outgoing[from]++
    incoming[to]++
  }

  const { distance, path } = shortestPaths(count, edges, directed)
  if (distance.some(row => row.includes(Infinity))) {
    throw new Error(directed
      ? 'Graf musi być silnie spójny. Sprawdź, czy z każdego wierzchołka można dotrzeć do każdego innego zgodnie z kierunkiem strzałek.'
      : 'Graf musi być spójny. Połącz wszystkie wierzchołki drogami.')
  }

  const degree = incoming.map((value, i) => value + outgoing[i])
  const balance = outgoing.map((value, i) => value - incoming[i])
  const odd = degree.flatMap((value, i) => value % 2 ? [i] : [])
  const pairs = directed ? balanceArcs(balance, distance) : matchOdd(odd, distance)
  const repeats = edges.map(() => 0)
  const additions = pairs.map(pair => {
    const steps = path(pair.from, pair.to)
    steps.forEach(step => { repeats[step.index] += pair.times })
    return { ...pair, steps, cost: pair.times * distance[pair.from][pair.to] }
  })

  const baseCost = edges.reduce((sum, edge) => sum + edge.weight, 0)
  const extraCost = additions.reduce((sum, addition) => sum + addition.cost, 0)
  return {
    degree, balance, incoming, outgoing, additions, repeats, baseCost, extraCost,
    totalCost: baseCost + extraCost,
    tour: eulerTour(count, edges, repeats, directed, start),
  }
}
