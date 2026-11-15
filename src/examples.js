const edges = list => list.map(([from, to, weight]) => ({ from, to, weight }))
export const examples = [
  {
    name: 'Osiedle',
    count: 6,
    directed: false,
    edges: edges([[0, 1, 3], [1, 2, 4], [2, 3, 2], [3, 4, 5], [4, 5, 3], [5, 0, 4], [0, 2, 8], [1, 4, 2]]),
  },
  {
    name: 'Ulice jednokierunkowe',
    count: 5,
    directed: true,
    edges: edges([[0, 1, 2], [1, 2, 3], [2, 3, 2], [3, 4, 4], [4, 0, 2], [0, 2, 5], [4, 1, 3]]),
  },
  {
    name: 'Cykl Eulera',
    count: 4,
    directed: false,
    edges: edges([[0, 1, 2], [1, 2, 3], [2, 3, 4], [3, 0, 1]]),
  },
]
