import Phaser from 'phaser'
import AssetKeys from '@/consts/AssetKeys'
import SceneKeys from '@/consts/SceneKeys'
import { gameConfig } from '@/gameConfig'
import GameEventKeys from '@/consts/GameEventKeys'

const { gameWidth, gameHeight } = gameConfig

export default class Preloader extends Phaser.Scene {
  text: Phaser.GameObjects.Text | null
  addBtn: Phaser.GameObjects.Image | null
  backBtn: Phaser.GameObjects.Image | null

  constructor() {
    super(SceneKeys.GameOver)
    this.text = null
    this.addBtn = null
    this.backBtn = null
  }

  create(data: GameOverData) {
    // 背景
    this.text = this.add.text(
      0,
      gameHeight / 2 - 100,
      `${data.win ? '恭喜！' : '游戏结束，'}得分: ${data.score}`,
      {
        fontSize: '32px',
        strokeThickness: 4,
        stroke: '#000',
        color: '#fff',
        align: 'center',
        padding: { top: 10 },
        fixedWidth: gameWidth,
        fixedHeight: 100
      }
    )
    // 重新游戏按钮
    this.addBtn = this.add
      .image(gameWidth / 2, gameHeight / 2, AssetKeys.RestartBtn)
      .setDisplaySize(239, 72)
      .setDepth(1)
      .setInteractive({
        cursor: 'pointer'
      })
      .on('pointerdown', () => {
        this.clearAll()
        this.scene.stop(SceneKeys.GameOver)
        this.game.events.emit(GameEventKeys.Running)
      })
    // 返回首页按钮
    this.backBtn = this.add
      .image(gameWidth / 2, gameHeight / 2 + 100, AssetKeys.BackBtn)
      .setDisplaySize(239, 72)
      .setDepth(1)
      .setInteractive({
        cursor: 'pointer'
      })
      .on('pointerdown', () => {
        this.clearAll()
        this.scene.run(SceneKeys.Main)
        this.scene.setVisible(false, SceneKeys.Game)
        this.scene.stop(SceneKeys.GameOver)
      })
  }

  clearAll() {
    this.addBtn?.destroy(true)
    this.backBtn?.destroy(true)
    this.text?.destroy(true)
  }
}
