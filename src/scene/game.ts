import Phaser from 'phaser'
import AssetKeys from '@/consts/AssetKeys'
import SceneKeys from '@/consts/SceneKeys'
import GameStateKeys from '@/consts/GameStateKeys'
import { foodConfig, gameConfig, snakeConfig } from '@/gameConfig'
import Score from '@/objects/score'
import Food from '@/objects/food'
import AnimationKeys from '@/consts/AnimationKeys'
import GameEventKeys from '@/consts/GameEventKeys'

const { gameWidth, gameHeight } = gameConfig
const { snakeRadius, defaultX, defaultY, defaultBodies, bodyOffset } = snakeConfig
const { foodRadius } = foodConfig

const halfWidth = gameWidth / 2
const halfHeight = gameHeight / 2

// 移动定时器
let moveTimer: Phaser.Time.TimerEvent
// 防止移动鼠标时总是调用移动函数
let moveDelayTimer: NodeJS.Timeout | null = null

export default class Preloader extends Phaser.Scene {
  /** @type {Score} 得分文字 */
  scoreText!: Score
  /** @type {number} 得分数字 */
  score = 0
  /** @type {(PhysicsSprite|PhysicsImage)[]} 贪吃蛇  */
  snake: (PhysicsSprite | PhysicsImage)[] = []
  /** @type {PhysicsSprite} 贪吃蛇的蛇头 */
  head!: PhysicsSprite

  /** @type {PhysicsStaticImage} 食物 */
  food!: Food

  /** @type {string} 游戏状态 */
  gameState = GameStateKeys.BeforeStart

  /** @type {boolean} 鼠标是否按下 */
  isDown = false

  /** @type {Phaser.Geom.Line} 移动路径 */
  path!: Phaser.Geom.Line // 移动路径

  /** @type {Phaser.Geom.Point[]} 蛇的移动轨迹点 */
  points: Phaser.Geom.Point[] = []

  /** @type {Phaser.Geom.Point} 上一个轨迹点 */
  prevPoint = new Phaser.Geom.Point()

  /** @type {number} 速度 */
  speed = gameConfig.defaultSpeed // 速度

  /** @type {Phaser.Geom.Point} 路径与边界的交点 */
  point = new Phaser.Geom.Point()

  constructor() {
    super(SceneKeys.Game)
  }

  create() {
    // 设置物理世界边界
    this.physics.world.setBounds(0, 0, gameWidth, gameHeight)
    // 背景
    this.add.image(0, 0, AssetKeys.GameBg).setOrigin(0, 0).setDisplaySize(gameWidth, gameHeight)

    // 得分
    this.scoreText = new Score(this)

    // 贪吃蛇
    this.createSnake()

    // 食物
    this.createFood()
    // 创建动画
    this.anims.create({
      key: AnimationKeys.Eating,
      frames: [
        {
          key: AssetKeys.Head1
        },
        {
          key: AssetKeys.Head2,
          duration: 10
        },
        {
          key: AssetKeys.Head3,
          duration: 10
        }
      ],
      frameRate: 8,
      repeat: 0,
      yoyo: true
    })

    // 监听鼠标操作
    this.input.on('pointerdown', this.onPointerDown, this)
    this.input.on('pointermove', this.onPointerMove, this)
    this.input.on('pointerup', this.onPointerUp, this)

    // 监听蛇头和食物碰撞
    this.physics.add.overlap(this.food, this.head, this.eatFood, undefined, this)

    // 初始化游戏
    this.initData()
    this.game.events.on(GameEventKeys.Running, this.initData, this)
  }

  // 创建一节蛇身
  createBody() {
    const diameter = snakeRadius * 2
    const img = this.physics.add
      .image(0, 0, AssetKeys.Body)
      .setPosition(this.prevPoint.x, this.prevPoint.y)
      .setDisplaySize(diameter, diameter)
    img.setCircle(img.width / 2)

    this.snake.push(img)
    this.snake.forEach((s, i) => {
      s.depth = this.snake.length - i
    })
  }

  // 创建贪吃蛇
  createSnake() {
    let img: PhysicsImage | PhysicsSprite
    const diameter = snakeRadius * 2
    for (let i = 0; i <= defaultBodies; i++) {
      if (i === 0) {
        this.head = this.physics.add.sprite(0, 0, AssetKeys.Head1)

        img = this.head
        img.setCollideWorldBounds(true)
      } else {
        img = this.physics.add.image(0, 0, AssetKeys.Body)
      }

      img.setDisplaySize(diameter, diameter)
      img.setCircle(img.width / 2)
      this.snake.push(img)
    }
  }

  // 初始化贪吃蛇
  initSnake() {
    this.head.angle = 0
    // 去除增长的身体
    const bodies = this.snake.splice(defaultBodies + 1)
    bodies.forEach((body) => body.destroy(true))

    for (let i = 0; i <= defaultBodies; i++) {
      const s = this.snake[i]

      // 设置位置和层级，使得贪吃蛇依次往后排列，且每一节层级在后一节上面
      s.setPosition(defaultX - bodyOffset * i, defaultY).setDepth(defaultBodies - i)
    }
  }

  // 创建食物
  createFood() {
    this.food = new Food(this)
  }

  // 更新食物位置
  updateFoodPos() {
    this.food.updatePos(
      this.snake.map((s) => [s.x, s.y]),
      snakeRadius,
      halfWidth,
      halfHeight,
      foodRadius
    )
  }

