import AssetKeys from '@/consts/AssetKeys'
import { foodConfig, gameConfig } from '@/gameConfig'

const { foodRadius } = foodConfig
const { gameWidth, gameHeight } = gameConfig

export default class Food extends Phaser.Physics.Arcade.Image {
  /** @type {number} 检查重叠的次数（生成食物时需要检查是否与贪吃蛇重叠） */
  checkOverlapCount = 0

  /** @type {number} 最大检查重叠次数，防止多次调用检查函数报错：Maximum call stack size exceeded */
  maxCheckOverlapCount = 100

  constructor(scene: Phaser.Scene) {
    super(scene, 550, 300, AssetKeys.Food)
    scene.add.existing(this) // 将食物添加到场景中
    scene.physics.add.existing(this, true) // 将食物添加到物理世界中，用于碰撞检测
    const diameter = foodRadius * 2
    this.setDisplaySize(diameter, diameter)

    const body = this.body as Phaser.Physics.Arcade.StaticBody
    body.onCollide = true

    this.setCircle(foodRadius)
  }

  // 判断是否重叠，圆心(x1, x2)与圆心(y1, y2)之间的距离是否大于distance
  isOverlap(x1: number, y1: number, x2: number, y2: number, distance: number) {
    const [maxX, minX] = x1 > x2 ? [x1, x2] : [x2, x1]
    const [maxY, minY] = y1 > y2 ? [y1, y2] : [y2, y1]
    const x = maxX - minX
    const y = maxY - minY
    if (x > distance || y > distance) return false
    return Math.sqrt(x * x + y * y) < distance
  }

  // 获取食物位置：随机生成和贪吃蛇不重叠的圆，返回圆心
  getRandomPos(
    snakePos: number[][],
    snakeDistance: number,
    scoreX: number,
    scoreY: number,
    scoreDistance: number
  ): [number, number] {
    this.checkOverlapCount++
    // 随机位置生成一个圆
    const randomX = Phaser.Math.Between(foodRadius, gameWidth - foodRadius)
    const randomY = Phaser.Math.Between(foodRadius, gameHeight - foodRadius)

    if (this.checkOverlapCount > 100) {
      // 如果随机取100次都重叠，则直接用重叠的坐标作为食物坐标
      return [randomX, randomY]
    }
    // 食物不能被得分遮挡
    this.scene.physics.world.intersects
    if (this.isOverlap(scoreX, scoreY, randomX, randomY, scoreDistance)) {
      return this.getRandomPos(snakePos, snakeDistance, scoreX, scoreY, scoreDistance)
    }
    // 食物不能被蛇身体遮挡
    const contain = snakePos.some(([x, y], i) => {
      return this.isOverlap(x, y, randomX, randomY, snakeDistance)
    })
    if (contain) {
      return this.getRandomPos(snakePos, snakeDistance, scoreX, scoreY, scoreDistance)
    } else {
      return [randomX, randomY]
    }
  }

  updatePos(
    snakePos: number[][],
    snakeDistance: number,
    scoreX: number,
    scoreY: number,
    scoreDistance: number
  ) {
    this.checkOverlapCount = 0
    const [x, y] = this.getRandomPos(snakePos, snakeDistance, scoreX, scoreY, scoreDistance)
    const body = this.body as Phaser.Physics.Arcade.Body

    this.setPosition(x, y)
    body.center.set(x, y)
    body.position.set(x - this.width / 2, y - this.height / 2)
  }
}
