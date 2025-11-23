require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const aiService = require('./services/aiService');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 日志中间件
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// 内存存储（简单实现，生产环境应使用数据库）
let moments = [];
let momentIdCounter = 1;

// ==================== API 路由 ====================

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Server is running',
        aiProvider: aiService.provider || 'Mock',
        timestamp: new Date().toISOString(),
        momentsCount: moments.length
    });
});



// 获取所有动态
app.get('/api/moments', (req, res) => {
    try {
        // 按时间倒序排序
        const sortedMoments = [...moments].sort((a, b) => b.timestamp - a.timestamp);
        res.json({
            success: true,
            data: sortedMoments,
            count: sortedMoments.length
        });
    } catch (error) {
        console.error('获取动态列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取动态列表失败',
            error: error.message
        });
    }
});

// 发布新动态
app.post('/api/moments', async (req, res) => {
    try {
        const { userId, username, avatar, content } = req.body;

        // 验证必填字段
        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: '内容不能为空'
            });
        }

        if (content.length > 500) {
            return res.status(400).json({
                success: false,
                message: '内容不能超过500字'
            });
        }

        // 创建新动态
        const moment = {
            id: momentIdCounter++,
            userId: userId || 'user',
            username: username || '用户',
            avatar: avatar || '',
            content: content.trim(),
            timestamp: Date.now(),
            likes: [],
            comments: []
        };

        // 添加到列表
        moments.unshift(moment);

        console.log('✅ 新动态已发布:', moment.id);

        res.json({
            success: true,
            message: '发布成功',
            data: moment
        });

        // 异步触发 AI 互动（不阻塞响应）
        triggerAIInteraction(moment.id);

    } catch (error) {
        console.error('发布动态失败:', error);
        res.status(500).json({
            success: false,
            message: '发布动态失败',
            error: error.message
        });
    }
});

// 点赞/取消点赞
app.post('/api/moments/:id/like', (req, res) => {
    try {
        const momentId = parseInt(req.params.id);
        const { userId, username } = req.body;

        const moment = moments.find(m => m.id === momentId);
        if (!moment) {
            return res.status(404).json({
                success: false,
                message: '动态不存在'
            });
        }

        // 检查是否已点赞
        const likeIndex = moment.likes.findIndex(like => like.userId === userId);

        if (likeIndex >= 0) {
            // 取消点赞
            moment.likes.splice(likeIndex, 1);
            res.json({
                success: true,
                message: '已取消点赞',
                data: { liked: false, likesCount: moment.likes.length }
            });
        } else {
            // 添加点赞
            moment.likes.push({
                userId: userId || 'user',
                username: username || '用户',
                timestamp: Date.now()
            });
            res.json({
                success: true,
                message: '点赞成功',
                data: { liked: true, likesCount: moment.likes.length }
            });
        }

    } catch (error) {
        console.error('点赞操作失败:', error);
        res.status(500).json({
            success: false,
            message: '点赞操作失败',
            error: error.message
        });
    }
});

// 发表评论
app.post('/api/moments/:id/comments', async (req, res) => {
    try {
        const momentId = parseInt(req.params.id);
        const { userId, username, content, replyTo } = req.body;

        const moment = moments.find(m => m.id === momentId);
        if (!moment) {
            return res.status(404).json({
                success: false,
                message: '动态不存在'
            });
        }

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: '评论内容不能为空'
            });
        }

        // 添加评论
        const comment = {
            userId: userId || 'user',
            username: username || '用户',
            content: content.trim(),
            replyTo: replyTo || null,
            timestamp: Date.now()
        };

        moment.comments.push(comment);

        console.log('✅ 新评论已添加:', momentId);

        res.json({
            success: true,
            message: '评论成功',
            data: comment
        });

        // 异步触发 AI 回复（不阻塞响应）
        // 只有用户评论时才触发 AI 回复
        if (userId === 'user' || !userId) {
            console.log(`🎯 触发AI回复 - 动态ID: ${momentId}`);
            triggerAIReply(momentId);
        }

    } catch (error) {
        console.error('发表评论失败:', error);
        res.status(500).json({
            success: false,
            message: '发表评论失败',
            error: error.message
        });
    }
});

