// AI朋友圈核心模块
class AIMomentsManager {
    constructor() {
        this.sidebar = null;
        this.openBtn = null;
        this.closeBtn = null;
        this.mainContent = null;
        this.videoContainer = null;
        this.isOpen = false;
        
        // 发布相关元素
        this.publishBtn = null;
        this.publishModal = null;
        this.publishTextarea = null;
        this.publishSubmitBtn = null;
        this.charCount = null;
        
        // 动态列表
        this.momentsList = null;
        this.moments = [];
        
        // AI角色数据
        this.aiCharacters = null;
        this.aiReplyTemplates = null;
        
        // 初始化
        this.init();
    }
    
    init() {
        // 获取DOM元素
        this.sidebar = document.getElementById('aiMomentsSidebar');
        this.openBtn = document.getElementById('aiMomentsBtn');
        this.closeBtn = document.getElementById('momentsCloseBtn');
        this.mainContent = document.querySelector('.main-content');
        this.videoContainer = document.querySelector('.video-container');
        
        // 发布相关元素
        this.publishBtn = document.getElementById('momentsPublishBtn');
        this.publishModal = document.getElementById('publishModal');
        this.publishTextarea = document.getElementById('publishTextarea');
        this.publishSubmitBtn = document.getElementById('publishSubmitBtn');
        this.charCount = document.getElementById('charCount');
        this.momentsList = document.getElementById('momentsList');
        
        // 加载AI数据
        this.loadAIData();
        
        // 加载或初始化朋友圈数据
        this.loadMoments();
        if (this.moments.length === 0) {
            this.initializeMoments();
        }
        
        // 渲染朋友圈
        this.renderMoments();
        
        // 绑定事件
        this.bindEvents();
        
        console.log('AI朋友圈模块初始化完成');
    }
    
    loadAIData() {
        // 加载AI角色数据（从全局变量或内联数据）
        if (typeof AI_CHARACTERS !== 'undefined') {
            this.aiCharacters = AI_CHARACTERS;
            this.aiReplyTemplates = AI_REPLY_TEMPLATES;
        } else {
            // 如果没有加载数据文件，使用内联数据
            this.aiCharacters = {
                shen_haoming: {
                    id: 'shen_haoming',
                    name: '沈皓明',
                    avatar: '陈伟霆.jpg',
                    personality: 'confident'
                },
                xu_yan: {
                    id: 'xu_yan',
                    name: '许妍',
                    avatar: '赵露思.jpg',
                    personality: 'cheerful'
                },
                fang_lei: {
                    id: 'fang_lei',
                    name: '方蕾',
                    avatar: '万鹏.jpg',
                    personality: 'calm'
                }
            };
            this.aiReplyTemplates = {
                confident: ['说得很有道理', '确实如此'],
                cheerful: ['哈哈哈太棒了！', '我也这么觉得！'],
                calm: ['有道理', '值得思考']
            };
        }
    }
    
    initializeMoments() {
        // 使用初始数据或创建默认数据
        if (typeof INITIAL_MOMENTS !== 'undefined' && INITIAL_MOMENTS.length > 0) {
            this.moments = JSON.parse(JSON.stringify(INITIAL_MOMENTS));
        } else {
            // 创建一些默认动态
            this.moments = [
                {
                    id: 1001,
                    userId: 'xu_yan',
                    username: '许妍',
                    avatar: '赵露思.jpg',
                    content: '今天的拍摄特别顺利！感谢所有工作人员的辛苦付出~',
                    timestamp: Date.now() - 2 * 60 * 60 * 1000,
                    likes: [],
                    comments: []
                },
                {
                    id: 1002,
                    userId: 'shen_haoming',
                    username: '沈皓明',
                    avatar: '陈伟霆.jpg',
                    content: '工作再忙，也要记得照顾好自己。',
                    timestamp: Date.now() - 5 * 60 * 60 * 1000,
                    likes: [],
                    comments: []
                },
                {
                    id: 1003,
                    userId: 'fang_lei',
                    username: '方蕾',
                    avatar: '万鹏.jpg',
                    content: '刚看完剧本，这个角色的成长弧线设计得真好。',
                    timestamp: Date.now() - 8 * 60 * 60 * 1000,
                    likes: [],
                    comments: []
                }
            ];
        }
        
        // 保存初始数据
        this.saveMoments();
    }
    
