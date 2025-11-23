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
        loadingSpinner: false // 禁用加载动画
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

    // 播放/暂停按钮
    if (playBtn) {
        playBtn.addEventListener('click', function() {
            if (player.paused()) {
                player.play();
            } else {
                player.pause();
            }
        });
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

// ==================== AI朋友圈功能 ====================

// AI朋友圈管理器实例
let aiMomentsManager = null;

// 初始化AI朋友圈
function initAIMoments() {
    // 先加载AI数据文件
    const dataScript = document.createElement('script');
    dataScript.src = 'ai-moments-data.js';
    dataScript.onload = function() {
        console.log('AI数据加载成功');
        
        // 再加载AI朋友圈模块
        const script = document.createElement('script');
        script.src = 'ai-moments.js';
        script.onload = function() {
            if (typeof AIMomentsManager !== 'undefined') {
                aiMomentsManager = new AIMomentsManager();
                console.log('AI朋友圈模块加载成功');
                
                // 初始化AI朋友圈事件监听
                initAIMomentsEvents();
            }
        };
        script.onerror = function() {
            console.error('AI朋友圈模块加载失败');
        };
        document.head.appendChild(script);
    };
    dataScript.onerror = function() {
        console.error('AI数据加载失败，使用默认数据');
        
        // 即使数据加载失败，也继续加载模块
        const script = document.createElement('script');
        script.src = 'ai-moments.js';
        script.onload = function() {
            if (typeof AIMomentsManager !== 'undefined') {
                aiMomentsManager = new AIMomentsManager();
                console.log('AI朋友圈模块加载成功（使用默认数据）');
                
                // 初始化AI朋友圈事件监听
                initAIMomentsEvents();
            }
        };
        document.head.appendChild(script);
    };
    document.head.appendChild(dataScript);
}

// 初始化AI朋友圈事件监听
function initAIMomentsEvents() {
    const aiMomentsBtn = document.getElementById('aiMomentsBtn');
    const momentsCloseBtn = document.getElementById('momentsCloseBtn');
    const aiMomentsSidebar = document.getElementById('aiMomentsSidebar');
    const momentsPublishBtn = document.getElementById('momentsPublishBtn');
    const publishModal = document.getElementById('publishModal');
    const publishModalClose = document.getElementById('publishModalClose');
    const publishCancelBtn = document.getElementById('publishCancelBtn');
    const publishSubmitBtn = document.getElementById('publishSubmitBtn');
    const publishTextarea = document.getElementById('publishTextarea');
    const charCount = document.getElementById('charCount');

    // 打开AI朋友圈侧边栏
    if (aiMomentsBtn && aiMomentsSidebar) {
        aiMomentsBtn.addEventListener('click', function() {
            aiMomentsSidebar.classList.add('show');
        });
    }

    // 关闭AI朋友圈侧边栏
    if (momentsCloseBtn && aiMomentsSidebar) {
        momentsCloseBtn.addEventListener('click', function() {
            aiMomentsSidebar.classList.remove('show');
        });
    }

    // 打开发布动态弹窗
    if (momentsPublishBtn && publishModal) {
        momentsPublishBtn.addEventListener('click', function() {
            publishModal.classList.add('show');
            publishTextarea.focus();
        });
    }

    // 关闭发布动态弹窗
    if (publishModalClose && publishModal) {
        publishModalClose.addEventListener('click', function() {
            publishModal.classList.remove('show');
            publishTextarea.value = '';
            charCount.textContent = '0';
            publishSubmitBtn.disabled = true;
        });
    }

    // 取消发布
    if (publishCancelBtn && publishModal) {
        publishCancelBtn.addEventListener('click', function() {
            publishModal.classList.remove('show');
            publishTextarea.value = '';
            charCount.textContent = '0';
            publishSubmitBtn.disabled = true;
        });
    }

    // 字符计数
    if (publishTextarea && charCount) {
        publishTextarea.addEventListener('input', function() {
            const length = this.value.length;
            charCount.textContent = length;
            publishSubmitBtn.disabled = length === 0 || length > 500;
        });
    }

    // 提交动态
    if (publishSubmitBtn && publishModal) {
        publishSubmitBtn.addEventListener('click', function() {
            const content = publishTextarea.value.trim();
            if (content && content.length <= 500) {
                if (aiMomentsManager) {
                    aiMomentsManager.publishMoment(content);
                }
                publishModal.classList.remove('show');
                publishTextarea.value = '';
                charCount.textContent = '0';
                publishSubmitBtn.disabled = true;
                
                // 显示成功提示
                showToast('动态发布成功！');
            }
        });
    }

    // 点击弹窗外部关闭
    if (publishModal) {
        publishModal.addEventListener('click', function(e) {
            if (e.target === publishModal) {
                publishModal.classList.remove('show');
                publishTextarea.value = '';
                charCount.textContent = '0';
                publishSubmitBtn.disabled = true;
            }
        });
    }

    // 键盘事件
    document.addEventListener('keydown', function(e) {
        // ESC键关闭弹窗
        if (e.key === 'Escape') {
            if (publishModal.classList.contains('show')) {
                publishModal.classList.remove('show');
                publishTextarea.value = '';
                charCount.textContent = '0';
                publishSubmitBtn.disabled = true;
            }
            if (aiMomentsSidebar.classList.contains('show')) {
                aiMomentsSidebar.classList.remove('show');
            }
        }
    });
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
    // 初始化视频播放器
    initVideoPlayer();

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

