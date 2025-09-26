// カテゴリ一覧
const categories = [
    "New","ミライト復刻", "季節", "ネタ", "笑", "定番", "専用", "えらい", "挨拶", "ステージ", "LOVE"
];

// 仮のギフトデータ（カテゴリ追加）
const gifts = [
    
    // Newカテゴリ
    { name: '4th Anniversary!!+', icon: '', category: 'New' },
    { name: '5th Anniversary!!+', icon: '', category: 'New' },
    { name: 'グー', icon: '', category: 'New' },
    { name: 'チョキ', icon: '', category: 'New' },
    { name: 'パー', icon: '', category: 'New' },
    { name: 'オール', icon: '', category: 'New' },
    { name: '3rd Anniversary!!+', icon: '', category: 'New' },
    { name: 'セレブレーション', icon: '', category: 'New' },

    // ミライト復刻カテゴリ
    { name: '3rd Anniversary!!+', icon: '', category: 'ミライト復刻' },
    { name: 'セレブレーション', icon: '', category: 'ミライト復刻' },
    { name: '4th Anniversary!!+', icon: '', category: 'ミライト復刻' },
    { name: '5th Anniversary!!+', icon: '', category: 'ミライト復刻' },

    // 季節カテゴリ
    { name: '秋色さぼぼん', icon: '', category: '季節' },
    { name: '秋色しらす', icon: '', category: '季節' },
    { name: '秋色つむまる', icon: '', category: '季節' },
    { name: '秋色ねこころ', icon: '', category: '季節' },
    { name: '秋色ぶくちゃ', icon: '', category: '季節' },
    { name: '秋色ホシーカ', icon: '', category: '季節' },
    { name: '秋色ユラミィ', icon: '', category: '季節' },
    { name: 'Autumn Harmony', icon: '', category: '季節' },

    // ネタカテゴリ
    { name: 'もういっかい！', icon: '', category: 'ネタ' },
    { name: 'ダウト', icon: '', category: 'ネタ' },
    { name: 'ざわ…ざわ…', icon: '', category: 'ネタ' },
    { name: 'ファイヤー', icon: '', category: 'ネタ' },
    { name: '非常口', icon: '', category: 'ネタ' },
    { name: 'いつもので', icon: '', category: 'ネタ' },
    { name: 'かー', icon: '', category: 'ネタ' },
    { name: 'つー', icon: '', category: 'ネタ' },
    { name: '一体感', icon: '', category: 'ネタ' },
    { name: '乗りなッ！', icon: '', category: 'ネタ' },
    { name: '降りろ…', icon: '', category: 'ネタ' },
    { name: '一体感', icon: '', category: 'ネタ' },
    { name: 'しーっ', icon: '', category: 'ネタ' },
    { name: 'はて…？', icon: '', category: 'ネタ' },
    { name: 'やれやれ', icon: '', category: 'ネタ' },
    { name: 'ばぁ。', icon: '', category: 'ネタ' },
    { name: '完全燃焼', icon: '', category: 'ネタ' },
    { name: '激熱', icon: '', category: 'ネタ' },
    { name: 'まぶしい', icon: '', category: 'ネタ' },
    { name: '世界一', icon: '', category: 'ネタ' },
    { name: '祭うちわ', icon: '', category: 'ネタ' },
    { name: 'ええやん', icon: '', category: 'ネタ' },
    { name: '最強', icon: '', category: 'ネタ' },
    { name: 'スリスリ', icon: '', category: 'ネタ' },
    { name: '中二病', icon: '', category: 'ネタ' },
    { name: '拳', icon: '', category: 'ネタ' },
    { name: 'ふぅー！！', icon: '', category: 'ネタ' },
    { name: 'メシウマ', icon: '', category: 'ネタ' },
    { name: 'アニキー！', icon: '', category: 'ネタ' },
    { name: '仰せのままに', icon: '', category: 'ネタ' },
    { name: '漢', icon: '', category: 'ネタ' },
    { name: '鉄アレイ', icon: '', category: 'ネタ' },
    { name: 'しおしお…', icon: '', category: 'ネタ' },
    { name: 'ヒャッホー！', icon: '', category: 'ネタ' },
    { name: 'あざとい', icon: '', category: 'ネタ' },
    { name: 'おもしれーやつ', icon: '', category: 'ネタ' },
    { name: '沼', icon: '', category: 'ネタ' },
    { name: '鳥肌注意', icon: '', category: 'ネタ' },
    { name: 'スヤァ…', icon: '', category: 'ネタ' },
    { name: 'やりおる', icon: '', category: 'ネタ' },
    { name: 'あとは頼んだ', icon: '', category: 'ネタ' },
    { name: 'おねぎします。', icon: '', category: 'ネタ' },
    { name: 'まかセロリ', icon: '', category: 'ネタ' },
    { name: 'ドヤッ', icon: '', category: 'ネタ' },
    { name: 'ぱぁ', icon: '', category: 'ネタ' },
    { name: 'チャージ！', icon: '', category: 'ネタ' },
    { name: 'ひんやり', icon: '', category: 'ネタ' },
    { name: 'アヂッ', icon: '', category: 'ネタ' },
    { name: 'つむっ！！', icon: '', category: 'ネタ' },
    { name: 'おばけしらす', icon: '', category: 'ネタ' },
    { name: 'オール', icon: '', category: 'ネタ' },
    { name: 'しらすまん', icon: '', category: 'ネタ' },
    { name: 'ダウト(200pt)', icon: '', category: 'ネタ' },
    { name: '爆弾', icon: '', category: 'ネタ' },
    { name: 'カチコチ', icon: '', category: 'ネタ' },
    { name: '蝋燭', icon: '', category: 'ネタ' },
    { name: 'どーなつちゃうの？', icon: '', category: 'ネタ' },  
    { name: '嫁に来ないか', icon: '', category: 'ネタ' },
    { name: 'そういうとこだぞ', icon: '', category: 'ネタ' },
    { name: 'ん・・・？', icon: '', category: 'ネタ' },
    { name: 'パシャパシャ', icon: '', category: 'ネタ' },
    { name: '集中線', icon: '', category: 'ネタ' }, 
    { name: '警察だ！', icon: '', category: 'ネタ' },
    { name: 'パイ投げ', icon: '', category: 'ネタ' },
    { name: 'タライ落とし', icon: '', category: 'ネタ' },
    { name: 'しらすレインボー', icon: '', category: 'ネタ' },
    { name: 'ギガフルーム', icon: '', category: 'ネタ' },
    { name: 'まだ大丈夫。。', icon: '', category: 'ネタ' },
    { name: '気配感知', icon: '', category: 'ネタ' },
    { name: 'REC', icon: '', category: 'ネタ' },
    { name: 'お宝発見', icon: '', category: 'ネタ' },
    { name: 'あちらのお客様からです', icon: '', category: 'ネタ' },

    // 笑カテゴリ
    { name: 'www', icon: '', category: '笑' } ,
    { name: '草', icon: '', category: '笑' },
    { name: 'ドッ', icon: '', category: '笑' },
    { name: 'かぷかぷ', icon: '', category: '笑' },
    { name: 'こらえ笑い', icon: '', category: '笑' } ,
    { name: 'ブフォッ', icon: '', category: '笑' },
    { name: '微笑', icon: '', category: '笑' },
    { name: '真顔', icon: '', category: '笑' },
    { name: '草(植物)', icon: '', category: '笑' } ,
    { name: 'おもしれー', icon: '', category: '笑' },
    { name: 'ガハハ', icon: '', category: '笑' },
    { name: 'ズコー', icon: '', category: '笑' },
    { name: '座布団', icon: '', category: '笑' } ,
    { name: 'ビタミン不足', icon: '', category: '笑' },
    { name: 'ウケる', icon: '', category: '笑' },
    { name: '草(大)', icon: '', category: '笑' },

    // 定番カテゴリ
    { name: 'うんうん', icon: '', category: '定番' },
    { name: 'なるほど', icon: '', category: '定番' },
    { name: 'わかる', icon: '', category: '定番' },
    { name: 'わからん', icon: '', category: '定番' },
    { name: '爆笑', icon: '', category: '定番' },
    { name: '号泣', icon: '', category: '定番' },
    { name: '考え中', icon: '', category: '定番' },
    { name: '好物', icon: '', category: '定番' },
    { name: 'ふ～ん', icon: '', category: '定番' },
    { name: '・・・', icon: '', category: '定番' },
    { name: '？', icon: '', category: '定番' },
    { name: '！？', icon: '', category: '定番' },
    { name: 'ありがとう！', icon: '', category: '定番' },
    { name: 'やだ', icon: '', category: '定番' },
    { name: 'ダウト', icon: '', category: '定番' },
    { name: 'www', icon: '', category: '定番' },
    { name: '草', icon: '', category: '定番' },
    { name: '神', icon: '', category: '定番' },
    { name: 'キャンディ', icon: '', category: '定番' },
    { name: '炎', icon: '', category: '定番' },
    { name: '握手', icon: '', category: '定番' },
    { name: 'ハイ！', icon: '', category: '定番' },
    { name: '助かる', icon: '', category: '定番' },
    { name: 'クラッカー', icon: '', category: '定番' },
    { name: '良さそう', icon: '', category: '定番' },
    { name: 'クローバー', icon: '', category: '定番' },
    { name: 'ドリンク', icon: '', category: '定番' },
    { name: 'ぴえん', icon: '', category: '定番' },
    { name: 'バラ', icon: '', category: '定番' },
    { name: 'いつもので', icon: '', category: '定番' },
    { name: '一体感', icon: '', category: '定番' },
    { name: 'ドッ', icon: '', category: '定番' },
    { name: 'ごはん', icon: '', category: '定番' },
    { name: 'サラダバー', icon: '', category: '定番' },
    { name: '草(植物)', icon: '', category: '定番' },
    { name: 'えへへ', icon: '', category: '定番' },
    { name: 'うぐぅ・・・', icon: '', category: '定番' },
    { name: 'ガクブル', icon: '', category: '定番' },
    { name: 'サァーー', icon: '', category: '定番' },
    { name: 'ナムナム', icon: '', category: '定番' },
    { name: 'ヒェッ', icon: '', category: '定番' },
    { name: 'ちょっと', icon: '', category: '定番' },
    { name: 'むっちゃ', icon: '', category: '定番' },
    { name: 'もっと', icon: '', category: '定番' },
    { name: 'エナジードリンク', icon: '', category: '定番' },
    { name: '拍手', icon: '', category: '定番' },
    { name: 'ふぅー！！', icon: '', category: '定番' },
    { name: 'おいしいやつ！', icon: '', category: '定番' },
    { name: 'おかわり！', icon: '', category: '定番' },
    { name: 'おなかいっぱい', icon: '', category: '定番' },
    { name: 'おなかすいた', icon: '', category: '定番' },
    { name: 'ごっつぁんです', icon: '', category: '定番' },
    { name: 'じゅるり', icon: '', category: '定番' },
    { name: 'オサレ', icon: '', category: '定番' },
    { name: 'いえーい！', icon: '', category: '定番' },
    { name: 'うむうむ', icon: '', category: '定番' },
    { name: 'きゅるん', icon: '', category: '定番' },
    { name: 'ごろごろ', icon: '', category: '定番' },
    { name: 'ぺこぺこ', icon: '', category: '定番' },
    { name: 'あわわわ', icon: '', category: '定番' },
    { name: 'しおしお', icon: '', category: '定番' },
    { name: 'ぽかぽか', icon: '', category: '定番' },
    { name: 'やば～い', icon: '', category: '定番' },
    { name: 'ウケる', icon: '', category: '定番' },
    { name: 'ビクッ！？', icon: '', category: '定番' },
    { name: 'ファイティン', icon: '', category: '定番' },
    { name: '？？？', icon: '', category: '定番' },
    { name: 'はぁい・・・', icon: '', category: '定番' },
    { name: 'ふんふん・・・', icon: '', category: '定番' },
    { name: 'おねが～い', icon: '', category: '定番' },
    { name: 'ぱぁぁ', icon: '', category: '定番' },
    { name: 'ぷんぷん', icon: '', category: '定番' },
    { name: 'ふぉっふぉっ', icon: '', category: '定番' },
    { name: 'メンタルブレイク', icon: '', category: '定番' },
    { name: 'いっくよー！', icon: '', category: '定番' },
    { name: 'おねぎします。', icon: '', category: '定番' },
    { name: 'まかセロリ', icon: '', category: '定番' },
    { name: 'ぱぁ', icon: '', category: '定番' },
    { name: 'ぱぁぁぁ', icon: '', category: '定番' },
    { name: 'ひそひそ', icon: '', category: '定番' },
    { name: 'ポカーン', icon: '', category: '定番' },
    { name: '閃き', icon: '', category: '定番' },
    { name: 'のど飴', icon: '', category: '定番' },
    { name: '休んで！', icon: '', category: '定番' },
    { name: '寝て！', icon: '', category: '定番' },
    { name: '食べて！', icon: '', category: '定番' },
    { name: '充電中', icon: '', category: '定番' },
    { name: '残量100%', icon: '', category: '定番' },
    { name: '残量1%', icon: '', category: '定番' },
    { name: 'グー', icon: '', category: '定番' },
    { name: 'チョキ', icon: '', category: '定番' },
    { name: 'パー', icon: '', category: '定番' },
    { name: 'シャキーン', icon: '', category: '定番' },
    { name: 'キラキラ', icon: '', category: '定番' },
    { name: 'ひんやりタイム', icon: '', category: '定番' },
    { name: '・・・どれ？', icon: '', category: '定番' },
    { name: '一本締め', icon: '', category: '定番' },
    { name: '草(大)', icon: '', category: '定番' },
    { name: 'お茶', icon: '', category: '定番' },
    { name: 'えらい', icon: '', category: '定番' },
    { name: 'クラッカー(大)', icon: '', category: '定番' },
    { name: 'バラ(大)', icon: '', category: '定番' },
    { name: '御意', icon: '', category: '定番' },
    { name: 'しらすまん', icon: '', category: '定番' },
    { name: 'ダウト(大)', icon: '', category: '定番' },
    { name: '怒り', icon: '', category: '定番' },
    { name: '頑張れ', icon: '', category: '定番' },
    { name: '乾杯', icon: '', category: '定番' },
    { name: 'エモい', icon: '', category: '定番' },
    { name: '花束', icon: '', category: '定番' },
    { name: 'ありがとう！(大)', icon: '', category: '定番' },
    { name: '助かる(大)', icon: '', category: '定番' },
    { name: 'ん・・・？', icon: '', category: '定番' },
    { name: 'うわぁぁん', icon: '', category: '定番' },
    { name: 'ウィンクチャレンジ', icon: '', category: '定番' },
    { name: 'フレーム猫耳', icon: '', category: '定番' },
    { name: 'タピオカ', icon: '', category: '定番' },
    { name: 'くす玉', icon: '', category: '定番' },
    { name: '缶詰(風船)', icon: '', category: '定番' },
    { name: 'イリアム特性パフェ', icon: '', category: '定番' },
    { name: '缶詰(花)', icon: '', category: '定番' },
    { name: '缶詰タワー', icon: '', category: '定番' },

    // 専用カテゴリ
    { name: 'わいわい投票', icon: '', category: '専用' },

    // えらいカテゴリ
    { name: 'キリおめ', icon: '', category: 'えらい' },
    { name: 'ナイギフ', icon: '', category: 'えらい' },
    { name: 'ナイス', icon: '', category: 'えらい' },
    { name: 'かわいい', icon: '', category: 'えらい' },
    { name: '神', icon: '', category: 'えらい' },
    { name: '100点', icon: '', category: 'えらい' },
    { name: '良さそう', icon: '', category: 'えらい' },
    { name: '世界一', icon: '', category: 'えらい' },
    { name: 'えぐぐ', icon: '', category: 'えらい' },
    { name: 'すごい', icon: '', category: 'えらい' },
    { name: 'すばら', icon: '', category: 'えらい' },
    { name: 'たのしみ', icon: '', category: 'えらい' },
    { name: 'ええやん', icon: '', category: 'えらい' },
    { name: '天才か！？', icon: '', category: 'えらい' },
    { name: '最強', icon: '', category: 'えらい' },
    { name: 'かしこ', icon: '', category: 'えらい' },
    { name: 'はなまる', icon: '', category: 'えらい' },
    { name: '拍手', icon: '', category: 'えらい' },
    { name: 'エモい', icon: '', category: 'えらい' },
    { name: 'チルい', icon: '', category: 'えらい' },
    { name: 'かっこいい', icon: '', category: 'えらい' },
    { name: 'イケボ', icon: '', category: 'えらい' },
    { name: 'オサレ', icon: '', category: 'えらい' },
    { name: 'クール', icon: '', category: 'えらい' },
    { name: 'アニキー！', icon: '', category: 'えらい' },
    { name: '漢', icon: '', category: 'えらい' },
    { name: 'あざとい', icon: '', category: 'えらい' },
    { name: 'おもしれーやつ', icon: '', category: 'えらい' },
    { name: 'かわぼ', icon: '', category: 'えらい' },
    { name: '癒やし～', icon: '', category: 'えらい' },
    { name: '耳が幸せ', icon: '', category: 'えらい' },
    { name: 'やりおる', icon: '', category: 'えらい' },
    { name: 'よかろう', icon: '', category: 'えらい' },
    { name: 'えらい', icon: '', category: 'えらい' },
    { name: 'Congratulations!', icon: '', category: 'えらい' },
    { name: 'クラッカー(200pt)', icon: '', category: 'えらい' },
    { name: '拍手(200pt)', icon: '', category: 'えらい' },
    { name: 'エモい(500pt)', icon: '', category: 'えらい' },
    { name: 'たいへんよくできました', icon: '', category: 'えらい' },
    { name: 'お見事', icon: '', category: 'えらい' },
    { name: 'くす玉', icon: '', category: 'えらい' },
    { name: 'ケーキ(誕生日)', icon: '', category: 'えらい' },
    { name: 'かわいい！', icon: '', category: 'えらい' },
    { name: '尊い', icon: '', category: 'えらい' },
    { name: 'なでなで', icon: '', category: 'えらい' },
    { name: 'ハッピーバースデー', icon: '', category: 'えらい' },

    // 挨拶カテゴリ
    { name: 'はろー！', icon: '', category: '挨拶' },
    { name: 'ようこそ', icon: '', category: '挨拶' },
    { name: 'おつかれさま', icon: '', category: '挨拶' },
    { name: 'おはよう', icon: '', category: '挨拶' },
    { name: 'こんばんは', icon: '', category: '挨拶' },
    { name: 'バイバイ', icon: '', category: '挨拶' },
    { name: '握手', icon: '', category: '挨拶' },
    { name: 'おかえり', icon: '', category: '挨拶' },
    { name: 'おやすみ', icon: '', category: '挨拶' },
    { name: 'いってきます', icon: '', category: '挨拶' },  
    { name: 'いってらっしゃい', icon: '', category: '挨拶' },
    { name: 'いらっしゃい', icon: '', category: '挨拶' },
    { name: 'おじゃまします', icon: '', category: '挨拶' },
    { name: 'ただいま', icon: '', category: '挨拶' },
    { name: 'やってる？', icon: '', category: '挨拶' },
    { name: 'らっしゃっせい！', icon: '', category: '挨拶' }, 
    { name: '初見さんヤッホー', icon: '', category: '挨拶' },
    { name: '遅れた！！', icon: '', category: '挨拶' },
    { name: 'すぐ戻る！', icon: '', category: '挨拶' },   
    { name: 'トイレ', icon: '', category: '挨拶' },
    { name: 'フロリダ', icon: '', category: '挨拶' },
    { name: 'しごもど', icon: '', category: '挨拶' },
    { name: 'ちょい落ち', icon: '', category: '挨拶' },
    { name: 'サラダバー', icon: '', category: '挨拶' },
    { name: 'スッ', icon: '', category: '挨拶' },
    { name: 'ヤッホー', icon: '', category: '挨拶' },
    { name: 'すやぁ・・・', icon: '', category: '挨拶' },
    { name: 'やりおる', icon: '', category: '挨拶' },
    { name: 'あとは頼んだ', icon: '', category: '挨拶' },
    { name: 'おねぎします。', icon: '', category: '挨拶' },
    { name: 'またね', icon: '', category: '挨拶' },
    { name: '参上', icon: '', category: '挨拶' },
    { name: 'こんにちは', icon: '', category: '挨拶' },
    { name: 'また来るね！', icon: '', category: '挨拶' },
    { name: 'おやすみ(大)', icon: '', category: '挨拶' },

    // ステージカテゴリ
    {name: 'クラッカー', icon: '', category: 'ステージ'},
    {name: 'サイリウム・オレンジ', icon: '', category: 'ステージ'},
    {name: 'サイリウム・ピンク', icon: '', category: 'ステージ'},
    {name: 'サイリウム・白', icon: '', category: 'ステージ'},
    {name: 'サイリウム・紫', icon: '', category: 'ステージ'},
    {name: 'サイリウム・緑', icon: '', category: 'ステージ'},
    {name: 'サイリウム・赤', icon: '', category: 'ステージ'},
    {name: 'サイリウム・青', icon: '', category: 'ステージ'},
    {name: 'サイリウム・黄', icon: '', category: 'ステージ'},
    {name: 'サイリウム・黄緑', icon: '', category: 'ステージ'},
    {name: 'サイリウム・黒', icon: '', category: 'ステージ'},
    {name: 'いつもので', icon: '', category: 'ステージ'},
    {name: 'もっと', icon: '', category: 'ステージ'},
    {name: '祭うちわ', icon: '', category: 'ステージ'},
    {name: '拍手', icon: '', category: 'ステージ'},
    {name: 'サイリウム・葱', icon: '', category: 'ステージ'},
    {name: '中二病', icon: '', category: 'ステージ'},
    {name: 'アフロしらす', icon: '', category: 'ステージ'},
    {name: 'アンコール', icon: '', category: 'ステージ'}, 
    {name: 'ヘドバン', icon: '', category: 'ステージ'},
    {name: 'ふぅー！！', icon: '', category: 'ステージ'},
    {name: 'キャーッ！', icon: '', category: 'ステージ'}, 
    {name: '音符', icon: '', category: 'ステージ'},
    {name: 'クラッカー(200pt)', icon: '', category: 'ステージ'},
    {name: 'バラ(大)', icon: '', category: 'ステージ'},
    {name: '拍手(200pt)', icon: '', category: 'ステージ'},      
    {name: 'よーい', icon: '', category: 'ステージ'},
    {name: 'サーチライト', icon: '', category: 'ステージ'},
    {name: 'もういっかい(500pt)', icon: '', category: 'ステージ'}, 
    {name: '花束', icon: '', category: 'ステージ'},
    {name: 'スポットライト', icon: '', category: 'ステージ'},
    {name: 'V.I.P', icon: '', category: 'ステージ'},
    {name: 'くす玉', icon: '', category: 'ステージ'},
    {name: 'ライト&フォグ', icon: '', category: 'ステージ'},   
    {name: 'ライブステージ', icon: '', category: 'ステージ'},
    {name: '花火', icon: '', category: 'ステージ'},

    // LOVEカテゴリ
    { name: '好物', category: 'LOVE' },
    { name: 'ハート', category: 'LOVE' },
    { name: 'かわいい', icon: '', category: 'LOVE' },
    { name: '照', category: 'LOVE' },
    { name: 'キャーッ！', category: 'LOVE' },
    { name: 'あざとい', category: 'LOVE' },
    { name: 'かわぼ', category: 'LOVE' },
    { name: '呼んだ？', category: 'LOVE' },
    { name: 'ハート(200pt)', category: 'LOVE' },
    { name: 'すこっていい？', category: 'LOVE' },
    { name: '嫁に来ないか', category: 'LOVE' }, 
    { name: 'ずっきゅーん', category: 'LOVE' },
    { name: '唐突な愛', category: 'LOVE' },
    { name: 'ウィンクタイム', category: 'LOVE' },
    { name: 'すこ', category: 'LOVE' },    
    { name: 'かわいい！(3,000pt)', category: 'LOVE' },
    { name: '尊い', category: 'LOVE' },
    { name: 'なでなで', category: 'LOVE' },
    { name: 'だいすき', category: 'LOVE' },
    { name: 'あふれる想い', category: 'LOVE' }
];