    bindEvents() {
        // 打开侧边栏
        if (this.openBtn) {
            this.openBtn.addEventListener('click', () => this.toggleSidebar());
        }
        
        // 关闭侧边栏
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.closeSidebar());
        }
        
        // 发布按钮
        if (this.publishBtn) {
            this.publishBtn.addEventListener('click', () => this.openPublishModal());
        }
        
        // 发布弹窗关闭
        const publishModalClose = document.getElementById('publishModalClose');
        const publishCancelBtn = document.getElementById('publishCancelBtn');
        
        if (publishModalClose) {
            publishModalClose.addEventListener('click', () => this.closePublishModal());
        }
        
        if (publishCancelBtn) {
            publishCancelBtn.addEventListener('click', () => this.closePublishModal());
        }
        
        // 点击弹窗外部关闭
        if (this.publishModal) {
            this.publishModal.addEventListener('click', (e) => {
                if (e.target === this.publishModal) {
                    this.closePublishModal();
                }
            });
        }
        
        // 输入框字数统计
        if (this.publishTextarea) {
            this.publishTextarea.addEventListener('input', () => this.updateCharCount());
        }
        
        // 发布提交
        if (this.publishSubmitBtn) {
            this.publishSubmitBtn.addEventListener('click', () => this.submitPost());
        }
        
        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.publishModal && this.publishModal.classList.contains('show')) {
                    this.closePublishModal();
                } else if (this.isOpen) {
                    this.closeSidebar();
                }
            }
        });
        
        // 移动端触摸滑动关闭
        this.setupTouchGestures();
        
        // 动态列表事件委托
        this.setupMomentsListEvents();
    }
    
    setupMomentsListEvents() {
        if (!this.momentsList) return;
        
        // 使用事件委托处理所有动态列表的交互
        this.momentsList.addEventListener('click', (e) => {
            const target = e.target;
            
            // 展开/收起内容
            if (target.classList.contains('moment-expand-btn')) {
                const momentId = target.dataset.momentId;
                const content = this.momentsList.querySelector(`.moment-content[data-moment-id="${momentId}"]`);
                if (content) {
                    content.classList.toggle('collapsed');
                    target.textContent = content.classList.contains('collapsed') ? '展开' : '收起';
                }
            }
            
            // 菜单按钮
            if (target.classList.contains('moment-menu-btn')) {
                const momentId = target.dataset.momentId;
                this.showActionMenu(target, momentId);
            }
            
            // 点赞区域
            if (target.closest('.moment-likes')) {
                const momentId = target.closest('.moment-likes').dataset.momentId;
                this.toggleLike(momentId);
            }
        });
        
        // 评论输入框事件
        this.momentsList.addEventListener('input', (e) => {
            if (e.target.classList.contains('comment-input')) {
                const submitBtn = e.target.nextElementSibling;
                if (submitBtn) {
                    submitBtn.disabled = e.target.value.trim().length === 0;
                }
            }
        });
        
        // 评论提交
        this.momentsList.addEventListener('click', (e) => {
            if (e.target.classList.contains('comment-submit-btn')) {
                const input = e.target.previousElementSibling;
                const momentId = e.target.closest('.moment-comment-input').dataset.momentId;
                const replyTo = input.dataset.replyTo || null;
                this.submitComment(momentId, input.value.trim(), replyTo);
                input.value = '';
                input.dataset.replyTo = '';
                input.placeholder = '写评论...';
                e.target.disabled = true;
            }
            
            // 回复按钮点击事件
            if (e.target.classList.contains('comment-reply-btn')) {
                const momentId = e.target.dataset.momentId;
                const replyTo = e.target.dataset.replyTo;
                this.showCommentInputWithReply(momentId, replyTo);
            }
            
            // 删除动态按钮
            if (e.target.classList.contains('moment-delete-btn')) {
                const momentId = e.target.dataset.momentId;
                this.deleteMoment(momentId);
            }
            
            // 删除评论按钮
            if (e.target.classList.contains('comment-delete-btn')) {
                const momentId = e.target.dataset.momentId;
                const commentIndex = parseInt(e.target.dataset.commentIndex);
                this.deleteComment(momentId, commentIndex);
            }
        });
    }
    
    showActionMenu(button, momentId) {
        // 创建或显示操作菜单
        let menu = document.querySelector('.moment-action-menu');
        
        if (!menu) {
            menu = document.createElement('div');
            menu.className = 'moment-action-menu';
            document.body.appendChild(menu);
        }
        
        const moment = this.moments.find(m => m.id == momentId);
        const isLiked = moment && moment.likes.some(like => like.userId === 'user');
        
        menu.innerHTML = `
            <div class="action-menu-item ${isLiked ? 'liked' : ''}" data-action="like" data-moment-id="${momentId}">
                <span>${isLiked ? '❤️' : '🤍'}</span> ${isLiked ? '取消赞' : '点赞'}
            </div>
            <div class="action-menu-item" data-action="comment" data-moment-id="${momentId}">
                <span>💬</span> 回复
            </div>
        `;
        
        // 定位菜单
        const rect = button.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = (rect.bottom + 5) + 'px';
        menu.style.left = (rect.left - 100) + 'px';
        menu.classList.add('show');
        
        // 点击菜单项
        const handleMenuClick = (e) => {
            const item = e.target.closest('.action-menu-item');
            if (!item) return;
            
            const action = item.dataset.action;
            const id = item.dataset.momentId;
            
            if (action === 'like') {
                this.toggleLike(id);
            } else if (action === 'comment') {
                this.showCommentInput(id);
            }
            
            menu.classList.remove('show');
            document.removeEventListener('click', handleMenuClick);
        };
        
        // 延迟添加事件，避免立即触发
        setTimeout(() => {
            document.addEventListener('click', handleMenuClick);
        }, 100);
        
        // 点击外部关闭
        const handleOutsideClick = (e) => {
            if (!menu.contains(e.target) && e.target !== button) {
                menu.classList.remove('show');
                document.removeEventListener('click', handleOutsideClick);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', handleOutsideClick);
        }, 100);
    }
    
    toggleLike(momentId) {
        const moment = this.moments.find(m => m.id == momentId);
        if (!moment) return;
        
        const userLikeIndex = moment.likes.findIndex(like => like.userId === 'user');
        
        if (userLikeIndex >= 0) {
            // 取消点赞
            moment.likes.splice(userLikeIndex, 1);
        } else {
            // 添加点赞
            moment.likes.push({
                userId: 'user',
                username: '我'
            });
        }
        
        // 重新渲染
        this.renderMoments();
        
        // 保存
        this.saveMoments();
    }
    
    showCommentInput(momentId) {
        const commentInput = this.momentsList.querySelector(`.moment-comment-input[data-moment-id="${momentId}"]`);
        if (commentInput) {
            commentInput.classList.add('show');
            const input = commentInput.querySelector('.comment-input');
            if (input) {
                input.focus();
            }
        }
    }
    
    submitComment(momentId, content, replyTo = null) {
        if (!content) return;
        
        const moment = this.moments.find(m => m.id == momentId);
        if (!moment) return;
        
        if (!moment.comments) {
            moment.comments = [];
        }
        
        // 添加评论
        moment.comments.push({
            userId: 'user',
            username: '我',
            content: content,
            replyTo: replyTo,
            timestamp: Date.now()
        });
        
        // 重新渲染
        this.renderMoments();
        
        // 保存
        this.saveMoments();
        
        // 触发AI回复
        this.triggerAIReply(momentId, moment.userId);
    }
    
    showCommentInputWithReply(momentId, replyTo) {
        const commentInput = this.momentsList.querySelector(`.moment-comment-input[data-moment-id="${momentId}"]`);
        if (commentInput) {
            commentInput.classList.add('show');
            const input = commentInput.querySelector('.comment-input');
            if (input) {
                input.dataset.replyTo = replyTo;
                input.placeholder = `回复 ${replyTo}...`;
                input.focus();
            }
        }
    }
    
    triggerAIReply(momentId, aiUserId) {
        // 延迟3-5秒后AI回复
        const delay = 3000 + Math.random() * 2000;
        
        setTimeout(() => {
            const moment = this.moments.find(m => m.id == momentId);
            if (!moment) return;
            
            const aiChar = this.aiCharacters[aiUserId];
            if (!aiChar) return;
            
            // 生成AI回复
            const templates = this.aiReplyTemplates[aiChar.personality] || ['谢谢你的评论'];
            const reply = templates[Math.floor(Math.random() * templates.length)];
            
            moment.comments.push({
                userId: aiUserId,
                username: aiChar.name,
                content: reply,
                replyTo: '我',
                timestamp: Date.now()
            });
            
            // 重新渲染
            this.renderMoments();
            
            // 保存
            this.saveMoments();
        }, delay);
    }
    
    toggleSidebar() {
        if (this.isOpen) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }
    
    openSidebar() {
        if (!this.sidebar) return;
        
        this.sidebar.classList.add('show');
        this.isOpen = true;
        
        // 不再缩放视频，侧边栏直接覆盖在视频上方
        
        console.log('AI朋友圈侧边栏已打开');
    }
    
    closeSidebar() {
        if (!this.sidebar) return;
        
        this.sidebar.classList.remove('show');
        this.isOpen = false;
        
        console.log('AI朋友圈侧边栏已关闭');
    }
    
    openPublishModal() {
        if (!this.publishModal) return;
        
        this.publishModal.classList.add('show');
        
        // 聚焦到输入框
        setTimeout(() => {
            if (this.publishTextarea) {
                this.publishTextarea.focus();
            }
        }, 100);
    }
    
    closePublishModal() {
        if (!this.publishModal) return;
        
        this.publishModal.classList.remove('show');
        
        // 清空输入
        if (this.publishTextarea) {
            this.publishTextarea.value = '';
            this.updateCharCount();
        }
    }
    
    updateCharCount() {
        if (!this.publishTextarea || !this.charCount || !this.publishSubmitBtn) return;
        
        const length = this.publishTextarea.value.length;
        this.charCount.textContent = length;
        
        // 更新发布按钮状态
        if (length > 0 && length <= 500) {
            this.publishSubmitBtn.disabled = false;
        } else {
            this.publishSubmitBtn.disabled = true;
        }
    }
    
    submitPost() {
        if (!this.publishTextarea) return;
        
        const content = this.publishTextarea.value.trim();
        
        if (!content) {
            alert('请输入内容');
            return;
        }
        
        if (content.length > 500) {
            alert('内容不能超过500字');
            return;
        }
        
        // 创建新动态
        const moment = {
            id: Date.now(),
            userId: 'user',
            username: '我',
            avatar: '', // 空字符串将使用占位符
            content: content,
            timestamp: Date.now(),
            likes: [],
            comments: []
        };
        
        // 添加到列表顶部
        this.moments.unshift(moment);
        
        // 重新渲染列表
        this.renderMoments();
        
        // 关闭弹窗
        this.closePublishModal();
        
        // 保存到本地存储
        this.saveMoments();
        
        console.log('发布成功:', moment);
        
        // 触发AI角色随机点赞/评论
        this.triggerRandomAIInteraction(moment.id);
    }
    
    triggerRandomAIInteraction(momentId) {
        // 10-30秒后随机触发AI互动
        const delay = 10000 + Math.random() * 20000;
        
        setTimeout(() => {
            const moment = this.moments.find(m => m.id == momentId);
            if (!moment) return;
            
            // 随机选择AI角色
            const aiIds = Object.keys(this.aiCharacters);
            const randomAiId = aiIds[Math.floor(Math.random() * aiIds.length)];
            const aiChar = this.aiCharacters[randomAiId];
            
            // 50%概率点赞，50%概率评论
            if (Math.random() > 0.5) {
                // 点赞
                if (!moment.likes.some(like => like.userId === randomAiId)) {
                    moment.likes.push({
                        userId: randomAiId,
                        username: aiChar.name
                    });
                }
            } else {
                // 评论
                const templates = this.aiReplyTemplates[aiChar.personality] || ['很棒的分享'];
                const reply = templates[Math.floor(Math.random() * templates.length)];
                
                if (!moment.comments) {
                    moment.comments = [];
                }
                
                moment.comments.push({
                    userId: randomAiId,
                    username: aiChar.name,
                    content: reply,
                    timestamp: Date.now()
                });
            }
            
            // 重新渲染
            this.renderMoments();
            
            // 保存
            this.saveMoments();
        }, delay);
    }
    
    renderMoments() {
        if (!this.momentsList) return;
        
        // 清空列表
        this.momentsList.innerHTML = '';
        
        // 渲染每条动态
        this.moments.forEach(moment => {
            const card = this.createMomentCard(moment);
            this.momentsList.appendChild(card);
        });
    }
    
    createMomentCard(moment) {
        const card = document.createElement('div');
        card.className = 'moment-card';
        card.dataset.momentId = moment.id;
        
        // 格式化时间
        const timeStr = this.formatTime(moment.timestamp);
        
        // 判断内容是否需要展开按钮
        const needExpand = moment.content.length > 150;
        
        // 生成头像HTML
        const avatarHtml = this.getAvatarHtml(moment.avatar, moment.username);
        
        // 判断是否是用户发布的动态
        const isUserMoment = moment.userId === 'user';
        
        card.innerHTML = `
            <div class="moment-header">
                ${avatarHtml}
                <div class="moment-user-info">
                    <div class="moment-username">${moment.username}</div>
                    <div class="moment-time">${timeStr}</div>
                </div>
                <div class="moment-header-actions">
                    ${isUserMoment ? `<button class="moment-delete-btn" data-moment-id="${moment.id}" title="删除动态">🗑️</button>` : ''}
                    <button class="moment-menu-btn" data-moment-id="${moment.id}">⋯</button>
                </div>
            </div>
            <div class="moment-content ${needExpand ? 'collapsed' : ''}" data-moment-id="${moment.id}">
                ${this.escapeHtml(moment.content)}
            </div>
            ${needExpand ? `<button class="moment-expand-btn" data-moment-id="${moment.id}">展开</button>` : ''}
            <div class="moment-actions">
                ${moment.likes && moment.likes.length > 0 ? this.renderLikes(moment) : ''}
                ${moment.comments && moment.comments.length > 0 ? this.renderComments(moment) : ''}
                <div class="moment-comment-input" data-moment-id="${moment.id}">
                    <div class="comment-input-box">
                        <input type="text" class="comment-input" placeholder="写评论..." maxlength="200">
                        <button class="comment-submit-btn" disabled>发送</button>
                    </div>
                </div>
            </div>
        `;
        
        return card;
    }
    
    getAvatarHtml(avatar, username) {
        // 如果头像是图片文件，使用img标签
        if (avatar && avatar.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            return `<img src="${avatar}" alt="${username}" class="moment-avatar" onerror="this.outerHTML='<div class=\\'moment-avatar moment-avatar-placeholder\\'>${this.getInitial(username)}</div>'">`;
        }
        // 否则使用占位符
        return `<div class="moment-avatar moment-avatar-placeholder">${this.getInitial(username)}</div>`;
    }
    
    getInitial(username) {
        // 获取用户名首字符
        if (!username) return '?';
        return username.charAt(0).toUpperCase();
    }
    
    renderLikes(moment) {
        const likesList = moment.likes.map(like => like.username).join('、');
        return `
            <div class="moment-likes" data-moment-id="${moment.id}">
                <span class="moment-likes-icon">❤️</span>
                <span class="moment-likes-text">${likesList}</span>
                <span class="moment-likes-count">${moment.likes.length}人</span>
            </div>
        `;
    }
    
    renderComments(moment) {
        let html = '<div class="moment-comments">';
        
        moment.comments.forEach((comment, index) => {
            const timeStr = this.formatTime(comment.timestamp);
            const isUserComment = comment.userId === 'user';
            
            html += `
                <div class="moment-comment" data-comment-index="${index}">
                    <div class="comment-main">
                        <div>
                            <span class="comment-user">${comment.username}</span>
                            ${comment.replyTo ? `<span class="comment-content"> 回复 <span class="comment-user">${comment.replyTo}</span></span>` : ''}
                            <span class="comment-content">: ${this.escapeHtml(comment.content)}</span>
                        </div>
                        <div class="comment-footer">
                            <span class="comment-time">${timeStr}</span>
                            <button class="comment-reply-btn" data-moment-id="${moment.id}" data-comment-index="${index}" data-reply-to="${comment.username}">回复</button>
                            ${isUserComment ? `<button class="comment-delete-btn" data-moment-id="${moment.id}" data-comment-index="${index}" title="删除评论">删除</button>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    formatTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const minute = 60 * 1000;
        const hour = 60 * minute;
        const day = 24 * hour;
        
        if (diff < minute) {
            return '刚刚';
        } else if (diff < hour) {
            return `${Math.floor(diff / minute)}分钟前`;
        } else if (diff < day) {
            return `${Math.floor(diff / hour)}小时前`;
        } else if (diff < 2 * day) {
            return '昨天';
        } else if (diff < 7 * day) {
            return `${Math.floor(diff / day)}天前`;
        } else {
            const date = new Date(timestamp);
            return `${date.getMonth() + 1}月${date.getDate()}日`;
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    saveMoments() {
        try {
            localStorage.setItem('ai_moments', JSON.stringify(this.moments));
        } catch (e) {
            console.error('保存动态失败:', e);
        }
    }
    
    loadMoments() {
        try {
            const data = localStorage.getItem('ai_moments');
            if (data) {
                this.moments = JSON.parse(data);
            }
        } catch (e) {
            console.error('加载动态失败:', e);
            this.moments = [];
        }
    }
    
    setupTouchGestures() {
        if (!this.sidebar) return;
        
        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        
        this.sidebar.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
        });
        
        this.sidebar.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            currentX = e.touches[0].clientX;
            const diff = currentX - startX;
            
            // 只允许向右滑动
            if (diff > 0) {
                this.sidebar.style.transform = `translateX(${diff}px)`;
            }
        });
        
        this.sidebar.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            
            const diff = currentX - startX;
            
            // 如果滑动超过100px，关闭侧边栏
            if (diff > 100) {
                this.closeSidebar();
            }
            
            // 重置样式
            this.sidebar.style.transform = '';
            isDragging = false;
        });
    }
    
    deleteMoment(momentId) {
        // 确认删除
        if (!confirm('确定要删除这条动态吗？删除后将无法恢复，该动态下的所有点赞和评论也会被清除。')) {
            return;
        }
        
        // 查找动态索引
        const momentIndex = this.moments.findIndex(m => m.id == momentId);
        
        if (momentIndex === -1) {
            console.error('未找到要删除的动态');
            return;
        }
        
        const moment = this.moments[momentIndex];
        
        // 只允许删除用户自己发布的动态
        if (moment.userId !== 'user') {
            alert('只能删除自己发布的动态');
            return;
        }
        
        // 从数组中删除
        this.moments.splice(momentIndex, 1);
        
        // 重新渲染
        this.renderMoments();
        
        // 保存到本地存储
        this.saveMoments();
        
        console.log('动态已删除:', momentId);
    }
    
    deleteComment(momentId, commentIndex) {
        // 查找动态
        const moment = this.moments.find(m => m.id == momentId);
        
        if (!moment || !moment.comments || !moment.comments[commentIndex]) {
            console.error('未找到要删除的评论');
            return;
        }
        
        const comment = moment.comments[commentIndex];
        
        // 只允许删除用户自己发表的评论
        if (comment.userId !== 'user') {
            alert('只能删除自己发表的评论');
            return;
        }
        
        // 统计有多少条回复会被删除
        const commentUsername = comment.username;
        const repliesToDelete = moment.comments.filter(c => c.replyTo === commentUsername).length;
        
        // 确认删除（提示会同步删除回复）
        let confirmMessage = '确定要删除这条评论吗？删除后将无法恢复。';
        if (repliesToDelete > 0) {
            confirmMessage = `确定要删除这条评论吗？删除后将无法恢复，同时会删除${repliesToDelete}条对此评论的回复。`;
        }
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        // 删除该评论
        moment.comments.splice(commentIndex, 1);
        
        // 删除所有回复该评论的内容
        moment.comments = moment.comments.filter(c => c.replyTo !== commentUsername);
        
        // 重新渲染
        this.renderMoments();
        
        // 保存到本地存储
        this.saveMoments();
        
        console.log('评论已删除:', commentIndex, '同时删除了', repliesToDelete, '条回复');
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIMomentsManager;
}
