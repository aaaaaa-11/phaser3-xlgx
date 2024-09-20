import Phaser from 'phaser'
import AssetKeys from '@/consts/AssetKeys'
import SceneKeys from '@/consts/SceneKeys'
import GameStateKeys from '@/consts/GameStateKeys'
import { gameConfig, troughConfig, blockConfig } from '@/gameConfig'
import Score from '@/objects/score'
import GameEventKeys from '@/consts/GameEventKeys'
import Block from '@/objects/block'
import AnimationKeys from '@/consts/AnimationKeys'
import MergeBlock from '@/objects/mergeBlock'

const { blockWidth, blockHeight, blockTypes, blockGroups, blockTop } = blockConfig
const { gameWidth, gameHeight, rows, cols, level, randomRange, mergeScore } = gameConfig
const totalBlockCounts = blockTypes * blockGroups * 3

const halfWidth = gameWidth / 2
const halfHeight = gameHeight / 2

export default class Preloader extends Phaser.Scene {
  /** @type {Score} 得分文字 */
  scoreText!: Score
  /** @type {number} 得分数字 */
  score = 0

  /** @type {string} 游戏状态 */
  gameState = GameStateKeys.BeforeStart

  /** @type {Image} 卡槽 */
  trough!: Image

  /** @type {Grid[][][]} 所有格子，第一层数组表示图层，第二层数组表示行，第三层表示列 */
  grids: Grid[][][] = []

  /** @type {Block} 鼠标点下选中的图片 */
  currentBlock?: Block

  /** @type {Block[]} 卡槽内方块 */
  troughBlocks: Block[] = []

  /** @type {boolean} 从鼠标点下->抬起->卡片移到卡槽->合并期间，不能点击图片 */
  unableClick: boolean = false

  /** @type {number} 当前页面上的图案数量 */
  blockCounts: number = 0

  constructor() {
    super(SceneKeys.Game)
  }

  create() {
    // 背景
    this.add.image(0, 0, AssetKeys.GameBg).setOrigin(0, 0).setDisplaySize(gameWidth, gameHeight)

    // 得分
    this.scoreText = new Score(this)

    this.createTrough()

    // 监听鼠标操作
    this.input.on('pointerup', this.onPointerUp, this)

    // 初始化游戏
    this.initData()
    this.game.events.on(GameEventKeys.Running, this.initData, this)

    // 合并动画
    this.anims.create({
      key: AnimationKeys.Merge,
      frames: [
        {
          key: AssetKeys.MergeBlock1
        },
        {
          key: AssetKeys.MergeBlock2
        },
        {
          key: AssetKeys.MergeBlock3
        }
      ],
      frameRate: 8
    })
  }

  // 创建卡槽
  createTrough() {
    const { troughCounts, padding } = troughConfig
    const width = troughCounts * blockWidth + padding * 2
    const height = blockHeight + padding * 2
    this.trough = this.add
      .image(halfWidth - width / 2, gameHeight - height / 2, AssetKeys.Trough)
      .setDisplaySize(width, height)
      .setOrigin(0, 0.5)
  }

  // 打乱顺序
  shuffle(keys: number[]) {
    const newIndexs: number[] = []

    const len = keys.length
    for (let i = 0; i < len; i++) {
      const randomIndex = Phaser.Math.Between(0, keys.length - 1)
      newIndexs.push(keys.splice(randomIndex, 1)[0])
    }
    return newIndexs
  }

  // 初始化数据
  initData() {
    this.clearBlocks()
    this.score = 0
    this.scoreText.updateScore(this.score)

    this.blockCounts = 0

    // 生成图案
    this.createBlocks()

    this.gameState = GameStateKeys.Running
  }

  // 创建图案
  createBlocks() {
    // 创建图案索引：blockTypes种图像，每种图像3张 * blockGroups组
    let keys = Array(totalBlockCounts)
      .fill(0)
      .map((_, i) => i % blockTypes)

    // 打乱顺序
    keys = this.shuffle(keys)
    // 记录创建的图案数量
    this.blockCounts = keys.length

    // 创建图层
    const avarageCount = Math.floor(totalBlockCounts / level) // 平均每层有多少个
    if (
      avarageCount - randomRange[1] < 0 ||
      avarageCount + randomRange[1] * level > (rows - 1) * (cols - 1)
    )
      throw new Error('随机数过大')
    // 每一层有多少个
    // （自底向上）[第一层：平均+随机数，第二层：平均数 - 随机数，...，最后一层：剩下的]
    const counts = Array(level - 1)
      .fill(0)
      .map((_, i) => {
        const randomCount = Phaser.Math.Between(randomRange[0], randomRange[1]) // 取一个随机数
        return i % 2 ? avarageCount - randomCount : avarageCount + randomCount
      })
    const last = keys.length - counts.reduce((a, b) => a + b, 0)
    counts.push(last)

    this.createGrids()
    this.addBlocksToGrids(counts, keys)
    this.checkOverlaps()
  }