// カテゴリごとの画像リスト（カテゴリ名をキーにして画像リストを用意）
const giftImagesMap = {
       
    "New": [
        { keyword: '5th Anniversary!!+', src: 'ギフト/New/5th Anniversary!+_1,000pt.jpg', alt:'5th Anniversary!!+' },
        { keyword: '4th Anniversary!!+', src: 'ギフト/New/4th Anniversary!+_1,000pt.jpg', alt:'4th Anniversary!!+' },
        { keyword: 'グー', src: 'ギフト/New/グー_5pt.jpg', alt: 'グー' },
        { keyword: 'チョキ', src: 'ギフト/New/チョキ_5pt.jpg', alt: 'チョキ' },
        { keyword: 'パー', src: 'ギフト/New/パー_5pt.jpg', alt: 'パー' },
        { keyword: 'オール', src: 'ギフト/New/オール_99pt.jpg', alt: 'オール' },
        { keyword: '3rd Anniversary!!+', src: 'ギフト/New/3rd Anniversary!+_1,000pt.jpg', alt: '3rd Anniversary!!+' },
        { keyword: 'セレブレーション', src: 'ギフト/New/セレブレーション_1,000pt.jpg', alt: 'セレブレーション' }
    ],

    "ミライト復刻": [
        { keyword: '3rd Anniversary!!+', src: 'ギフト/New/3rd Anniversary!+_1,000pt.jpg', alt: '3rd Anniversary!!+' },
        { keyword: 'セレブレーション', src: 'ギフト/New/セレブレーション_1,000pt.jpg', alt: 'セレブレーション' },
        { keyword: '4th Anniversary!!+', src: 'ギフト/New/4th Anniversary!+_1,000pt.jpg', alt: '4th Anniversary!!+' },
        { keyword: '5th Anniversary!!+', src: 'ギフト/New/5th Anniversary!+_1,000pt.jpg', alt: '5th Anniversary!!+' } 
    ],
    
    "季節": [
        { keyword: '秋色さぼぼん', src: 'ギフト/季節/秋色さぼぼん_5pt.jpg', alt: '秋色さぼぼん' },
        { keyword: '秋色しらす', src: 'ギフト/季節/秋色しらす_5pt.jpg', alt: '秋色しらす' },
        { keyword: '秋色つむまる', src: 'ギフト/季節/秋色つむまる_5pt.jpg', alt: '秋色つむまる' },
        { keyword: '秋色ねこころ', src: 'ギフト/季節/秋色ねこころ_5pt.jpg', alt: '秋色ねこころ' },
        { keyword: '秋色ぶくちゃ', src: 'ギフト/季節/秋色ぶくちゃ_5pt.jpg', alt: '秋色ぶくちゃ' },
        { keyword: '秋色ホシーカ', src: 'ギフト/季節/秋色ホシーカ_5pt.jpg', alt: '秋色ホシーカ' },
        { keyword: '秋色ユラミィ', src: 'ギフト/季節/秋色ユラミィ_5pt.jpg', alt: '秋色ユラミィ' },
        { keyword: 'Autumn Harmony', src: 'ギフト/季節/Autumn Harmony_100pt.jpg', alt: 'Autumn Harmony' }
    ],

    "ネタ": [

    ],
    
    "笑": [
        { keyword: 'www', src: 'ギフト/笑/www_5pt.PNG', alt: 'www' } ,
        { keyword: '草', src: 'ギフト/笑/草_5pt.PNG', alt: '草' },
        { keyword: 'ドッ', src: 'ギフト/笑/ドッ_5pt.PNG', alt: 'ドッ' },
        { keyword: 'かぷかぷ', src: 'ギフト/笑/かぷかぷ_5pt.PNG', alt: 'かぷかぷ' },
        { keyword: 'こらえ笑い', src: 'ギフト/笑/こらえ笑い_5pt.PNG', alt: 'こらえ笑い' } ,
        { keyword: 'ブフォッ', src: 'ギフト/笑/ブフォッ_5pt.PNG', alt: 'ブフォッ' },
        { keyword: '微笑', src: 'ギフト/笑/微笑_5pt.PNG', alt: '微笑' },
        { keyword: '真顔', src: 'ギフト/笑/真顔_5pt.PNG', alt: '真顔' },
        { keyword: '草(植物)', src: 'ギフト/笑/草(植物)_5pt.PNG', alt: '草(植物)' } ,
        { keyword: 'おもしれー', src: 'ギフト/笑/おもしれー_5pt.PNG', alt: 'おもしれー' },
        { keyword: 'ガハハ', src: 'ギフト/笑/ガハハ_5pt.PNG', alt: 'ガハハ' },
        { keyword: 'ズコー', src: 'ギフト/笑/ズコー_5pt.PNG', alt: 'ズコー' },
        { keyword: '座布団', src: 'ギフト/笑/座布団_5pt.PNG', alt: '座布団' } ,
        { keyword: 'ビタミン不足', src: 'ギフト/笑/ビタミン不足_5pt.PNG', alt: 'ビタミン不足' },
        { keyword: 'ウケる', src: 'ギフト/笑/ウケる_5pt.PNG', alt: 'ウケる' },
        { keyword: '草(大)', src: 'ギフト/笑/草(大)_100pt.PNG', alt: '草(大)' },
    ],
    
    "定番": [

    ],
    "専用": [
        { keyword: 'わいわい投票', src: 'ギフト/専用/わいわい投票_500pt.jpg', alt: 'わいわい投票' }
    ],
    "えらい": [

    ],
    "挨拶": [

    ],
    "ステージ": [

    ],

    "LOVE": [
        { keyword: '好物', src: 'ギフト/Love/01_好物.PNG', alt: '好物' },
        { keyword: 'ハート', src: 'ギフト/Love/02_ハート.PNG', alt: 'ハート' },
        { keyword: 'かわいい', src: 'ギフト/Love/03_かわいい.PNG', alt: 'かわいい' },
        { keyword: '照', src: 'ギフト/Love/04_照れ.PNG', alt: '照' },
        { keyword: 'キャーッ！', src: 'ギフト/Love/05_キャーッ.jpg', alt: 'キャーッ！' },
        { keyword: 'あざとい', src: 'ギフト/Love/06_あざとい.jpg', alt: 'あざとい' },
        { keyword: 'かわぼ', src: 'ギフト/Love/07_かわぼ.jpg', alt: 'かわぼ' },
        { keyword: '呼んだ？', src: 'ギフト/Love/08_呼んだ？.jpg', alt: '呼んだ？' },
        { keyword: 'ハート(200pt)', src: 'ギフト/Love/09_ハート(大)_200pt.PNG', alt: 'ハート(200pt)' },
        { keyword: 'すこっていい？', src: 'ギフト/Love/10_すっこていい？_500pt.PNG', alt: 'すこっていい？' },
        { keyword: '嫁に来ないか', src: 'ギフト/Love/11_嫁に来ないか・・・？_500pt.PNG', alt: '嫁に来ないか' },
        { keyword: 'ずっきゅーん', src: 'ギフト/Love/12_ズキューン_500pt.PNG', alt: 'ずっきゅーん' },
        { keyword: '唐突な愛', src: 'ギフト/Love/13_唐突な愛.jpg', alt: '唐突な愛' },
        { keyword: 'ウィンクタイム', src: 'ギフト/Love/14_ウィンクタイム.jpg', alt: 'ウィンクタイム' },
        { keyword: 'すこ', src: 'ギフト/Love/15_すこ_1,000pt.PNG', alt: 'すこ' }, 
        { keyword:'かわいい！(3,000pt)', src: 'ギフト/Love/16_かわいい_3,000pt.PNG', alt: 'かわいい！(3,000pt)' },
        { keyword: '尊い', src: 'ギフト/Love/17_尊い_5,000pt.PNG', alt: '尊い' },
        { keyword: 'なでなで', src: 'ギフト/Love/18_なでなで_7,000pt.PNG', alt: 'なでなで' },
        { keyword: 'だいすき', src: 'ギフト/Love/19_だいすき_10,000pt.PNG', alt: 'だいすき' },
        { keyword: 'あふれる想い', src: 'ギフト/Love/20_あふれる想い_30,000pt.PNG', alt: 'あふれる想い' }
    ]
};

