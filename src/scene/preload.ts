import Phaser from 'phaser'
import AssetKeys from '@/consts/AssetKeys'
import SceneKeys from '@/consts/SceneKeys'

const ORIGIN = location.origin

export default class Preloader extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Preloader)
  }

  preload() {
    // 加载图片
    this.load.image(AssetKeys.Bg, ORIGIN + '/assets/' + AssetKeys.Bg + '.png')

    this.load.on('complete', () => {
      this.scene.start(SceneKeys.Loader)
    })
  }
}