  // 创建格子
  createGrids() {
    const grids = this.grids
    const blocksW = rows * blockWidth // 整个铺设图案所占用宽度
    const defaultX = (gameWidth - blocksW) / 2 // 铺设图案最左边位置

    // 遍历图层
    for (let l = 0; l < level; l++) {
      const levelGrids: Grid[][] = []
      const needOffset = l % 2 // 偶数层需要偏移
      const offset = needOffset ? 1 : 0.5
      for (let i = 0; i < rows; i++) {
        if (needOffset && i === rows - 1) continue // 偶数层少铺设一行
        for (let j = 0; j < cols; j++) {
          if (needOffset && j === cols - 1) continue // 偶数层少铺设一列
          const x = defaultX + blockWidth * (offset + j)
          const y = blockTop + blockHeight * (offset + i)
          if (!levelGrids[i]) {
            levelGrids[i] = []
          }
          levelGrids[i].push({
            x,
            y,
            row: i,
            col: j
          })
        }
      }
      grids[l] = levelGrids
    }
  }

  // 创建block随机挂到grid上
  addBlocksToGrids(counts: number[], keys: number[]) {
    // 遍历每一层
    counts.forEach((levelCounts, l) => {
      // 每一层格子数
      const grids = this.grids[l].flat()
      for (let i = 0; i < levelCounts; i++) {
        if (!grids.length) throw new Error('格子数不够')
        // 从当前层随机取一个格子(不重复)
        const randomIndex = Phaser.Math.Between(0, grids.length - 1)
        const grid = grids[randomIndex]
        // 创建block
        const { x, y } = grid
        const block = new Block(
          this,
          x,
          y,
          AssetKeys[`Block${keys.pop()}` as keyof typeof AssetKeys],
          l + 1
        )

        // 监听图案点击事件
        block.on('pointerdown', () => {
          // 如果图案上没有阴影(最上面) && 允许点击
          if (!block.shadow && !this.unableClick && this.gameState === GameStateKeys.Running) {
            // 不能同时点击两个图案，先标记当前不可点击状态，然后设置当前点击图案放大，记录当前图案
            this.unableClick = true
            block.setScale(block.scaleX * 1.2, block.scaleY * 1.2)
            this.currentBlock = block
          }
        })
        block.on('pointerup', () => {
          // 如果是在当前图案上抬起
          if (this.currentBlock === block && this.gameState === GameStateKeys.Running) {
            this.selectBlock(block, grid)
          }
        })

        grid.block = block
        grids.splice(randomIndex, 1)
      }
    })
  }

  // 检查遮挡，顶部被遮挡的要加阴影
  checkOverlaps() {
    this.grids.forEach((levelGrids, l) => {
      const lastLevel = l === gameConfig.level - 1
      levelGrids.forEach((row) => {
        row.forEach((col) => {
          const block = col.block
          if (!block) return
          // 如果当前图案在最上层且有阴影，则删掉阴影
          if (lastLevel && block.shadow) {
            block.shadow?.destroy(true)
            block.shadow = undefined
          } else if (!lastLevel) {
            // 如果当前图案不在最上层，检查其上是否有遮挡
            const needShadow = this.checkNeedShadow(col.row, col.col, l)
            // 如果没有遮挡（如果有阴影则删除阴影），返回
            if (!needShadow) {
              if (block.shadow) {
                block.shadow.destroy(true)
                block.shadow = undefined
              }
              return
            }

            if (block.shadow) {
              // 如果有阴影，不用重复生成
              return
            }

            // 生成阴影
            const mask = this.add
              .rectangle(block.x, block.y, blockWidth, blockHeight, 0x000000, 0.5)
              .setDepth(block.depth)
            block.shadow = mask
          }
        })
      })
    })
  }

  // 判断图像有没有被遮挡
  checkNeedShadow(row: number, col: number, level: number) {
    const currIsOffset = level % 2 // 当前这层是否偏移
    // 当前位置上面每一层都看看是否有遮挡
    for (let i = level + 1; i < gameConfig.level; i++) {
      const compareIsOffset = (i - level) % 2 // 两个图层之间是否相互偏移
      const levelGrids = this.grids[i]
      // 没有上面一层，则不会被遮挡
      if (!levelGrids || !levelGrids.some((row) => row.some((col) => col.block))) {
        continue
      }
      if (!compareIsOffset) {
        // 对比两个不偏移的图层，只需要对比当前格子正上方有没有格子
        if (levelGrids[row][col].block) return false
      } else {
        // 对比相互偏移的图层，需要看有没有四个角上的格子，每个格子上有没有图案，有1个就算遮挡
        const row1 = levelGrids[currIsOffset ? row : row - 1]
        const row2 = levelGrids[currIsOffset ? row + 1 : row]
        const col1 = currIsOffset ? col : col - 1
        const col2 = currIsOffset ? col + 1 : col
        if (row1 && (row1[col1]?.block || row1[col2]?.block)) {
          return true
        }
        if (row2 && (row2[col1]?.block || row2[col2]?.block)) {
          return true
        }
      }
    }
    return false
  }

