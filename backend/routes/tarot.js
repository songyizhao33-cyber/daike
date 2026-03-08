const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Tarot = require('../models/Tarot');
const ActivityLog = require('../models/ActivityLog');

// 获取所有塔罗牌（用于初始化数据）
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const tarots = await Tarot.find().sort({ order: 1 });
    res.json(tarots);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 抽取一张塔罗牌
router.post('/draw', authMiddleware, async (req, res) => {
  try {
    // 获取所有塔罗牌
    const tarots = await Tarot.find();

    if (tarots.length === 0) {
      return res.status(404).json({ message: '塔罗牌数据未初始化' });
    }

    // 随机选择一张牌
    const randomIndex = Math.floor(Math.random() * tarots.length);
    const selectedTarot = tarots[randomIndex];

    // 随机决定正位或逆位
    const isReversed = Math.random() < 0.5;

    // 获取对应的解释
    const meaning = isReversed ? selectedTarot.reversedMeaning : selectedTarot.uprightMeaning;

    // 检查是否是星辰正位
    let specialMessage = null;
    if (selectedTarot.name === '星辰' && !isReversed) {
      specialMessage = '恭喜你抽出了笑书最想抽到的一张，祝你拥有美好的一天！';
    }

    // 记录活动日志
    await ActivityLog.create({
      userId: req.userId,
      actionType: 'draw_tarot',
      description: `抽取塔罗牌：${selectedTarot.name}（${isReversed ? '逆位' : '正位'}）`,
      metadata: {
        tarotName: selectedTarot.name,
        isReversed
      }
    });

    res.json({
      tarot: {
        name: selectedTarot.name,
        imageFile: selectedTarot.imageFile,
        isReversed,
        meaning,
        specialMessage
      }
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 初始化塔罗牌数据（仅用于首次设置）
router.post('/initialize', authMiddleware, async (req, res) => {
  try {
    // 检查是否已经初始化
    const count = await Tarot.countDocuments();
    if (count > 0) {
      return res.status(400).json({ message: '塔罗牌数据已存在' });
    }

    const tarotData = [
      { name: '愚者', imageFile: '愚者.png', order: 0, uprightMeaning: '新的开始，冒险精神，自由自在，充满可能性。保持开放的心态，勇敢踏出第一步。', reversedMeaning: '鲁莽行事，缺乏计划，逃避责任。需要更加谨慎，三思而后行。' },
      { name: '魔术师', imageFile: '魔术师.png', order: 1, uprightMeaning: '创造力，技能，自信，行动力。你拥有实现目标所需的一切资源和能力。', reversedMeaning: '缺乏自信，技能不足，操纵他人。需要提升自己的能力，诚实面对自己。' },
      { name: '女祭司', imageFile: '女祭司.png', order: 2, uprightMeaning: '直觉，智慧，神秘，内在知识。倾听内心的声音，相信你的直觉。', reversedMeaning: '忽视直觉，秘密被揭露，缺乏洞察力。需要更加关注内心的感受。' },
      { name: '皇后', imageFile: '皇后.png', order: 3, uprightMeaning: '丰饶，母性，创造力，自然之美。享受生活的美好，关爱他人。', reversedMeaning: '过度依赖，创造力受阻，忽视自我。需要平衡付出与接受。' },
      { name: '皇帝', imageFile: '皇帝.png', order: 4, uprightMeaning: '权威，结构，控制，稳定。建立秩序，承担责任，展现领导力。', reversedMeaning: '专制，僵化，缺乏灵活性。需要放松控制，倾听他人意见。' },
      { name: '教皇', imageFile: '教皇.png', order: 5, uprightMeaning: '传统，精神指导，教育，信仰。寻求智慧的指引，遵循传统价值。', reversedMeaning: '打破传统，质疑权威，独立思考。需要找到自己的道路。' },
      { name: '恋人', imageFile: '恋人.png', order: 6, uprightMeaning: '爱情，和谐，选择，伙伴关系。重要的决定，真诚的关系。', reversedMeaning: '关系失衡，错误的选择，价值观冲突。需要重新审视你的选择。' },
      { name: '战车', imageFile: '战车.png', order: 7, uprightMeaning: '胜利，决心，意志力，前进。克服障碍，保持专注，勇往直前。', reversedMeaning: '失去方向，缺乏控制，侵略性。需要重新找到平衡和方向。' },
      { name: '力量', imageFile: '力量.png', order: 8, uprightMeaning: '勇气，耐心，温柔的力量，自我控制。以爱和理解战胜困难。', reversedMeaning: '自我怀疑，缺乏信心，失去控制。需要找回内在的力量。' },
      { name: '隐者', imageFile: '隐者.png', order: 9, uprightMeaning: '内省，独处，寻求真理，智慧。花时间独处，寻找内在的答案。', reversedMeaning: '孤立，逃避，拒绝帮助。需要与他人建立联系。' },
      { name: '命运之轮', imageFile: '命运之轮.png', order: 10, uprightMeaning: '变化，命运，机遇，循环。接受变化，把握机会，顺应自然规律。', reversedMeaning: '厄运，抗拒变化，失控。需要接受生活的起伏。' },
      { name: '正义', imageFile: '正义.png', order: 11, uprightMeaning: '公平，真相，法律，因果。做出公正的决定，承担责任。', reversedMeaning: '不公，偏见，逃避责任。需要面对真相，寻求平衡。' },
      { name: '倒吊人', imageFile: '倒吊人.png', order: 12, uprightMeaning: '牺牲，放手，新视角，暂停。换个角度看问题，学会等待。', reversedMeaning: '无谓的牺牲，拖延，抗拒改变。需要采取行动。' },
      { name: '死神', imageFile: '死神.png', order: 13, uprightMeaning: '结束，转变，新生，释放。旧的结束意味着新的开始，拥抱变化。', reversedMeaning: '抗拒改变，停滞不前，恐惧。需要放下过去，向前看。' },
      { name: '节制', imageFile: '节制.png', order: 14, uprightMeaning: '平衡，耐心，和谐，节制。寻找中庸之道，保持平衡。', reversedMeaning: '失衡，过度，缺乏耐心。需要恢复平衡和节制。' },
      { name: '恶魔', imageFile: '恶魔.png', order: 15, uprightMeaning: '束缚，诱惑，物质主义，依赖。意识到自己的束缚，寻求解脱。', reversedMeaning: '释放，觉醒，打破束缚。正在摆脱不健康的依赖。' },
      { name: '白塔', imageFile: '白塔.png', order: 16, uprightMeaning: '突然的改变，破坏，启示，解放。旧结构的崩塌带来新的可能。', reversedMeaning: '逃避灾难，恐惧改变，延迟的危机。需要面对现实。' },
      { name: '星辰', imageFile: '星辰.png', order: 17, uprightMeaning: '希望，灵感，宁静，信念。保持希望，相信未来，追随你的梦想。', reversedMeaning: '失去信念，绝望，缺乏灵感。需要重新找到希望。' },
      { name: '月亮', imageFile: '月亮.png', order: 18, uprightMeaning: '直觉，幻觉，潜意识，不确定。相信直觉，但要警惕幻象。', reversedMeaning: '恐惧消散，真相显现，克服焦虑。正在走出迷雾。' },
      { name: '太阳', imageFile: '太阳.png', order: 19, uprightMeaning: '成功，喜悦，活力，积极。充满正能量，享受成功的喜悦。', reversedMeaning: '暂时的挫折，过度乐观，延迟的成功。需要保持耐心。' },
      { name: '审判', imageFile: '审判.png', order: 20, uprightMeaning: '觉醒，重生，宽恕，评判。反思过去，做出重要决定，迎接新生。', reversedMeaning: '自我怀疑，逃避责任，无法原谅。需要面对过去。' },
      { name: '世界', imageFile: '世界.png', order: 21, uprightMeaning: '完成，成就，圆满，整合。达成目标，享受成功，准备新的旅程。', reversedMeaning: '未完成，缺乏闭环，延迟。需要完成当前的任务。' }
    ];

    await Tarot.insertMany(tarotData);

    res.json({ message: '塔罗牌数据初始化成功', count: tarotData.length });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

module.exports = router;

