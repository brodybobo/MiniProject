// 视频播放器实例
let player;
let currentEpisode = 1;
const totalEpisodes = 32;

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    // 初始化视频播放器
    initVideoPlayer();

    // 生成集数列表
    generateEpisodes();

    // 设置文件上传监听
    setupFileUpload();

    // 初始化弹窗控制
    initPopupControls();
});

// 初始化视频播放器
function initVideoPlayer() {
    player = videojs('my-video', {
        controls: false, // 禁用默认控制栏
        autoplay: false,
        preload: 'auto',
        fluid: true,
        language: 'zh-CN',
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        bigPlayButton: false, // 禁用大播放按钮
        textTrackDisplay: false, // 禁用字幕显示
        loadingSpinner: false, // 禁用加载动画
        userActions: {
            hotkeys: true,
            click: true // 启用点击控制
        }
    });

    // 播放器事件监听
    player.on('loadedmetadata', function() {
        console.log('视频元数据加载完成');
        hideUploadHint();
        updateTimeDisplay();
    });

    player.on('timeupdate', function() {
        updateProgress();
        updateTimeDisplay();
    });

    player.on('play', function() {
        console.log('视频开始播放');
        updatePlayButton(false);
    });

    player.on('pause', function() {
        console.log('视频暂停');
        updatePlayButton(true);
    });

    player.on('ended', function() {
        console.log('视频播放结束');
        updatePlayButton(true);
        // 自动播放下一集
        playNextEpisode();
    });

    player.on('error', function(e) {
        console.error('播放器错误:', e);
    });

    // 添加点击视频播放/暂停功能
    player.on('ready', function() {
        console.log('播放器准备就绪');

        // 只使用一个监听器，在最底层的video元素上监听，并阻止冒泡
        const videoEl = document.querySelector('#my-video_html5_api');
        if (videoEl) {
            console.log('找到video元素，添加点击监听');
            videoEl.addEventListener('click', function(e) {
                console.log('=== Video被点击 ===');

                // 阻止事件冒泡，防止触发多次
                e.stopPropagation();

                // 排除点击控制栏的情况
                if (e.target.closest('.custom-controls')) {
                    console.log('点击的是控制栏，忽略');
                    return;
                }

                // 切换播放/暂停
                if (player.paused()) {
                    console.log('点击播放');
                    player.play();
                } else {
                    console.log('点击暂停');
                    player.pause();
                }
            }, true); // 使用捕获阶段，确保最先执行
        }
    });

    // 初始化自定义控制栏
    initCustomControls();
}

// 初始化自定义控制栏
function initCustomControls() {
    const playBtn = document.getElementById('playBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const customControls = document.getElementById('customControls');
    const progressBar = document.querySelector('.progress-bar');
    const nextBtn = document.querySelector('.next-btn');

    console.log('初始化自定义控制栏');
    console.log('playBtn:', playBtn);
    console.log('player对象:', player);

    // 播放/暂停按钮
    if (playBtn) {
        // 移除可能存在的旧监听器，添加新的
        const newPlayBtn = playBtn.cloneNode(true);
        playBtn.parentNode.replaceChild(newPlayBtn, playBtn);

        newPlayBtn.addEventListener('click', function(e) {
            console.log('播放按钮被点击！');
            e.preventDefault();
            e.stopPropagation();

            if (!player) {
                console.error('Player对象不存在！');
                return;
            }

            if (player.paused()) {
                console.log('当前暂停，准备播放');
                player.play().then(() => {
                    console.log('播放成功');
                }).catch(err => {
                    console.error('播放失败:', err);
                });
            } else {
                console.log('当前播放中，准备暂停');
                player.pause();
                console.log('暂停成功');
            }
        });
        console.log('播放按钮事件监听已添加');
    } else {
        console.error('找不到播放按钮元素！');
    }

    // 全屏按钮
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', function() {
            if (player.isFullscreen()) {
                player.exitFullscreen();
            } else {
                player.requestFullscreen();
            }
        });
    }

    // 下一集按钮
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            playNextEpisode();
        });
    }

    // 进度条点击
    if (progressBar) {
        progressBar.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            const time = percent * player.duration();
            player.currentTime(time);
        });
    }

    // 鼠标移动时显示控制栏
    const videoContainer = document.querySelector('.video-container');
    let hideControlsTimer;

    videoContainer.addEventListener('mousemove', function() {
        customControls.classList.add('visible');
        clearTimeout(hideControlsTimer);

        if (!player.paused()) {
            hideControlsTimer = setTimeout(function() {
                customControls.classList.remove('visible');
            }, 3000);
        }
    });

    videoContainer.addEventListener('mouseleave', function() {
        if (!player.paused()) {
            customControls.classList.remove('visible');
        }
    });
}