// 删除动态
app.delete('/api/moments/:id', (req, res) => {
    try {
        const momentId = parseInt(req.params.id);
        const { userId } = req.body;

        const momentIndex = moments.findIndex(m => m.id === momentId);
        if (momentIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '动态不存在'
            });
        }

        const moment = moments[momentIndex];

        // 验证权限（只能删除自己的动态）
        if (moment.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: '无权删除此动态'
            });
        }

        // 删除动态
        moments.splice(momentIndex, 1);

        console.log('✅ 动态已删除:', momentId);

        res.json({
            success: true,
            message: '删除成功'
        });

    } catch (error) {
        console.error('删除动态失败:', error);
        res.status(500).json({
            success: false,
            message: '删除动态失败',
            error: error.message
        });
    }
});

// 删除评论
app.delete('/api/moments/:id/comments/:commentIndex', (req, res) => {
    try {
        const momentId = parseInt(req.params.id);
        const commentIndex = parseInt(req.params.commentIndex);
        const { userId } = req.body;

        const moment = moments.find(m => m.id === momentId);
        if (!moment) {
            return res.status(404).json({
                success: false,
                message: '动态不存在'
            });
        }

        if (!moment.comments || !moment.comments[commentIndex]) {
            return res.status(404).json({
                success: false,
                message: '评论不存在'
            });
        }

        const comment = moment.comments[commentIndex];

        // 验证权限（只能删除自己的评论）
        if (comment.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: '无权删除此评论'
            });
        }

        // 删除评论
        moment.comments.splice(commentIndex, 1);

        console.log('✅ 评论已删除:', momentId, commentIndex);

        res.json({
            success: true,
            message: '删除成功'
        });

    } catch (error) {
        console.error('删除评论失败:', error);
        res.status(500).json({
            success: false,
            message: '删除评论失败',
            error: error.message
        });
    }
});

// ==================== AI 互动逻辑 ====================

// 触发 AI 互动（点赞或评论）
async function triggerAIInteraction(momentId) {
    try {
        // 检查是否应该回复（基于概率）
        if (!aiService.shouldReply()) {
            console.log(`🎲 本次不触发AI互动 (概率: ${process.env.AI_REPLY_PROBABILITY || 0.7})`);
            return;
        }
        
        // 延迟 10-30 秒
        const delay = 10000 + Math.random() * 20000;
        
        console.log(`⏰ AI 将在 ${Math.round(delay/1000)} 秒后互动动态 ${momentId}`);
        
        setTimeout(async () => {
            const moment = moments.find(m => m.id === momentId);
            if (!moment) {
                console.log(`⚠️ 动态 ${momentId} 已被删除`);
                return;
            }

            // 随机选择 AI 角色
            const aiCharacterId = aiService.getRandomAICharacter();
            const aiCharacter = aiService.aiCharacters[aiCharacterId];

            if (!aiCharacter) {
                console.error('❌ 未找到 AI 角色:', aiCharacterId);
                return;
            }

            // 50% 概率点赞，50% 概率评论
            if (Math.random() > 0.5) {
                // AI 点赞
                if (!moment.likes.some(like => like.userId === aiCharacterId)) {
                    moment.likes.push({
                        userId: aiCharacterId,
                        username: aiCharacter.name,
                        timestamp: Date.now()
                    });
                    console.log(`✅ AI ${aiCharacter.name} 点赞了动态 ${momentId}`);
                }
            } else {
                // AI 评论
                try {
                    console.log(`🤖 AI ${aiCharacter.name} 正在生成评论...`);
                    const reply = await aiService.generateReply(moment.content, aiCharacterId);
                    moment.comments.push({
                        userId: aiCharacterId,
                        username: aiCharacter.name,
                        content: reply,
                        timestamp: Date.now()
                    });
                    console.log(`✅ AI ${aiCharacter.name} 评论了动态 ${momentId}: ${reply}`);
                } catch (error) {
                    console.error('❌ AI 评论生成失败:', error.message);
                }
            }
        }, delay);

    } catch (error) {
        console.error('❌ 触发 AI 互动失败:', error.message);
    }
}

