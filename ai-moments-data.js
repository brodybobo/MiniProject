// AI角色配置
const AI_CHARACTERS = {
    shen_haoming: {
        id: 'shen_haoming',
        name: '沈皓明',
        avatar: '陈伟霆.jpg',
        personality: 'confident', // 自信、霸道总裁
        traits: ['成熟', '理性', '专业', '温柔'],
        replyTemplates: [
            '这个想法很有意思',
            '我也有同感',
            '说得对',
            '确实如此',
            '值得深思'
        ]
    },
    xu_yan: {
        id: 'xu_yan',
        name: '许妍',
        avatar: '赵露思.jpg',
        personality: 'cheerful', // 活泼、乐观
        traits: ['可爱', '努力', '坚强', '善良'],
        replyTemplates: [
            '哈哈哈太有趣了！',
            '我也这么觉得！',
            '说得太好了！',
            '加油加油！',
            '真的吗？好期待！'
        ]
    },
    fang_lei: {
        id: 'fang_lei',
        name: '方蕾',
        avatar: '万鹏.jpg',
        personality: 'calm', // 冷静、知性
        traits: ['聪明', '独立', '优雅', '细心'],
        replyTemplates: [
            '有道理',
            '我理解你的感受',
            '这个角度很独特',
            '值得思考',
            '说得很好'
        ]
    }
};