// 更新播放按钮状态
function updatePlayButton(isPaused) {
    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
        playBtn.querySelector('span').textContent = isPaused ? '▶' : '❚❚';
    }
}

// 更新进度条
function updateProgress() {
    const progressPlayed = document.getElementById('progressPlayed');
    if (progressPlayed && player.duration()) {
        const percent = (player.currentTime() / player.duration()) * 100;
        progressPlayed.style.width = percent + '%';
    }
}

// 更新时间显示
function updateTimeDisplay() {
    const currentTimeEl = document.getElementById('currentTime');
    const totalTimeEl = document.getElementById('totalTime');

    if (currentTimeEl && totalTimeEl) {
        currentTimeEl.textContent = formatTime(player.currentTime());
        totalTimeEl.textContent = formatTime(player.duration());
    }
}

// 格式化时间
function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 生成集数列表
function generateEpisodes(start = 1, end = 30) {
    const episodesGrid = document.getElementById('episodesGrid');
    episodesGrid.innerHTML = '';

    for (let i = start; i <= end; i++) {
        const episodeItem = document.createElement('div');
        episodeItem.className = 'episode-item';

        // 第3集及以后的集数显示VIP标签
        if (i >= 3) {
            episodeItem.classList.add('vip');
        }

        episodeItem.textContent = i < 10 ? `0${i}` : `${i}`;
        episodeItem.dataset.episode = i;

        // 设置当前集为激活状态
        if (i === currentEpisode) {
            episodeItem.classList.add('active');
        }

        // 添加点击事件
        episodeItem.addEventListener('click', function() {
            switchEpisode(i);
        });

        episodesGrid.appendChild(episodeItem);
    }
}

// 切换集数
function switchEpisode(episodeNumber) {
    if (episodeNumber === currentEpisode) {
        return;
    }

    currentEpisode = episodeNumber;

    // 更新标题
    const videoTitle = document.querySelector('.video-title h1');
    const episodeText = episodeNumber < 10 ? `0${episodeNumber}` : `${episodeNumber}`;
    videoTitle.textContent = `许我耀眼 第${episodeText}集`;

    // 更新激活状态
    const allEpisodes = document.querySelectorAll('.episode-item');
    allEpisodes.forEach(item => {
        if (parseInt(item.dataset.episode) === episodeNumber) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // 实际项目中，这里应该加载对应集数的视频
    // 由于我们是本地播放，所以需要用户重新选择文件
    console.log(`切换到第 ${episodeNumber} 集`);

    // 如果当前有视频正在播放，可以选择暂停
    if (player && !player.paused()) {
        player.pause();
    }
}

// 播放下一集
function playNextEpisode() {
    if (currentEpisode < totalEpisodes) {
        switchEpisode(currentEpisode + 1);
    } else {
        console.log('已经是最后一集了');
    }
}

// 设置文件上传
function setupFileUpload() {
    const fileInput = document.getElementById('videoFileInput');

    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];

        if (file && file.type.startsWith('video/')) {
            loadVideoFile(file);
        } else {
            alert('请选择有效的视频文件！');
        }
    });
}

// 加载视频文件
function loadVideoFile(file) {
    // 创建本地URL
    const videoURL = URL.createObjectURL(file);

    // 设置视频源
    player.src({
        type: file.type,
        src: videoURL
    });

    // 加载并播放
    player.load();

    // 隐藏上传提示
    hideUploadHint();

    console.log('视频文件加载成功:', file.name);
}

// 隐藏上传提示
function hideUploadHint() {
    const uploadHint = document.getElementById('uploadHint');
    if (uploadHint) {
        uploadHint.classList.add('hidden');
    }
}

// 显示上传提示
function showUploadHint() {
    const uploadHint = document.getElementById('uploadHint');
    if (uploadHint) {
        uploadHint.classList.remove('hidden');
    }
}

// 标签页切换功能
const tabBtns = document.querySelectorAll('.tab-btn');
tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        // 移除所有active类
        tabBtns.forEach(b => b.classList.remove('active'));
        // 添加active类到当前按钮
        this.classList.add('active');

        const tabText = this.textContent.trim();
        console.log('切换标签:', tabText);

        // 根据标签切换集数显示范围
        if (tabText === '1-30') {
            generateEpisodes(1, 30);
        } else if (tabText === '31-32') {
            generateEpisodes(31, 32);
        }
    });
});

