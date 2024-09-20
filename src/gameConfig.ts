// 游戏配置
export const gameConfig = {
  // 游戏界面尺寸
  gameWidth: innerWidth > 400 ? innerWidth : 400,
  gameHeight: innerHeight > 600 ? innerHeight : 600,
  // 一层可铺设图案
  rows: 8, // 行
  cols: 6, // 列
  // 层级，>=2
  level: 15,
  // 相邻两层图案数差一个随机数，这里是随机数的范围
  randomRange: [0, 0],
  mergeScore: 3 // 合并一次得分
}

// 图案配置
export const blockConfig = {
  // 图案尺寸
  blockWidth: 40,
  blockHeight: 40,
  // 位置
  blockTop: 20,
  // 图案种类
  blockTypes: 8,
  // 每种图案有多少组
  blockGroups: 3
}

// 卡槽配置
export const troughConfig = {
  troughCounts: 7,
  padding: 5
}
