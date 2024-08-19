export default class Score extends Phaser.GameObjects.Text {
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, '0分', {
      fontSize: '32px',
      color: '#fff'
    })
    scene.add.existing(this)

    this.setDepth(2)
  }

  updateScore(score: number) {
    this.setText(`${score}分`)
  }
}
