const OpenAI = require('openai');

/**
 * AI 服务类 - 负责与 AI API 交互
 * 支持 OpenAI 和 DeepSeek API
 */
class AIService {
    constructor() {
        // 优先级：阿里云百炼 > DeepSeek > OpenAI
        this.useDashScope = !!process.env.DASHSCOPE_API_KEY;
        this.useDeepSeek = !!process.env.DEEPSEEK_API_KEY;
        
        if (this.useDashScope) {
            this.apiKey = process.env.DASHSCOPE_API_KEY;
            this.model = process.env.DASHSCOPE_MODEL || 'qwen-max';
            this.baseURL = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
            this.provider = 'DashScope';
            console.log('✅ 使用阿里云百炼（通义千问）API');
        } else if (this.useDeepSeek) {
            this.apiKey = process.env.DEEPSEEK_API_KEY;
            this.model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
            this.baseURL = 'https://api.deepseek.com';
            this.provider = 'DeepSeek';
            console.log('✅ 使用 DeepSeek API');
        } else {
            this.apiKey = process.env.OPENAI_API_KEY;
            this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
            this.baseURL = 'https://api.openai.com/v1';
            this.provider = 'OpenAI';
            console.log('✅ 使用 OpenAI API');
        }
        
        // 初始化 OpenAI 客户端（兼容阿里云百炼、DeepSeek 和 OpenAI）
        // 检查是否有有效的 API Key（排除占位符）
        const invalidKeys = [
            'your_openai_api_key_here',
            'your_dashscope_api_key_here',
            'your_deepseek_api_key_here'
        ];
        
        if (this.apiKey && !invalidKeys.includes(this.apiKey)) {
            this.client = new OpenAI({
                baseURL: this.baseURL,
                apiKey: this.apiKey
            });
            console.log(`✅ AI 客户端初始化成功 - 提供商: ${this.provider}`);
        } else {
            console.log(`⚠️  未配置有效的 API Key，将使用模拟回复`);
        }
        
        // AI 角色设定
        this.aiCharacters = {
            'ai-user-1': {
                name: '徐研',
                personality: 'cheerful',
                systemPrompt: '你是一个活泼开朗的年轻人，喜欢看电视剧，经常用表情符号和感叹号。回复要简短、热情。'
            },
            'ai-user-2': {
                name: '沈皓明',
                personality: 'calm',
                systemPrompt: '你是一个理性冷静的观众，喜欢分析剧情和人物。回复要有深度但简洁。'
            },
            'ai-user-3': {
                name: '方蕾',
                personality: 'confident',
                systemPrompt: '你是一个自信的影评人，对演技和制作有独到见解。回复要专业但不失亲和力。'
            }
        };
    }

    /**
     * 生成 AI 回复
     * @param {string} momentContent - 用户发布的动态内容
     * @param {string} aiCharacterId - AI 角色 ID
     * @returns {Promise<string>} AI 生成的回复
     */
    async generateReply(momentContent, aiCharacterId) {
        try {
            const character = this.aiCharacters[aiCharacterId];
            if (!character) {
                throw new Error('未知的 AI 角色');
            }

            // 如果没有配置 API Key，使用模拟回复
            if (!this.client) {
                console.log('⚠️  未配置 AI API Key，使用模拟回复');
                return this.getMockReply(momentContent, character.personality);
            }

            // 调用 AI API（支持 OpenAI 和 DeepSeek）
            const completion = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: character.systemPrompt + '\n\n重要：回复必须在30字以内，要自然、口语化。'
                    },
                    {
                        role: 'user',
                        content: `有人在观看《许我耀眼》时发布了这样的动态："${momentContent}"。请作为${character.name}回复这条动态。`
                    }
                ],
                temperature: 0.8,
                max_tokens: 100
            });

            const reply = completion.choices[0].message.content.trim();
            console.log(`✅ AI (${character.name}) 使用 ${this.provider} 生成回复: ${reply}`);
            return reply;

        } catch (error) {
            console.error('AI 回复生成失败:', error.message);
            // 失败时返回模拟回复
            return this.getMockReply(momentContent, this.aiCharacters[aiCharacterId]?.personality || 'cheerful');
        }
    }

    /**
     * 获取模拟回复（当 API 不可用时使用）
     */
    getMockReply(content, personality) {
        const mockReplies = {
            cheerful: [
                '哈哈哈说得太对了！😄',
                '我也这么觉得！超级赞！👍',
                '完全同意！这剧真的好看！✨',
                '太有共鸣了！🎉',
                '说到我心坎里了！💕'
            ],
            calm: [
                '有道理，值得思考',
                '确实，这个角度很有意思',
                '分析得很到位',
                '同感，剧情处理得不错',
                '观察很细致'
            ],
            confident: [
                '说得很有道理！',
                '这个评价很专业',
                '确实如此，演技在线',
                '你的品味不错',
                '见解独到'
            ]
        };

        const replies = mockReplies[personality] || mockReplies.cheerful;
        return replies[Math.floor(Math.random() * replies.length)];
    }

    /**
     * 判断 AI 是否应该回复（基于概率）
     */
    shouldReply() {
        const probability = parseFloat(process.env.AI_REPLY_PROBABILITY) || 0.7;
        return Math.random() < probability;
    }

    /**
     * 获取随机延迟时间（模拟真实用户）
     */
    getRandomDelay() {
        const min = parseInt(process.env.AI_REPLY_DELAY_MIN) || 3000;
        const max = parseInt(process.env.AI_REPLY_DELAY_MAX) || 8000;
        return Math.floor(Math.random() * (max - min) + min);
    }

    /**
     * 随机选择一个 AI 角色
     */
    getRandomAICharacter() {
        const aiIds = Object.keys(this.aiCharacters);
        return aiIds[Math.floor(Math.random() * aiIds.length)];
    }
}

module.exports = new AIService();