// 推荐视频点击事件
const recommendItems = document.querySelectorAll('.recommend-item');
recommendItems.forEach(item => {
    item.addEventListener('click', function() {
        const title = this.querySelector('h4').textContent;
        console.log('点击推荐视频:', title);
        // 实际项目中这里应该跳转到对应视频页面
        alert(`即将播放: ${title}`);
    });
});

// 操作按钮事件
const actionBtns = document.querySelectorAll('.action-btn');
actionBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        const action = this.textContent.trim();
        console.log('点击操作按钮:', action);

        if (action.includes('追剧')) {
            alert('已加入追剧列表！');
        } else if (action.includes('提醒')) {
            alert('已设置更新提醒！');
        } else if (action.includes('分享')) {
            alert('分享功能开发中...');
        }
    });
});

// 搜索功能
const searchInput = document.querySelector('.search-input');
const searchBtn = document.querySelector('.search-btn');

searchBtn.addEventListener('click', function() {
    const keyword = searchInput.value.trim();
    if (keyword) {
        console.log('搜索:', keyword);
        alert(`搜索功能开发中...\n搜索关键词: ${keyword}`);
    }
});

searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

// 键盘快捷键
document.addEventListener('keydown', function(e) {
    // 空格键：播放/暂停
    if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        if (player.paused()) {
            player.play();
        } else {
            player.pause();
        }
    }

    // 左右箭头：快退/快进
    if (e.code === 'ArrowLeft') {
        player.currentTime(Math.max(0, player.currentTime() - 5));
    }
    if (e.code === 'ArrowRight') {
        player.currentTime(Math.min(player.duration(), player.currentTime() + 5));
    }

    // 上下箭头：音量调节
    if (e.code === 'ArrowUp') {
        e.preventDefault();
        player.volume(Math.min(1, player.volume() + 0.1));
    }
    if (e.code === 'ArrowDown') {
        e.preventDefault();
        player.volume(Math.max(0, player.volume() - 0.1));
    }

    // F键：全屏
    if (e.code === 'KeyF') {
        if (player.isFullscreen()) {
            player.exitFullscreen();
        } else {
            player.requestFullscreen();
        }
    }
});

// 拖拽上传功能
const videoContainer = document.querySelector('.video-container');

videoContainer.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.stopPropagation();
    this.style.borderColor = '#ff6b00';
});

videoContainer.addEventListener('dragleave', function(e) {
    e.preventDefault();
    e.stopPropagation();
    this.style.borderColor = 'transparent';
});

videoContainer.addEventListener('drop', function(e) {
    e.preventDefault();
    e.stopPropagation();
    this.style.borderColor = 'transparent';

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('video/')) {
        loadVideoFile(files[0]);
    } else {
        alert('请拖放视频文件！');
    }
});

// 页面卸载时清理资源
window.addEventListener('beforeunload', function() {
    if (player) {
        player.dispose();
    }
});

// ==================== AI朋友圈功能（后端API集成）====================

