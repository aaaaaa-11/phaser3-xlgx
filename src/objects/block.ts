import { blockConfig } from '@/gameConfig'

const { blockWidth, blockHeight } = blockConfig

export default class Block extends Phaser.GameObjects.Sprite {
  shadow?: Phaser.GameObjects.Rectangle
  key: string

  constructor(scene: Phaser.Scene, x: number, y: number, key: string, depth: number) {
    super(scene, x, y, key)
    scene.add.existing(this)
    this.key = key

    this.setInteractive({
      cursor: 'pointer'
    })

    this.setDisplaySize(blockWidth, blockHeight)

    this.setDepth(depth)
  }
}