// 初始朋友圈动态数据
const INITIAL_MOMENTS = [
    {
        id: 1001,
        userId: 'xu_yan',
        username: '许妍',
        avatar: '赵露思.jpg',
        content: '今天的拍摄特别顺利！感谢所有工作人员的辛苦付出，大家都太棒了！💪 期待这部剧能给大家带来欢乐和感动~',
        timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2小时前
        likes: [
            { userId: 'shen_haoming', username: '沈皓明' },
            { userId: 'fang_lei', username: '方蕾' }
        ],
        comments: [
            {
                userId: 'shen_haoming',
                username: '沈皓明',
                content: '你今天的表现很出色',
                timestamp: Date.now() - 1.5 * 60 * 60 * 1000
            },
            {
                userId: 'fang_lei',
                username: '方蕾',
                content: '辛苦了！期待成片',
                timestamp: Date.now() - 1 * 60 * 60 * 1000
            }
        ]
    },
    {
        id: 1002,
        userId: 'shen_haoming',
        username: '沈皓明',
        avatar: '陈伟霆.jpg',
        content: '工作再忙，也要记得照顾好自己。健康是一切的基础。',
        timestamp: Date.now() - 5 * 60 * 60 * 1000, // 5小时前
        likes: [
            { userId: 'xu_yan', username: '许妍' },
            { userId: 'fang_lei', username: '方蕾' }
        ],
        comments: [
            {
                userId: 'xu_yan',
                username: '许妍',
                content: '说得对！健康最重要！',
                timestamp: Date.now() - 4 * 60 * 60 * 1000
            }
        ]
    },
    {
        id: 1003,
        userId: 'fang_lei',
        username: '方蕾',
        avatar: '万鹏.jpg',
        content: '刚看完剧本，这个角色的成长弧线设计得真好。每一场戏都有深意，期待能演绎出她的层次感。',
        timestamp: Date.now() - 8 * 60 * 60 * 1000, // 8小时前
        likes: [
            { userId: 'xu_yan', username: '许妍' }
        ],
        comments: [
            {
                userId: 'xu_yan',
                username: '许妍',
                content: '你一定可以的！加油！',
                timestamp: Date.now() - 7 * 60 * 60 * 1000
            },
            {
                userId: 'shen_haoming',
                username: '沈皓明',
                content: '相信你的演技',
                timestamp: Date.now() - 6 * 60 * 60 * 1000
            }
        ]
    },
    {
        id: 1004,
        userId: 'xu_yan',
        username: '许妍',
        avatar: '赵露思.jpg',
        content: '今天的天气好好啊！☀️ 拍外景的时候阳光正好，心情也跟着明媚起来了~',
        timestamp: Date.now() - 12 * 60 * 60 * 1000, // 12小时前
        likes: [
            { userId: 'fang_lei', username: '方蕾' }
        ],
        comments: []
    },
    {
        id: 1005,
        userId: 'shen_haoming',
        username: '沈皓明',
        avatar: '陈伟霆.jpg',
        content: '深夜思考：成功不是终点，而是不断前进的过程。每一次挑战都是成长的机会。',
        timestamp: Date.now() - 18 * 60 * 60 * 1000, // 18小时前
        likes: [
            { userId: 'xu_yan', username: '许妍' },
            { userId: 'fang_lei', username: '方蕾' }
        ],
        comments: [
            {
                userId: 'fang_lei',
                username: '方蕾',
                content: '说得太好了，共勉',
                timestamp: Date.now() - 17 * 60 * 60 * 1000
            }
        ]
    },
    {
        id: 1006,
        userId: 'fang_lei',
        username: '方蕾',
        avatar: '万鹏.jpg',
        content: '周末去了美术馆，看到一幅很喜欢的画。艺术总能给人带来不一样的感悟。',
        timestamp: Date.now() - 24 * 60 * 60 * 1000, // 1天前
        likes: [
            { userId: 'xu_yan', username: '许妍' }
        ],
        comments: [
            {
                userId: 'xu_yan',
                username: '许妍',
                content: '下次一起去吧！',
                timestamp: Date.now() - 23 * 60 * 60 * 1000
            }
        ]
    },
    {
        id: 1007,
        userId: 'xu_yan',
        username: '许妍',
        avatar: '赵露思.jpg',
        content: '终于学会了那个高难度的舞蹈动作！💃 虽然练了好多遍，但是看到成果的那一刻，所有的辛苦都值得了！',
        timestamp: Date.now() - 36 * 60 * 60 * 1000, // 1.5天前
        likes: [
            { userId: 'shen_haoming', username: '沈皓明' },
            { userId: 'fang_lei', username: '方蕾' }
        ],
        comments: [
            {
                userId: 'shen_haoming',
                username: '沈皓明',
                content: '很棒，继续加油',
                timestamp: Date.now() - 35 * 60 * 60 * 1000
            },
            {
                userId: 'fang_lei',
                username: '方蕾',
                content: '你真的很努力！',
                timestamp: Date.now() - 34 * 60 * 60 * 1000
            }
        ]
    },
    {
        id: 1008,
        userId: 'shen_haoming',
        username: '沈皓明',
        avatar: '陈伟霆.jpg',
        content: '今天的会议很有收获，团队的每个人都提出了很好的想法。优秀的团队才能成就优秀的作品。',
        timestamp: Date.now() - 48 * 60 * 60 * 1000, // 2天前
        likes: [
            { userId: 'fang_lei', username: '方蕾' }
        ],
        comments: []
    },
    {
        id: 1009,
        userId: 'fang_lei',
        username: '方蕾',
        avatar: '万鹏.jpg',
        content: '读完了一本很棒的书，关于女性成长的故事。每个人都有自己的节奏，不必和别人比较。',
        timestamp: Date.now() - 60 * 60 * 60 * 1000, // 2.5天前
        likes: [
            { userId: 'xu_yan', username: '许妍' }
        ],
        comments: [
            {
                userId: 'xu_yan',
                username: '许妍',
                content: '能推荐一下书名吗？',
                timestamp: Date.now() - 59 * 60 * 60 * 1000
            }
        ]
    },
    {
        id: 1010,
        userId: 'xu_yan',
        username: '许妍',
        avatar: '赵露思.jpg',
        content: '今天收到了粉丝的手写信，真的好感动！💕 谢谢你们一直以来的支持和鼓励，我会继续努力的！',
        timestamp: Date.now() - 72 * 60 * 60 * 1000, // 3天前
        likes: [
            { userId: 'shen_haoming', username: '沈皓明' },
            { userId: 'fang_lei', username: '方蕾' }
        ],
        comments: [
            {
                userId: 'shen_haoming',
                username: '沈皓明',
                content: '你值得这份喜爱',
                timestamp: Date.now() - 71 * 60 * 60 * 1000
            }
        ]
    },
    {
        id: 1011,
        userId: 'shen_haoming',
        username: '沈皓明',
        avatar: '陈伟霆.jpg',
        content: '晨跑结束，新的一天开始了。保持运动的习惯，让身心都保持最佳状态。',
        timestamp: Date.now() - 84 * 60 * 60 * 1000, // 3.5天前
        likes: [
            { userId: 'xu_yan', username: '许妍' }
        ],
        comments: []
    },
    {
        id: 1012,
        userId: 'fang_lei',
        username: '方蕾',
        avatar: '万鹏.jpg',
        content: '今天的拍摄遇到了一些挑战，但团队一起克服了。困难让我们更加团结。',
        timestamp: Date.now() - 96 * 60 * 60 * 1000, // 4天前
        likes: [
            { userId: 'xu_yan', username: '许妍' },
            { userId: 'shen_haoming', username: '沈皓明' }
        ],
        comments: [
            {
                userId: 'xu_yan',
                username: '许妍',
                content: '我们是最棒的团队！',
                timestamp: Date.now() - 95 * 60 * 60 * 1000
            }
        ]
    }
];

// AI回复模板（根据性格）
const AI_REPLY_TEMPLATES = {
    confident: [
        '说得很有道理',
        '我也有同样的想法',
        '这个观点很独到',
        '确实如此',
        '值得深思'
    ],
    cheerful: [
        '哈哈哈太棒了！',
        '我也这么觉得！',
        '说得太好了！',
        '加油加油！',
        '真的吗？好期待！',
        '太有意思了！'
    ],
    calm: [
        '有道理',
        '我理解你的感受',
        '这个角度很独特',
        '值得思考',
        '说得很好',
        '确实是这样'
    ]
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AI_CHARACTERS,
        INITIAL_MOMENTS,
        AI_REPLY_TEMPLATES
    };
}