// 初始化AI朋友圈
function initAIMoments() {
    console.log('初始化AI朋友圈功能...');

    // AI朋友圈功能已集成到页面中，通过后端API加载数据
    const aiMomentsBtn = document.getElementById('aiMomentsBtn');
    const aiMomentsSidebar = document.getElementById('aiMomentsSidebar');
    const momentsCloseBtn = document.getElementById('momentsCloseBtn');
    const momentsPublishBtn = document.getElementById('momentsPublishBtn');
    const publishCardTrigger = document.getElementById('publishCardTrigger');
    const momentsRefreshBtn = document.getElementById('momentsRefreshBtn');
    const momentsCameraBtn = document.getElementById('momentsCameraBtn');
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationsPanel = document.getElementById('notificationsPanel');
    const notificationsBackBtn = document.getElementById('notificationsBackBtn');
    const publishModal = document.getElementById('publishModal');
    const publishModalClose = document.getElementById('publishModalClose');
    const publishCancelBtn = document.getElementById('publishCancelBtn');
    const publishSubmitBtn = document.getElementById('publishSubmitBtn');
    const publishTextarea = document.getElementById('publishTextarea');
    const charCount = document.getElementById('charCount');

    // API配置
    const API_BASE = 'http://localhost:3000/api';
    let moments = [];
    let autoRefreshInterval = null;

    // 打开AI朋友圈侧边栏
    if (aiMomentsBtn) {
        aiMomentsBtn.addEventListener('click', function() {
            aiMomentsSidebar.classList.add('show');
            loadMoments();
            startAutoRefresh();
        });
    }

    // 关闭AI朋友圈侧边栏
    if (momentsCloseBtn) {
        momentsCloseBtn.addEventListener('click', function() {
            aiMomentsSidebar.classList.remove('show');
            stopAutoRefresh();
        });
    }

    // 通知按钮
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function() {
            notificationsPanel.classList.add('show');
            loadNotifications();
        });
    }

    // 通知返回按钮
    if (notificationsBackBtn) {
        notificationsBackBtn.addEventListener('click', function() {
            notificationsPanel.classList.remove('show');
        });
    }

    // 刷新按钮
    if (momentsRefreshBtn) {
        momentsRefreshBtn.addEventListener('click', function() {
            loadMoments();
            showToast('刷新成功');
        });
    }

    // 相机按钮（短按发布，长按未实现）
    if (momentsCameraBtn) {
        let pressTimer = null;

        momentsCameraBtn.addEventListener('mousedown', function() {
            pressTimer = setTimeout(() => {
                // 长按：进入文字发布页（当前弹窗实现）
                publishModal.classList.add('show');
                publishTextarea.value = '';
                charCount.textContent = '0';
                publishSubmitBtn.disabled = true;
            }, 500);
        });

        momentsCameraBtn.addEventListener('mouseup', function() {
            clearTimeout(pressTimer);
        });

        momentsCameraBtn.addEventListener('mouseleave', function() {
            clearTimeout(pressTimer);
        });

        momentsCameraBtn.addEventListener('click', function() {
            // 短按：打开发布弹窗
            publishModal.classList.add('show');
            publishTextarea.value = '';
            charCount.textContent = '0';
            publishSubmitBtn.disabled = true;
        });
    }

    // 打开发布弹窗
    if (momentsPublishBtn) {
        momentsPublishBtn.addEventListener('click', function() {
            publishModal.classList.add('show');
            publishTextarea.value = '';
            charCount.textContent = '0';
            publishSubmitBtn.disabled = true;
        });
    }

    // 发布入口卡片点击
    if (publishCardTrigger) {
        publishCardTrigger.addEventListener('click', function() {
            publishModal.classList.add('show');
            publishTextarea.value = '';
            charCount.textContent = '0';
            publishSubmitBtn.disabled = true;
        });
    }

    // 关闭发布弹窗
    if (publishModalClose) {
        publishModalClose.addEventListener('click', function() {
            publishModal.classList.remove('show');
        });
    }

    if (publishCancelBtn) {
        publishCancelBtn.addEventListener('click', function() {
            publishModal.classList.remove('show');
        });
    }

    // 文本输入监听
    if (publishTextarea) {
        publishTextarea.addEventListener('input', function() {
            const length = this.value.length;
            charCount.textContent = length;
            publishSubmitBtn.disabled = length === 0;
        });
    }

    // 发布动态
    if (publishSubmitBtn) {
        publishSubmitBtn.addEventListener('click', async function() {
            const content = publishTextarea.value.trim();
            if (!content) return;

            try {
                console.log('📝 发布动态:', content);
                const response = await fetch(`${API_BASE}/moments`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        userId: 'user',
                        username: '我',
                        content: content
                    })
                });

                if (response.ok) {
                    console.log('✅ 发布成功');
                    publishModal.classList.remove('show');
                    showToast('发布成功！AI将在10-30秒内互动');
                    loadMoments();
                } else {
                    console.error('❌ 发布失败，状态码:', response.status);
                    showToast('发布失败，请重试');
                }
            } catch (error) {
                console.error('❌ 发布失败:', error);
                showToast('发布失败，请检查网络连接');
            }
        });
    }

    // 加载动态列表
    async function loadMoments() {
        try {
            const response = await fetch(`${API_BASE}/moments`);
            if (response.ok) {
                const result = await response.json();
                // 后端返回格式：{success: true, data: [...]}
                moments = result.data || result;
                console.log('✅ 加载动态成功，共', moments.length, '条');
                renderMoments();
            }
        } catch (error) {
            console.error('❌ 加载动态失败:', error);
        }
    }

    // 渲染动态列表
    function renderMoments() {
        const momentsList = document.getElementById('momentsList');
        if (!momentsList) return;

        momentsList.innerHTML = moments.map(moment => {
            const isAI = moment.userId && moment.userId.startsWith('ai-');
            const userLiked = moment.likes && moment.likes.some(like => like.userId === 'user');
            const likesText = moment.likes && moment.likes.length > 0
                ? moment.likes.map(l => l.username).join('、')
                : '';

            return `
            <div class="moment-card" data-id="${moment.id}">
                <div class="moment-header">
                    <div class="moment-avatar moment-avatar-placeholder ${isAI ? 'ai-star' : ''}">${moment.username.charAt(0)}</div>
                    <div class="moment-user-info">
                        <div class="moment-user-row">
                            <span class="moment-username">${moment.username}</span>
                            ${isAI ? '<span class="ai-star-tag">AI明星</span>' : ''}
                        </div>
                        <div class="moment-meta-row">
                            <span class="moment-time">${formatTime(moment.timestamp)}</span>
                            ${isAI ? '<span class="official-badge">⭐ 官方推荐</span>' : ''}
                        </div>
                    </div>
                    ${moment.userId === 'user' ? `
                        <div class="moment-header-actions">
                            <button class="moment-delete-btn" data-id="${moment.id}" title="删除">🗑️</button>
                        </div>
                    ` : ''}
                </div>
                <div class="moment-content">${moment.content}</div>
                <div class="moment-footer">
                    <div class="moment-action-bubble" id="bubble-${moment.id}">
                        <button class="bubble-action ${userLiked ? 'liked' : ''}" data-action="like" data-id="${moment.id}">
                            <span class="bubble-icon">${userLiked ? '❤️' : '🤍'}</span>
                            <span>${userLiked ? '取消' : '赞'}</span>
                        </button>
                        <div class="bubble-divider"></div>
                        <button class="bubble-action" data-action="comment" data-id="${moment.id}">
                            <span class="bubble-icon">💬</span>
                            <span>评论</span>
                        </button>
                    </div>
                    <button class="moment-more-btn" data-id="${moment.id}">··</button>
                </div>
                ${moment.likes && moment.likes.length > 0 ? `
                    <div class="moment-actions">
                        <div class="moment-likes">
                            <span class="moment-likes-icon">❤️</span>
                            <span class="moment-likes-text">${likesText}</span>
                        </div>
                    </div>
                ` : ''}
                ${moment.comments && moment.comments.length > 0 ? `
                    <div class="moment-comments">
                        ${moment.comments.map(comment => `
                            <div class="moment-comment">
                                <div class="comment-main">
                                    <span class="comment-user">${comment.username}${comment.replyTo ? `<span class="comment-reply-to"> 回复 ${comment.replyTo}</span>` : ''}</span>
                                    <span class="comment-content">${comment.content}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                <div class="moment-comment-input" id="comment-input-${moment.id}">
                    <div class="comment-input-box">
                        <input type="text" class="comment-input" placeholder="说点什么..." data-id="${moment.id}">
                        <button class="comment-submit-btn" data-id="${moment.id}">发送</button>
                    </div>
                </div>
            </div>
        `}).join('');

        // 绑定事件
        bindMomentEvents();
    }

    // 绑定动态事件
    function bindMomentEvents() {
        // 更多按钮（显示气泡）
        document.querySelectorAll('.moment-more-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const momentId = this.dataset.id;
                const bubble = document.getElementById(`bubble-${momentId}`);

                // 关闭其他气泡
                document.querySelectorAll('.moment-action-bubble.show').forEach(b => {
                    if (b !== bubble) b.classList.remove('show');
                });

                bubble.classList.toggle('show');
            });
        });

        // 气泡内的操作
        document.querySelectorAll('.bubble-action').forEach(btn => {
            btn.addEventListener('click', async function(e) {
                e.stopPropagation();
                const action = this.dataset.action;
                const momentId = this.dataset.id;
                const bubble = document.getElementById(`bubble-${momentId}`);

                if (action === 'like') {
                    await toggleLike(momentId);
                } else if (action === 'comment') {
                    const commentInput = document.getElementById(`comment-input-${momentId}`);
                    commentInput.classList.toggle('show');
                    if (commentInput.classList.contains('show')) {
                        commentInput.querySelector('.comment-input').focus();
                    }
                }

                bubble.classList.remove('show');
            });
        });

        // 点击外部关闭气泡
        document.addEventListener('click', function() {
            document.querySelectorAll('.moment-action-bubble.show').forEach(b => {
                b.classList.remove('show');
            });
        });

        // 删除按钮
        document.querySelectorAll('.moment-delete-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const momentId = this.dataset.id;
                if (confirm('确定要删除这条动态吗？')) {
                    try {
                        const response = await fetch(`${API_BASE}/moments/${momentId}`, {
                            method: 'DELETE'
                        });
                        if (response.ok) {
                            showToast('删除成功');
                            loadMoments();
                        }
                    } catch (error) {
                        console.error('删除失败:', error);
                        showToast('删除失败');
                    }
                }
            });
        });

        // 发送评论按钮
        document.querySelectorAll('.comment-submit-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const momentId = this.dataset.id;
                const commentInput = document.getElementById(`comment-input-${momentId}`);
                const input = commentInput.querySelector('.comment-input');
                const content = input.value.trim();

                if (content) {
                    await submitComment(momentId, content);
                    input.value = '';
                    commentInput.classList.remove('show');
                }
            });
        });

        // 评论输入框回车发送
        document.querySelectorAll('.comment-input').forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    const btn = this.parentElement.querySelector('.comment-submit-btn');
                    btn.click();
                }
            });
        });
    }

    // 切换点赞
    async function toggleLike(momentId) {
        try {
            const response = await fetch(`${API_BASE}/moments/${momentId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: 'user',
                    username: '我'
                })
            });

            if (response.ok) {
                loadMoments();
            }
        } catch (error) {
            console.error('点赞失败:', error);
        }
    }

    // 提交评论
    async function submitComment(momentId, content) {
        try {
            console.log('📝 提交评论到动态', momentId, ':', content);
            const response = await fetch(`${API_BASE}/moments/${momentId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: 'user',
                    username: '我',
                    content: content
                })
            });

            if (response.ok) {
                console.log('✅ 评论成功');
                showToast('评论成功！AI将在3-8秒内回复');
                loadMoments();
            } else {
                console.error('❌ 评论失败，状态码:', response.status);
                showToast('评论失败，请重试');
            }
        } catch (error) {
            console.error('❌ 评论失败:', error);
            showToast('评论失败，请检查网络连接');
        }
    }

    // 格式化时间
    function formatTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 7) return `${days}天前`;

        const date = new Date(timestamp);
        return `${date.getMonth() + 1}-${date.getDate()}`;
    }

    // 加载通知列表
    async function loadNotifications() {
        try {
            // 从moments数据中生成通知
            const notifications = [];

            // 遍历所有动态，找出用户发布的动态
            moments.forEach(moment => {
                if (moment.userId === 'user') {
                    // 检查点赞通知
                    if (moment.likes && moment.likes.length > 0) {
                        moment.likes.forEach(like => {
                            if (like.userId !== 'user') {
                                notifications.push({
                                    id: `like-${moment.id}-${like.userId}`,
                                    type: 'like',
                                    user: like.username,
                                    userId: like.userId,
                                    action: '赞了你',
                                    momentContent: moment.content,
                                    timestamp: like.timestamp || moment.timestamp,
                                    momentId: moment.id
                                });
                            }
                        });
                    }

                    // 检查评论通知
                    if (moment.comments && moment.comments.length > 0) {
                        moment.comments.forEach(comment => {
                            if (comment.userId !== 'user') {
                                notifications.push({
                                    id: `comment-${moment.id}-${comment.userId}-${comment.timestamp}`,
                                    type: 'comment',
                                    user: comment.username,
                                    userId: comment.userId,
                                    action: `评论了你: ${comment.content}`,
                                    momentContent: moment.content,
                                    timestamp: comment.timestamp || moment.timestamp,
                                    momentId: moment.id
                                });
                            }
                        });
                    }
                }

                // 检查对用户评论的回复
                if (moment.comments && moment.comments.length > 0) {
                    moment.comments.forEach(comment => {
                        if (comment.replyTo === '我' && comment.userId !== 'user') {
                            notifications.push({
                                id: `reply-${moment.id}-${comment.userId}-${comment.timestamp}`,
                                type: 'reply',
                                user: comment.username,
                                userId: comment.userId,
                                action: `回复了你: ${comment.content}`,
                                momentContent: moment.content,
                                timestamp: comment.timestamp || moment.timestamp,
                                momentId: moment.id
                            });
                        }
                    });
                }
            });

            // 按时间倒序排序
            notifications.sort((a, b) => b.timestamp - a.timestamp);

            renderNotifications(notifications);
        } catch (error) {
            console.error('❌ 加载通知失败:', error);
        }
    }

    // 渲染通知列表
    function renderNotifications(notifications) {
        const notificationsList = document.getElementById('notificationsList');
        if (!notificationsList) return;

        if (notifications.length === 0) {
            notificationsList.innerHTML = `
                <div class="notification-empty">
                    <div class="notification-empty-icon">🔔</div>
                    <div>暂无互动消息</div>
                </div>
            `;
            return;
        }

        notificationsList.innerHTML = notifications.map(notif => {
            const isAI = notif.userId && notif.userId.startsWith('ai-');
            const actionText = notif.type === 'like' ? '赞了你' :
                              notif.type === 'comment' ? '评论了你' :
                              '回复了你';

            return `
                <div class="notification-item" data-moment-id="${notif.momentId}">
                    <div class="notification-avatar">${notif.user.charAt(0)}</div>
                    <div class="notification-content">
                        <div class="notification-user">${notif.user}</div>
                        <div class="notification-action">
                            ${notif.type === 'like' ? actionText :
                              `<span class="highlight">${actionText}</span> ${notif.action.includes(':') ? notif.action.split(':')[1].trim() : ''}`}
                        </div>
                        <div class="notification-time">${formatTime(notif.timestamp)}</div>
                        ${notif.momentContent ? `
                            <div class="notification-preview">
                                ${notif.momentContent.substring(0, 50)}${notif.momentContent.length > 50 ? '...' : ''}
                            </div>
                        ` : ''}
                    </div>
                    ${notif.thumbnail ? `<img src="${notif.thumbnail}" class="notification-thumbnail" />` : ''}
                </div>
            `;
        }).join('');

        // 绑定通知点击事件
        document.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', function() {
                const momentId = this.dataset.momentId;
                // 关闭通知面板，回到动态列表
                notificationsPanel.classList.remove('show');
                // 滚动到对应的动态
                setTimeout(() => {
                    const momentCard = document.querySelector(`.moment-card[data-id="${momentId}"]`);
                    if (momentCard) {
                        momentCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // 添加高亮效果
                        momentCard.style.backgroundColor = 'rgba(93, 95, 239, 0.1)';
                        setTimeout(() => {
                            momentCard.style.backgroundColor = '';
                        }, 2000);
                    }
                }, 300);
            });
        });
    }

    // 开始自动刷新
    function startAutoRefresh() {
        if (autoRefreshInterval) return;
        autoRefreshInterval = setInterval(() => {
            loadMoments();
        }, 5000); // 每5秒刷新一次
    }

    // 停止自动刷新
    function stopAutoRefresh() {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
            autoRefreshInterval = null;
        }
    }

    console.log('AI朋友圈功能初始化完成');
}

