import AssetKeys from '@/consts/AssetKeys'
import { blockConfig } from '@/gameConfig'

const { blockWidth, blockHeight } = blockConfig

export default class MergeBlock extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, AssetKeys.MergeBlock1)
    scene.add.existing(this)

    this.setInteractive({
      cursor: 'pointer'
    })

    this.setDisplaySize(blockWidth, blockHeight)
  }
}