// DOMContentLoadedでタブ生成・初期表示を行うよう修正
document.addEventListener('DOMContentLoaded', () => {
    // タブ生成
    const tabContainer = document.getElementById('tabContainer');
    categories.forEach((cat, idx) => {
        const btn = document.createElement('button');
        btn.className = 'tab-btn' + (idx === 0 ? ' active' : '');
        btn.textContent = cat;
        btn.onclick = () => selectTab(cat, btn);
        tabContainer.appendChild(btn);
    });

    // 初期表示
    showGifts(categories[0]);
});

// タブ選択時の処理
function selectTab(category, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    showGifts(category);
}

// ギフト表示
function showGifts(category) {
    const giftList = document.getElementById('giftList');
    giftList.innerHTML = '';
    const filtered = gifts.filter(g => g.category === category);
    if (filtered.length === 0) {
        giftList.innerHTML = '<div style="text-align:center; color:#aaa;">このカテゴリのギフトはありません。</div>';
        return;
    }
    // カテゴリごとの画像リストを取得
    const images = giftImagesMap[category] || [];
    filtered.forEach(gift => {
        let iconHtml = gift.icon;
        // 画像リストから完全一致で画像を探す
        const found = images.find(img => gift.name === img.keyword);
        if (found) {
            iconHtml = `<img src="${found.src}" alt="${found.alt}" class="gift-img" style="width:40px;height:40px;">`;
        }
        const item = document.createElement('div');
        item.className = 'gift-item';
        item.innerHTML = `
            <div class="gift-icon">${iconHtml}</div>
            <div class="gift-name">${gift.name}</div>
        `;
        giftList.appendChild(item);
    });
}

// 初期表示
showGifts(categories[0]);





