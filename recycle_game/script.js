// =======================
// 定義データ
// =======================
const CATEGORIES = [
  "普通ごみ",
  "資源ごみ",
  "プラスチック資源",
  "古紙衣類",
  "バッテリー類"
];

const ITEMS = {
  "普通ごみ": ["魚の骨", "靴", "皿", "グローブ", "メガネ"],
  "資源ごみ": ["缶", "ビン", "ペットボトル", "やかん"],
  "プラスチック資源": ["カップ麺の容器", "パック", "タッパー", "ペットボトルのキャップ"],
  "古紙衣類": ["新聞紙", "段ボール", "紙パック", "衣類"],
  "バッテリー類": ["バッテリー"]
};
// 難易度設定（スピード倍率と区分数の上限）
const DIFFICULTY_SETTINGS = {
  easy: { label: "初級", speedMultiplier: 1.0, categories: 3 },
  normal: { label: "中級", speedMultiplier: 1.5, categories: 4 },
  hard: { label: "上級", speedMultiplier: 2.0, categories: 5 }
};

// 現在の難易度をグローバルに保持
let currentDifficulty = "easy";

let score = 0;

// =======================
// スタート画面
// =======================
class StartScene extends Phaser.Scene {
  constructor() {
    super('StartScene');
  }
  preload() {
    // 各カテゴリごとに使用する画像を読み込み
    this.load.image('fishbone', 'assets/trash/fishbone.png');
    this.load.image('shoe', 'assets/trash/shoe.png');
    this.load.image('plate', 'assets/trash/plate.png');
    this.load.image('glove', 'assets/trash/glove.png');
    this.load.image('glasses', 'assets/trash/glasses.png');
    this.load.image('can', 'assets/trash/can.png');
    this.load.image('bottle', 'assets/trash/bottle.png');
    this.load.image('petbottle', 'assets/trash/petbottle.png');
    this.load.image('kettle', 'assets/trash/kettle.png');
    this.load.image('cupramen', 'assets/trash/cupramen.png');
    this.load.image('pack', 'assets/trash/pack.png');
    this.load.image('tupper', 'assets/trash/tupper.png');
    this.load.image('cap', 'assets/trash/cap.png');
    this.load.image('newspaper', 'assets/trash/newspaper.png');
    this.load.image('cardboard', 'assets/trash/cardboard.png');
    this.load.image('kamipack', 'assets/trash/kamipack.png');
    this.load.image('cloth', 'assets/trash/cloth.png');
    this.load.image('battery', 'assets/trash/battery.png');
  }
  create() {
    this.add.text(250, 120, "分別チャレンジ！", { fontSize: "42px", color: "#333" ,padding: { top: 10, bottom: 0 }});

    // 難易度タイトル
    this.add.text(300, 220, "難易度を選択:", { fontSize: "22px", color: "#000" ,padding: { top: 10, bottom: 0 }});

    // 難易度ボタン生成
    let x = 260;
    for (const [key, value] of Object.entries(DIFFICULTY_SETTINGS)) {
      const btn = this.add.text(x, 320, value.label, {
        fontSize: "24px",
        color: "#00796b",
        backgroundColor: "#c8e6c9",
        padding: { x: 10, y: 5 }
      })
        .setInteractive()
        .on("pointerdown", () => {
          currentDifficulty = key;
          startGameBtn.setText("▶ ゲーム開始（" + value.label + "）");
        });
      x += 70;
    }

    // ゲーム開始ボタン
    const startGameBtn = this.add.text(260, 450, "▶ ゲーム開始（初級）", {
      fontSize: "26px",
      color: "#004d40",
      backgroundColor: "#a5d6a7",
      padding: { x: 12, y: 6 }
    }).setInteractive();

    startGameBtn.on("pointerdown", () => {
      score = 0;
      this.scene.start("GameScene", { difficulty: currentDifficulty });
    });
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  init(data) {
    // StartScene から渡されたデータを受け取る
    this.difficultyKey = data.difficulty || "easy";
    this.settings = DIFFICULTY_SETTINGS[this.difficultyKey];
  }

  create() {
    // UI
    this.timeLimit = 60;
    this.timerText = this.add.text(20, 20, "時間: 60", { fontSize: "24px", color: "#000" });
    this.scoreText = this.add.text(650, 20, "スコア: 0", { fontSize: "24px", color: "#000" });

    // 分別エリア数を難易度に応じて制限
    const categoryCount = this.settings.categories;
    const selectedCategories = CATEGORIES.slice(0, categoryCount);

    this.trashGroup = this.add.group();
    this.dropZones = [];

    for (let i = 0; i < selectedCategories.length; i++) {
      const zone = this.add.rectangle(80 + i * 150, 550, 140, 70, 0xc8e6c9);
      this.add.text(30 + i * 150, 530, selectedCategories[i], { fontSize: "14px", color: "#000" });
      zone.setData("category", selectedCategories[i]);
      zone.setInteractive({ dropZone: true });
      this.dropZones.push(zone);
    }

    // ドラッグ設定（同じ）
    this.input.on("dragstart", (p, obj) => (obj.isDragging = true));
    this.input.on("drag", (p, obj, x, y) => {
      obj.x = x;
      obj.y = y;
    });
    this.input.on("dragend", (p, obj) => (obj.isDragging = false));

    // ドロップ処理
    this.input.on("drop", (pointer, obj, zone) => {
      if (!zone) return;
      const correct = obj.category === zone.getData("category");
      if (correct) {
        score += 5;
        this.scoreText.setText("スコア: " + score);
        this.tweens.add({
          targets: obj,
          alpha: 0,
          scale: 0.5,
          duration: 200,
          onComplete: () => obj.destroy()
        });
      } else {
        this.tweens.add({
          targets: obj,
          x: 50,
          y: Phaser.Math.Between(100, 400),
          duration: 300,
          ease: "Sine.easeInOut"
        });
      }
    });

    // ごみ生成（スピード倍率で変化）
    this.spawnTimer = this.time.addEvent({
      delay: 1500 / this.settings.speedMultiplier,
      callback: this.spawnTrash,
      callbackScope: this,
      loop: true
    });

    // 制限時間
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeLimit--;
        this.timerText.setText("時間: " + this.timeLimit);
        if (this.timeLimit <= 0) this.scene.start("ResultScene");
      },
      loop: true
    });

    this.selectedCategories = selectedCategories;
  }

  spawnTrash() {
    const category = Phaser.Utils.Array.GetRandom(this.selectedCategories);
    const items = {
      "普通ごみ": ["fishbone", "shoe", "plate", "glove", "glasses"],
      "資源ごみ": ["can", "bottle", "petbottle", "kettle"],
      "プラスチック資源": ["cupramen", "pack", "tupper", "cap"],
      "古紙衣類": ["newspaper", "cardboard", "kamipack", "cloth"],
      "バッテリー類": ["battery"]
    };
    const key = Phaser.Utils.Array.GetRandom(items[category]);

    const y = Phaser.Math.Between(100, 400);
    const trash = this.add.image(50, y, key).setScale(0.4);
    trash.displayWidth = 120;
    trash.scaleY = trash.scaleX;
    trash.category = category;
    trash.setInteractive({ pixelPerfect: true, draggable: true });
    this.input.setDraggable(trash);
    trash.speed = (50 + Math.random() * 30) * this.settings.speedMultiplier;
    this.trashGroup.add(trash);
  }

  update(time, delta) {
    const dt = delta / 1000;
    this.trashGroup.getChildren().forEach(trash => {
      if (!trash.isDragging) trash.x += trash.speed * dt;
      if (trash.x > 800) trash.destroy();
    });
  }
}


// =======================
// リザルト画面
// =======================
class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene');
  }
  create() {
    this.add.text(300, 200, '結果発表！', { fontSize: '36px', color: '#333' ,padding: { top: 10, bottom: 0 }});
    this.add.text(320, 270, `最終スコア：${score}`, { fontSize: '28px', color: '#00796b' ,padding: { top: 10, bottom: 0 }});

    const backBtn = this.add.text(270, 350, '▶ タイトルに戻る', {
      fontSize: '24px',
      color: '#00796b',
      backgroundColor: '#c8e6c9',
      padding: { x: 8, y: 4 }
    }).setInteractive();

    backBtn.on('pointerdown', () => this.scene.start('StartScene'));
  }
}

// =======================
// Phaser初期化（順序重要！）
// =======================
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game',
  backgroundColor: '#e0f7fa',
  scene: [StartScene, GameScene, ResultScene]
};

new Phaser.Game(config);