// 显示Toast提示
function showToast(message, duration = 3000) {
    // 移除已存在的Toast
    const existingToast = document.querySelector('.toast-message');
    if (existingToast) {
        existingToast.remove();
    }

    // 创建新的Toast
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #ff6b00;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 10001;
        animation: slideIn 0.3s ease-out;
    `;

    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(toast);

    // 自动隐藏
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, duration);
}

// 在页面加载时初始化AI朋友圈
document.addEventListener('DOMContentLoaded', function() {
    // 生成集数列表
    generateEpisodes();

    // 设置文件上传监听
    setupFileUpload();

    // 初始化弹窗控制
    initPopupControls();
    
    // 初始化AI朋友圈
    initAIMoments();
});

// 用户评价翻页功能
const pagePrev = document.querySelector('.page-prev');
const pageNext = document.querySelector('.page-next');
const pageNumber = document.querySelector('.page-number');

if (pagePrev && pageNext && pageNumber) {
    let currentPage = 1;

    pagePrev.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            pageNumber.textContent = currentPage;
            console.log('切换到评价页:', currentPage);
        }
    });

    pageNext.addEventListener('click', function() {
        currentPage++;
        pageNumber.textContent = currentPage;
        console.log('切换到评价页:', currentPage);
    });
}

// 弹窗控制功能
function initPopupControls() {
    // 弹幕设置弹窗
    const danmakuSettingsBtn = document.querySelector('.danmaku-settings-btn');
    const danmakuSettingsPopup = document.getElementById('danmakuSettingsPopup');

    // 语言选择弹窗
    const languageBtn = document.querySelector('.language-btn');
    const languagePopup = document.getElementById('languagePopup');

    // 清晰度选择弹窗
    const qualityBtn = document.querySelector('.quality-btn');
    const qualityPopup = document.getElementById('qualityPopup');

    // 倍速选择弹窗
    const speedBtn = document.querySelector('.speed-btn');
    const speedPopup = document.getElementById('speedPopup');

    // 音量控制弹窗
    const volumeBtn = document.querySelector('.volume-btn');
    const volumePopup = document.getElementById('volumePopup');

    // 设置弹窗
    const settingsBtn = document.querySelector('.settings-btn');
    const settingsPopup = document.getElementById('settingsPopup');

    // 通用弹窗显示/隐藏函数
    function showPopup(popup, button) {
        if (!popup || !button) return;

        const rect = button.getBoundingClientRect();
        popup.style.left = rect.left + 'px';
        popup.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
        popup.classList.add('show');
    }

    function hidePopup(popup) {
        if (!popup) return;
        popup.classList.remove('show');
    }

    // 弹幕设置
    if (danmakuSettingsBtn && danmakuSettingsPopup) {
        danmakuSettingsBtn.addEventListener('mouseenter', function() {
            showPopup(danmakuSettingsPopup, danmakuSettingsBtn);
        });

        danmakuSettingsBtn.addEventListener('mouseleave', function(e) {
            setTimeout(() => {
                if (!danmakuSettingsPopup.matches(':hover')) {
                    hidePopup(danmakuSettingsPopup);
                }
            }, 100);
        });

        danmakuSettingsPopup.addEventListener('mouseleave', function() {
            hidePopup(danmakuSettingsPopup);
        });
    }

    // 语言选择
    if (languageBtn && languagePopup) {
        languageBtn.addEventListener('mouseenter', function() {
            showPopup(languagePopup, languageBtn);
        });

        languageBtn.addEventListener('mouseleave', function() {
            setTimeout(() => {
                if (!languagePopup.matches(':hover')) {
                    hidePopup(languagePopup);
                }
            }, 100);
        });

        languagePopup.addEventListener('mouseleave', function() {
            hidePopup(languagePopup);
        });
    }

    // 清晰度选择
    if (qualityBtn && qualityPopup) {
        qualityBtn.addEventListener('mouseenter', function() {
            showPopup(qualityPopup, qualityBtn);
        });

        qualityBtn.addEventListener('mouseleave', function() {
            setTimeout(() => {
                if (!qualityPopup.matches(':hover')) {
                    hidePopup(qualityPopup);
                }
            }, 100);
        });

        qualityPopup.addEventListener('mouseleave', function() {
            hidePopup(qualityPopup);
        });

        // 清晰度选项点击
        const qualityOptions = qualityPopup.querySelectorAll('.quality-option');
        qualityOptions.forEach(option => {
            option.addEventListener('click', function() {
                qualityOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                const quality = this.querySelector('.quality-name').textContent;
                qualityBtn.textContent = quality.split(' ')[0];
                hidePopup(qualityPopup);
            });
        });
    }

    // 倍速选择
    if (speedBtn && speedPopup) {
        speedBtn.addEventListener('mouseenter', function() {
            showPopup(speedPopup, speedBtn);
        });

        speedBtn.addEventListener('mouseleave', function() {
            setTimeout(() => {
                if (!speedPopup.matches(':hover')) {
                    hidePopup(speedPopup);
                }
            }, 100);
        });

        speedPopup.addEventListener('mouseleave', function() {
            hidePopup(speedPopup);
        });

        // 倍速选项点击
        const speedOptions = speedPopup.querySelectorAll('.speed-option');
        speedOptions.forEach(option => {
            option.addEventListener('click', function() {
                speedOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                const speed = parseFloat(this.textContent);
                player.playbackRate(speed);
                speedBtn.textContent = this.textContent;
                hidePopup(speedPopup);
            });
        });
    }

    // 音量控制
    if (volumeBtn && volumePopup) {
        volumeBtn.addEventListener('mouseenter', function() {
            showPopup(volumePopup, volumeBtn);
        });

        volumeBtn.addEventListener('mouseleave', function() {
            setTimeout(() => {
                if (!volumePopup.matches(':hover')) {
                    hidePopup(volumePopup);
                }
            }, 100);
        });

        volumePopup.addEventListener('mouseleave', function() {
            hidePopup(volumePopup);
        });

        // 音量滑块控制
        const volumeSlider = volumePopup.querySelector('.volume-slider');
        const volumeNumber = volumePopup.querySelector('.volume-number');
        const volumeFill = volumePopup.querySelector('.volume-slider-fill');

        if (volumeSlider && volumeNumber && volumeFill) {
            volumeSlider.addEventListener('input', function() {
                const volume = this.value / 100;
                player.volume(volume);
                volumeNumber.textContent = this.value;
                volumeFill.style.height = this.value + '%';
            });

            // 初始化音量
            const currentVolume = Math.round(player.volume() * 100);
            volumeSlider.value = currentVolume;
            volumeNumber.textContent = currentVolume;
            volumeFill.style.height = currentVolume + '%';
        }
    }

    // 设置
    if (settingsBtn && settingsPopup) {
        settingsBtn.addEventListener('mouseenter', function() {
            showPopup(settingsPopup, settingsBtn);
        });

        settingsBtn.addEventListener('mouseleave', function() {
            setTimeout(() => {
                if (!settingsPopup.matches(':hover')) {
                    hidePopup(settingsPopup);
                }
            }, 100);
        });

        settingsPopup.addEventListener('mouseleave', function() {
            hidePopup(settingsPopup);
        });
    }
}