  // 鼠标按下操作
  // 路径：从蛇头到点击处画线延申至边界
  onPointerDown(pointer: Phaser.Input.Pointer) {
    const { downX, downY } = pointer

    this.caculatePath(downX, downY)

    this.isDown = true
  }

  // 鼠标移动操作
  // 路径：蛇头与鼠标移动位置连线延申至边界
  onPointerMove(pointer: Phaser.Input.Pointer) {
    // 只有鼠标点下后再移动才生效
    if (!this.isDown) return

    // 移动不需要每一次都处理，可以定个时
    if (moveDelayTimer) return
    moveDelayTimer = setTimeout(() => {
      moveDelayTimer && clearTimeout(moveDelayTimer)
      moveDelayTimer = null
    }, 100)

    const {
      position: { x: moveX, y: moveY }
    } = pointer

    this.caculatePath(moveX, moveY)
  }

  // 鼠标抬起操作
  // 路径：鼠标抬起瞬间，最后两个点之间连线延伸至边界处
  onPointerUp() {
    if (this.gameState === GameStateKeys.GameOver) return

    this.isDown = false
  }

  // 根据蛇头和当前鼠标点位计算路径（连线延伸至边界）
  caculatePath(nextX: number, nextY: number) {
    if (this.gameState === GameStateKeys.GameOver) return
    const { x: prevX, y: prevY } = this.head

    // 计算两点之间的角度
    const radius = Phaser.Math.Angle.Between(prevX, prevY, nextX, nextY)
    const angle = (radius * 180) / Math.PI
    this.head.angle = angle

    // 找到对应边界上的点
    const isLeft = prevX - nextX > 0
    const isTop = prevY - nextY > 0
    const width = isLeft ? prevX * 2 : (gameWidth - prevX) * 2
    const height = isTop ? prevY * 2 : (gameHeight - prevY) * 2
    const rect = new Phaser.Geom.Rectangle(0, 0, width, height)
    rect.centerX = prevX
    rect.centerY = prevY
    Phaser.Geom.Rectangle.PerimeterPoint(rect, angle, this.point)

    // 画线：当前蛇头位置->点击处->边界上的点
    this.path.setTo(prevX, prevY, this.point.x, this.point.y)

    this.getPoints()

    this.moveSnake()
  }

  // 根据路径长度获取轨迹点
  getPoints() {
    this.points = this.path.getPoints(0, bodyOffset)

    this.points.push(this.point)

    if (this.points.length < 2) {
      console.log('没有下一个点')

      this.gameOver()
    }
  }

  // 初始化数据
  initData() {
    this.speed = gameConfig.defaultSpeed
    this.points = []

    this.initSnake()

    // 跟随路径，初始为中心点水平延伸至右侧边界
    this.path = new Phaser.Geom.Line(this.head.x, this.head.y, gameWidth, gameHeight / 2)
    this.getPoints()
    this.updateFoodPos()

    this.score = 0
    this.scoreText.updateScore(this.score)

    this.gameState = GameStateKeys.Running

    // 创建移动定时器
    moveTimer = this.time.addEvent({
      delay: this.speed,
      loop: true,
      callback: () => this.moveSnake()
    })
  }

  moveSnake() {
    if (this.gameState === GameStateKeys.GameOver) return

    // 贪吃蛇位置更新
    // 蛇头按points轨迹运行，蛇身依次移动到前一个蛇身位置
    // points[0]是蛇头当前位置，应该移动到下一个点(points[1])
    try {
      for (let i = this.snake.length - 1; i >= 0; i--) {
        if (i === 0) {
          this.snake[i].x = this.points[1].x
          this.snake[i].y = this.points[1].y
        } else {
          this.snake[i].x = this.snake[i - 1].x
          this.snake[i].y = this.snake[i - 1].y
        }
      }
    } catch (error) {
      console.log('没有下一个点，捕获错误')
      this.gameOver()
      return
    }
    // 记录上一个轨迹点
    this.prevPoint = this.points[0]
    // 移动后丢弃轨迹第一个点
    this.points.shift()

    // 当移动到边界则游戏结束
    if (
      this.head.x <= this.head.width / 2 ||
      this.head.y <= this.head.height / 2 ||
      this.head.x >= gameWidth - this.head.width / 2 ||
      this.head.y >= gameHeight - this.head.height / 2
    ) {
      console.log('碰到边界了')
      this.gameOver()
      return
    }
  }

  // 吃到食物
  eatFood() {
    // “吃”动画
    this.head.play(AnimationKeys.Eating)

    this.createBody()
    this.addScore()

    // 速度加快，但是不能超过最快速度
    if (this.speed > gameConfig.fastSpeed + gameConfig.speedStep) this.speed -= gameConfig.speedStep
    else {
      this.speed = gameConfig.fastSpeed
    }

    // 更新移动定时器
    moveTimer.reset({
      delay: this.speed,
      callback: () => {
        this.moveSnake()
      },
      loop: true
    })

    this.updateFoodPos()
  }

  // 得分++
  addScore() {
    this.score++
    this.scoreText.updateScore(this.score)
  }

  // 游戏结束
  gameOver() {
    if (this.gameState === GameStateKeys.GameOver) return
    this.gameState = GameStateKeys.GameOver

    if (!this.scene.isActive(SceneKeys.GameOver)) {
      this.scene.run(SceneKeys.GameOver, { score: this.score })
    }

    this.time.removeEvent(moveTimer)
    moveDelayTimer && clearTimeout(moveDelayTimer)
    moveDelayTimer = null
  }
}
