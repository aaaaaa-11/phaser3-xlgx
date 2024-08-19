import Phaser from 'phaser'
import AssetKeys from '@/consts/AssetKeys'
import SceneKeys from '@/consts/SceneKeys'
import { gameConfig } from '@/gameConfig'
import GameEventKeys from '@/consts/GameEventKeys'

const { gameWidth, gameHeight } = gameConfig

export default class Preloader extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Main)
  }

  create() {
    // 背景
    this.add.image(0, 0, AssetKeys.Bg).setOrigin(0, 0).setDisplaySize(gameWidth, gameHeight)
    // 开始游戏按钮
    this.add
      .sprite(gameWidth / 2, gameHeight / 2, AssetKeys.StartBtn)
      .setDisplaySize(239, 72)
      .setInteractive({
        cursor: 'pointer'
      })
      .on('pointerdown', () => {
        if (!this.scene.isActive(SceneKeys.Game)) {
          this.scene.sleep(SceneKeys.Main)
          // 第一次，运行游戏场景
          this.scene.start(SceneKeys.Game)
        } else {
          // 之后切换场景显示，重新开始游戏
          this.scene.sleep(SceneKeys.Main)
          this.scene.setVisible(true, SceneKeys.Game)
          this.game.events.emit(GameEventKeys.Running)
        }
      })
  }
}