  // 如果鼠标没在按下的图案上抬起，则将放大的图案还原
  onPointerUp() {
    // 恢复格子样式
    this.currentBlock?.setDisplaySize(blockWidth, blockHeight)
    this.unableClick = false
    this.currentBlock = undefined
  }

  // 选中图案
  selectBlock(block: Block, grid: Grid) {
    // 找到卡槽里合适的位置
    const pos = this.putBlockIntrough(block)
    const [x, y] = pos

    // 放到下方卡槽里
    const tws = this.tweens.add({
      targets: block,
      x,
      y,
      duration: 100,
      ease: 'Sine.easeInOut'
    })

    tws.on('complete', () => {
      // 放下block后检查是否需要合并
      this.checkMerge(block.key)
      this.unableClick = false
      // 卡槽满了
      if (this.troughBlocks.length >= troughConfig.troughCounts) {
        this.gameOver()
        return
      }
      if (!this.blockCounts) {
        // 赢了
        this.gameOver()
        return
      }
      // tws.destroy()
    })

    grid.block = null
    this.checkOverlaps()
  }

  // 找到卡槽里适合放当前block的位置
  putBlockIntrough(block: Block): [number, number] {
    // 从右往左找到与当前block图案相同的索引
    let last = this.troughBlocks.findLastIndex((b) => b.key === block.key)
    // 如果没找到，就用最右边的图案索引
    if (last <= -1) {
      last = this.troughBlocks.length - 1
    }
    // 放置当前block的索引 = 找到的索引下一个
    const index = last + 1
    // block的位置
    const x = this.trough.x + troughConfig.padding + blockWidth * (index + 0.5)
    const y = this.trough.y
    // 如果要放置的位置上已经有别的block了，则将这个位置及之后的block向右移动一格
    if (this.troughBlocks[index]) {
      const len = this.troughBlocks.length
      for (let i = len - 1; i >= index; i--) {
        this.troughBlocks[i].x += blockWidth
        this.troughBlocks[i + 1] = this.troughBlocks[i]
      }
    }
    // index上放block
    this.troughBlocks[index] = block
    return [x, y]
  }

  // 检查合并
  checkMerge(key: string) {
    // 在卡槽中找到第一个和当前block key相同的图案索引
    const index = this.troughBlocks.findIndex((b) => b.key === key)
    const pos = this.troughBlocks.map((i) => i.x)
    // 如果该索引后第二个也是该图案（三个一样的key），则需要合并
    if (this.troughBlocks[index + 2]?.key === key) {
      // 从第一个key位置开始向右侧遍历
      const len = this.troughBlocks.length
      for (let i = index; i < len; i++) {
        let block: Block | undefined // 指向第i个block
        // 第i+3的位置上有block，则移除i位置上的block，将该i+3的block移到i位置上
        const hasMoveItem = i + 3 < len
        if (hasMoveItem) {
          const moveItem = this.troughBlocks[i + 3]
          // 合并的三个
          block = this.troughBlocks.splice(i, 1, moveItem)[0] // 用i后第三个替换i位置的元素
          this.tweens.add({
            targets: moveItem,
            x: pos[i], // 交换两者位置
            duration: 100,
            delay: 200
          })
        } else {
          block = this.troughBlocks[i]
        }
        // 合并的三个移出来销毁
        if (i < index + 3) {
          const mergeBlock = new MergeBlock(this, block.x, block.y)
          block.destroy(true)
          mergeBlock.play(AnimationKeys.Merge).on('animationcomplete', () => {
            mergeBlock.destroy(true)
          })
        }
      }
      // 修改卡槽和总的block数量
      this.blockCounts -= 3
      this.troughBlocks.length -= 3

      this.addScore()
    }
  }

  // 得分++
  addScore() {
    this.score += mergeScore
    this.scoreText.updateScore(this.score)
  }

  // 游戏结束
  gameOver() {
    if (this.gameState === GameStateKeys.GameOver) return
    this.gameState = GameStateKeys.GameOver

    if (!this.scene.isActive(SceneKeys.GameOver)) {
      this.scene.run(SceneKeys.GameOver, { score: this.score, win: !this.blockCounts })
    }
  }

  clearBlocks() {
    this.grids.forEach((l) => {
      l.forEach((row) => {
        row.forEach((col) => {
          const b = col.block
          if (b) {
            b.destroy(true)
            b.shadow?.destroy(true)
            b.shadow = undefined
            col.block = null
          }
        })
      })
    })
    this.grids = []
    this.troughBlocks.forEach((b) => {
      b.destroy(true)
    })
    this.troughBlocks = []
  }
}
