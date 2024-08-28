// 游戏配置
export const gameConfig = {
  gameWidth: innerWidth > 300 ? innerWidth : 300,
  gameHeight: innerHeight > 500 ? innerHeight : 500,
  defaultSpeed: 400,
  fastSpeed: 50,
  speedStep: 100
}

// 贪吃蛇配置
export const snakeConfig = {
  snakeRadius: 20,
  defaultX: gameConfig.gameWidth / 2,
  defaultY: gameConfig.gameHeight / 2,
  defaultBodies: 3,
  bodyOffset: 20
}

// 食物配置
export const foodConfig = {
  foodRadius: 20
}
