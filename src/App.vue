<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import Preloader from './scene/preload'
import Loader from './scene/loader'
import Main from './scene/main'
import Game from './scene/game'
import GameOver from './scene/gameOver'
import { gameConfig } from './gameConfig'

const { gameWidth, gameHeight } = gameConfig

let game: Phaser.Game

onMounted(() => {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: gameWidth,
    height: gameHeight,
    parent: 'app',
    backgroundColor: '#fff',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: true
      }
    },
    // 这里的Loader其实可以不要，因为这个游戏加载时间挺快的，但是既然做了，还是放这里吧
    scene: [Preloader, Loader, Main, Game, GameOver]
  }

  game = new Phaser.Game(config)
})

onBeforeUnmount(() => {
  game.destroy(true, true)
})
</script>
