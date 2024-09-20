interface GameOverData {
  score: number
  win: boolean
}

interface Grid {
  x: number
  y: number
  row: number
  col: number
  block?: Block
}
