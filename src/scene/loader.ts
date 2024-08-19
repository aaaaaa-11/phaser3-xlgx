import Phaser from 'phaser'
import AssetKeys from '@/consts/AssetKeys'
import SceneKeys from '@/consts/SceneKeys'
import { gameConfig } from '@/gameConfig'

const ORIGIN = location.origin // 项目域名

export default class Loader extends Phaser.Scene {
  progressBar!: Phaser.GameObjects.Rectangle
  text!: Phaser.GameObjects.Text

  constructor() {
    super(SceneKeys.Loader)
  }

  init() {
    const barWidth = 40
    this.progressBar = this.add.rectangle(
      0,
      gameConfig.gameHeight / 2 - barWidth,
      0,
      barWidth,
      0x50a3b2
    )
    this.text = this.add.text(
      gameConfig.gameWidth / 2,
      gameConfig.gameHeight / 2 + barWidth,
      '0%',
      {
        fontSize: '32px',
        color: '#cb58bf',
        align: 'center'
      }
    )

    this.load.on('progress', (progress: number) => {
      this.progressBar.width = gameConfig.gameWidth * progress
      this.text.setText(`${Math.floor(progress * 100)}%`)
    })
  }

  preload() {
    // 加载图片
    Object.values(AssetKeys).forEach((key) => {
      if (key === AssetKeys.Bg) return
      this.load.image(key, ORIGIN + '/assets/' + key + '.png')
    })

    this.load.on('complete', () => {
      this.progressBar.destroy()
      this.text.destroy()
      this.scene.start(SceneKeys.Main)
    })
  }
}
