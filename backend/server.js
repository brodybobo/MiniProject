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

// 清空所有评论（测试用）
app.post('/api/moments/clear-comments', (req, res) => {
    try {
        let totalCleared = 0;
        moments.forEach(moment => {
            totalCleared += moment.comments.length;
            moment.comments = [];
            moment.likes = [];
        });
        console.log(`🧹 已清空所有动态的评论和点赞，共 ${totalCleared} 条`);
        res.json({
            success: true,
            message: `已清空 ${totalCleared} 条评论`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '清空失败',
            error: error.message
        });
    }
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
        const { userId, username, avatar, content, location, images } = req.body;

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
            location: location || null,
            images: images || [],
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
        // 如果用户回复的是自己（replyTo === '我'），则不触发AI回复
        if ((userId === 'user' || !userId) && replyTo !== '我' && replyTo !== username) {
            console.log(`🎯 触发AI回复 - 动态ID: ${momentId}`);
            triggerAIReply(momentId);
        } else if (replyTo === '我' || replyTo === username) {
            console.log(`⏭️ 用户回复自己，不触发AI回复`);
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

        console.log('🗑️ 收到删除请求 - momentId:', momentId, '类型:', typeof momentId, 'userId:', userId);
        console.log('📋 当前moments列表:', moments.map(m => ({ id: m.id, userId: m.userId, username: m.username })));

        const momentIndex = moments.findIndex(m => m.id === momentId);
        console.log('🔍 找到的索引:', momentIndex);

        if (momentIndex === -1) {
            console.log('❌ 动态不存在 - momentId:', momentId);
            return res.status(404).json({
                success: false,
                message: '动态不存在'
            });
        }

        const moment = moments[momentIndex];
        console.log('📝 找到的动态:', { id: moment.id, userId: moment.userId, username: moment.username });

        // 验证权限（只能删除自己的动态）
        if (moment.userId !== userId) {
            console.log('❌ 无权删除 - moment.userId:', moment.userId, 'request.userId:', userId);
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

        const targetComment = moment.comments[commentIndex];

        // 验证权限：只能删除自己的评论
        if (targetComment.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: '只能删除自己的评论'
            });
        }

        // 级联删除：删除用户评论及其后续的AI回复链
        // 逻辑：从被删除评论开始，向后查找所有属于同一对话链的评论
        const indicesToDelete = [commentIndex];
        const deletedUsername = targetComment.username; // "我"

        // 追踪对话链：用户评论被删除后，后续所有 replyTo="我" 的AI评论都应该删除
        // 同时，如果用户又回复了AI，那些也应该删除，以及AI对那些的回复
        let i = commentIndex + 1;
        while (i < moment.comments.length) {
            const comment = moment.comments[i];
            const isAIComment = comment.userId && comment.userId.startsWith('ai-user-');
            const isUserComment = comment.userId === 'user';

            // 检查这条评论是否是对已标记删除的评论的回复
            // AI回复用户（replyTo === "我"）且紧跟在用户评论后面
            if (isAIComment && comment.replyTo === deletedUsername) {
                // 检查这条AI评论是否是回复被删除链中的评论
                // 简化逻辑：如果AI回复的是"我"，且在删除链之后，就删除
                indicesToDelete.push(i);
            }

            i++;
        }

        // 从后往前删除，避免索引变化问题
        indicesToDelete.sort((a, b) => b - a);
        for (const idx of indicesToDelete) {
            const removed = moment.comments.splice(idx, 1)[0];
            console.log(`🗑️ 删除评论 [${idx}]: ${removed.username} - ${removed.content.substring(0, 20)}...`);
        }

        console.log(`✅ 共删除 ${indicesToDelete.length} 条评论`);

        res.json({
            success: true,
            message: '删除成功',
            deletedCount: indicesToDelete.length
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
        // AI 将始终回复（概率设置为 1）
        if (!aiService.shouldReply()) {
            console.log(`⏭️  AI 未触发互动`);
            return;
        }

        // 使用配置的延迟时间（默认 200-400 毫秒）
        const initialDelay = aiService.getRandomDelay();
        console.log(`⏰ AI 将在 ${initialDelay} 毫秒后开始互动动态 ${momentId}`);

        setTimeout(async () => {
            const moment = moments.find(m => m.id === momentId);
            if (!moment) {
                console.log(`⚠️ 动态 ${momentId} 已被删除`);
                return;
            }

            // 检查动态内容中是否提及某个AI角色
            const mentionedCharacterId = aiService.getMentionedCharacter(moment.content);

            // 选择参与互动的AI角色（1-2个）
            let aiCharacterIds;
            if (mentionedCharacterId) {
                // 如果提及了某个角色，该角色必定参与
                aiCharacterIds = [mentionedCharacterId];
                // 50%概率再添加一个其他角色
                if (Math.random() < 0.5) {
                    const otherAIs = aiService.getRandomAICharacters(mentionedCharacterId);
                    if (otherAIs.length > 0) {
                        aiCharacterIds.push(otherAIs[0]);
                    }
                }
                console.log(`👤 提及了${aiService.aiCharacters[mentionedCharacterId].name}，该角色必定参与${aiCharacterIds.length > 1 ? '，另有1个AI参与' : ''}`);
            } else {
                // 未提及任何角色，随机选择1-2个角色
                aiCharacterIds = aiService.getRandomAICharacters();
                console.log(`🎲 随机选择 ${aiCharacterIds.length} 个AI角色参与互动`);
            }

            // 检查是否包含sea.jpg图片
            const hasSeaImage = moment.images && moment.images.some(img => img.includes('sea.jpg'));
            if (hasSeaImage) {
                console.log(`📷 检测到海边图片，AI将评论而不是点赞`);
            }

            // 让每个AI角色依次互动，每个角色之间有延迟
            for (let i = 0; i < aiCharacterIds.length; i++) {
                const aiCharacterId = aiCharacterIds[i];
                const aiCharacter = aiService.aiCharacters[aiCharacterId];

                if (!aiCharacter) {
                    console.error('❌ 未找到 AI 角色:', aiCharacterId);
                    continue;
                }

                // 每个角色之间延迟200-600毫秒
                if (i > 0) {
                    const betweenDelay = Math.floor(Math.random() * 400) + 200;
                    await new Promise(resolve => setTimeout(resolve, betweenDelay));
                }

                // 如果包含sea.jpg图片，一定评论；否则50%概率点赞，50%概率评论
                const shouldComment = hasSeaImage || Math.random() > 0.5;

                if (!shouldComment) {
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

                        // 获取最近的对话历史（最多10条评论，包含所有角色的回复）
                        const conversationHistory = moment.comments.slice(-10).map(comment => ({
                            username: comment.username,
                            content: comment.content
                        }));

                        const reply = await aiService.generateReply(moment.content, aiCharacterId, moment.images, conversationHistory);
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
            }
        }, initialDelay);

    } catch (error) {
        console.error('❌ 触发 AI 互动失败:', error.message);
    }
}

// 触发 AI 回复评论
async function triggerAIReply(momentId) {
    try {
        // AI 将始终回复（概率设置为 1）
        if (!aiService.shouldReply()) {
            console.log(`⏭️  AI 未触发回复`);
            return;
        }

        // 使用配置的延迟时间（默认 200-400 毫秒）
        const initialDelay = aiService.getRandomDelay();
        console.log(`⏰ AI 将在 ${initialDelay} 毫秒后开始回复评论`);

        setTimeout(async () => {
            const moment = moments.find(m => m.id === momentId);
            if (!moment) return;

            // 获取最后一条评论内容（用户的评论）
            const lastComment = moment.comments[moment.comments.length - 1];
            if (!lastComment) return;

            // AI角色名称到ID的映射
            const aiNameToId = {
                '许妍': 'ai-user-1',
                '沈皓明': 'ai-user-2',
                '方蕾': 'ai-user-3'
            };

            // 智能选择回复的 AI 角色（1-2个）
            let aiCharacterIds = [];
            let selectionReason;

            // 优先级0：检查评论内容中是否提及某个AI角色
            const mentionedCharacterId = aiService.getMentionedCharacter(lastComment.content);
            if (mentionedCharacterId) {
                // 被提及的角色必定参与
                aiCharacterIds = [mentionedCharacterId];
                // 30%概率再添加一个其他角色
                if (Math.random() < 0.3) {
                    const otherAIs = aiService.getRandomAICharacters(mentionedCharacterId);
                    if (otherAIs.length > 0) {
                        aiCharacterIds.push(otherAIs[0]);
                    }
                }
                selectionReason = `用户在评论中提及了${aiService.aiCharacters[mentionedCharacterId].name}${aiCharacterIds.length > 1 ? '，另有1个AI参与' : ''}`;
            }
            // 优先级1：如果用户回复了某个AI的评论，让那个AI来回复
            else if (lastComment.replyTo && aiNameToId[lastComment.replyTo]) {
                const repliedAIId = aiNameToId[lastComment.replyTo];
                // 被回复的AI一定会回复
                aiCharacterIds = [repliedAIId];
                // 30%概率再添加一个其他角色
                if (Math.random() < 0.3) {
                    const otherAIs = aiService.getRandomAICharacters(repliedAIId);
                    if (otherAIs.length > 0) {
                        aiCharacterIds.push(otherAIs[0]);
                    }
                }
                selectionReason = `用户回复了${lastComment.replyTo}，由该AI继续对话${aiCharacterIds.length > 1 ? '，另有1个AI参与' : ''}`;
            }
            // 优先级2：检查动态是否是 AI 发布的
            else {
                const isAIMoment = moment.userId.startsWith('ai-user-');

                if (isAIMoment) {
                    // 动态是 AI 发布的，让该 AI 回复
                    aiCharacterIds = [moment.userId];
                    selectionReason = '动态发布者回复';
                } else {
                    // 用户自己的动态，查找之前与用户对话的AI
                    let lastAIComment = null;
                    for (let i = moment.comments.length - 2; i >= 0; i--) {
                        const comment = moment.comments[i];
                        if (comment.userId && comment.userId.startsWith('ai-user-')) {
                            lastAIComment = comment;
                            break;
                        }
                    }

                    if (lastAIComment) {
                        aiCharacterIds = [lastAIComment.userId];
                        // 30%概率有其他AI也参与
                        if (Math.random() < 0.3) {
                            const otherAIs = aiService.getRandomAICharacters(lastAIComment.userId);
                            if (otherAIs.length > 0) {
                                aiCharacterIds.push(otherAIs[0]);
                            }
                        }
                        selectionReason = `继续之前的对话，由${lastAIComment.username}回复${aiCharacterIds.length > 1 ? '，另有1个AI参与' : ''}`;
                    } else {
                        // 没有找到之前的AI评论，随机选择1-2个AI
                        aiCharacterIds = aiService.getRandomAICharacters();
                        selectionReason = `随机${aiCharacterIds.length}个AI回复用户评论`;
                    }
                }
            }

            console.log(`🎲 ${selectionReason}，共${aiCharacterIds.length}个AI将回复`);

            // 让每个AI角色依次回复
            for (let i = 0; i < aiCharacterIds.length; i++) {
                const aiCharacterId = aiCharacterIds[i];
                const aiCharacter = aiService.aiCharacters[aiCharacterId];

                if (!aiCharacter) {
                    console.error('❌ 未找到 AI 角色:', aiCharacterId);
                    continue;
                }

                // 每个角色之间延迟200-600毫秒
                if (i > 0) {
                    const betweenDelay = Math.floor(Math.random() * 400) + 200;
                    await new Promise(resolve => setTimeout(resolve, betweenDelay));
                }

                try {
                    console.log(`🤖 AI ${aiCharacter.name} 正在生成回复... (${selectionReason})`);

                    // 获取最近的对话历史（最多10条评论，包含所有角色的回复）
                    const conversationHistory = moment.comments.slice(-10).map(comment => ({
                        username: comment.username,
                        content: comment.content
                    }));

                    // 生成 AI 回复，传入动态的图片信息和对话历史
                    const reply = await aiService.generateReply(lastComment.content, aiCharacterId, moment.images, conversationHistory);

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
            }
        }, initialDelay);

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
            username: '许妍',
            avatar: '',
            content: '今天的拍摄特别顺利！感谢所有工作人员的辛苦付出~ 😊',
            images: ['icon/许妍1.png'],
            timestamp: Date.now() - 2 * 60 * 60 * 1000,
            likes: [],
            comments: []
        },
        {
            id: momentIdCounter++,
            userId: 'ai-user-2',
            username: '沈皓明',
            avatar: '',
            content: '',
            images: ['icon/沈皓明1.png', 'icon/沈皓明2.png'],
            timestamp: Date.now() - 5 * 60 * 60 * 1000,
            likes: [],
            comments: []
        },
        {
            id: momentIdCounter++,
            userId: 'ai-user-3',
            username: '方蕾',
            avatar: '',
            content: '工作再忙，也要记得照顾好自己。',
            images: ['icon/方蕾1.png'],
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

// 全局错误处理 - 防止未捕获的异常导致服务器崩溃
process.on('uncaughtException', (error) => {
    console.error('❌ 未捕获的异常:', error);
    console.error('堆栈追踪:', error.stack);
    // 不退出进程，继续运行
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ 未处理的Promise拒绝:', reason);
    console.error('Promise:', promise);
    // 不退出进程，继续运行
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