// 触发 AI 回复评论
async function triggerAIReply(momentId) {
    try {
        // 检查是否应该回复（基于概率）
        if (!aiService.shouldReply()) {
            console.log(`🎲 本次不触发AI回复 (概率: ${process.env.AI_REPLY_PROBABILITY || 0.7})`);
            return;
        }
        
        // 延迟 3-8 秒
        const delay = 3000 + Math.random() * 5000;
        console.log(`⏰ AI 将在 ${Math.round(delay/1000)} 秒后回复评论`);

        setTimeout(async () => {
            const moment = moments.find(m => m.id === momentId);
            if (!moment) return;

            // 获取最后一条评论内容（用户的评论）
            const lastComment = moment.comments[moment.comments.length - 1];
            if (!lastComment) return;

            // 智能选择回复的 AI 角色
            let aiCharacterId;
            let selectionReason;

            // 检查动态是否是 AI 发布的
            const isAIMoment = moment.userId.startsWith('ai-user-');
            
            if (isAIMoment) {
                // 动态是 AI 发布的，优先让该 AI 回复（80% 概率）
                if (Math.random() < 0.8) {
                    aiCharacterId = moment.userId;
                    selectionReason = '动态发布者优先回复';
                } else {
                    // 20% 概率让其他 AI 回复（模拟朋友圈互动）
                    aiCharacterId = aiService.getRandomAICharacter();
                    selectionReason = '其他AI参与互动';
                }
            } else {
                // 用户自己的动态，随机选择 AI 回复
                aiCharacterId = aiService.getRandomAICharacter();
                selectionReason = '随机AI回复用户动态';
            }

            const aiCharacter = aiService.aiCharacters[aiCharacterId];
            
            if (!aiCharacter) {
                console.error('❌ 未找到 AI 角色:', aiCharacterId);
                return;
            }

            try {
                console.log(`🤖 AI ${aiCharacter.name} 正在生成回复...`);
                
                // 生成 AI 回复
                const reply = await aiService.generateReply(lastComment.content, aiCharacterId);

                // 添加 AI 回复
                moment.comments.push({
                    userId: aiCharacterId,
                    username: aiCharacter.name,
                    content: reply,
                    replyTo: lastComment.username,
                    timestamp: Date.now()
                });

                console.log(`✅ AI ${aiCharacter.name} 回复了评论: ${reply}`);
            } catch (error) {
                console.error('❌ AI 回复生成失败:', error.message);
            }
        }, delay);

    } catch (error) {
        console.error('❌ 触发 AI 回复失败:', error.message);
    }
}

// ==================== 初始化数据 ====================

function initializeData() {
    // 添加一些初始动态
    moments = [
        {
            id: momentIdCounter++,
            userId: 'ai-user-1',
            username: '小智',
            avatar: '',
            content: '今天的拍摄特别顺利！感谢所有工作人员的辛苦付出~ 😊',
            timestamp: Date.now() - 2 * 60 * 60 * 1000,
            likes: [],
            comments: []
        },
        {
            id: momentIdCounter++,
            userId: 'ai-user-2',
            username: '思雨',
            avatar: '',
            content: '刚看完剧本，这个角色的成长弧线设计得真好。',
            timestamp: Date.now() - 5 * 60 * 60 * 1000,
            likes: [],
            comments: []
        },
        {
            id: momentIdCounter++,
            userId: 'ai-user-3',
            username: '阳光',
            avatar: '',
            content: '工作再忙，也要记得照顾好自己。',
            timestamp: Date.now() - 8 * 60 * 60 * 1000,
            likes: [],
            comments: []
        }
    ];

    console.log('✅ 初始数据已加载');
}

// ==================== 启动服务器 ====================

app.listen(PORT, () => {
    console.log('');
    console.log('='.repeat(50));
    console.log('🚀 视频播放器后端服务已启动');
    console.log('='.repeat(50));
    console.log(`📡 服务地址: http://localhost:${PORT}`);
    console.log(`🤖 AI 提供商: ${aiService.provider || 'Mock'}`);
    console.log(`📝 API 文档:`);
    console.log(`   - GET  /api/health              健康检查`);
    console.log(`   - GET  /api/moments             获取动态列表`);
    console.log(`   - POST /api/moments             发布新动态`);
    console.log(`   - POST /api/moments/:id/like    点赞/取消点赞`);
    console.log(`   - POST /api/moments/:id/comments 发表评论`);
    console.log('='.repeat(50));
    console.log('');

    // 初始化数据
    initializeData();
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n👋 服务器正在关闭...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 服务器正在关闭...');
    process.exit(0);
});
