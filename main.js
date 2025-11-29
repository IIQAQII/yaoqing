// 图片文本合成器 - 修复版本 - 2025x1280px

class ImageTextEditor {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.currentBackground = 'resources/background.png';
        this.fixedWidth = 2025;
        this.fixedHeight = 1280;
        this.isDownloading = false;
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.initAnimations();
        this.updateFontSizeDisplay();
        this.syncTextInputs();
    }

    setupCanvas() {
        // 创建用于合成的画布
        this.canvas = document.getElementById('合成画布');
        this.canvas.width = this.fixedWidth;
        this.canvas.height = this.fixedHeight;
        this.ctx = this.canvas.getContext('2d');
    }

    setupEventListeners() {
        // 字号滑块
        const fontSizeSlider = document.getElementById('fontSizeSlider');
        fontSizeSlider.addEventListener('input', (e) => {
            this.updateFontSize(e.target.value);
        });
        
        // 初始化字号显示
        this.updateFontSizeDisplay();

        // 文本输入同步
        const textInput1 = document.getElementById('textInput1');
        const textInput2 = document.getElementById('textInput2');
        const textDisplay1 = document.getElementById('textDisplay1');
        const textDisplay2 = document.getElementById('textDisplay2');

        textInput1.addEventListener('input', () => {
            textDisplay1.value = textInput1.value;
            this.adjustTextareaHeight(textDisplay1);
        });

        textInput2.addEventListener('input', () => {
            textDisplay2.value = textInput2.value;
            this.adjustTextareaHeight(textDisplay2);
        });

        // 图片上传
        const imageUpload = document.getElementById('imageUpload');
        imageUpload.addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });

        // 下载按钮
        const downloadBtn = document.getElementById('downloadBtn');
        downloadBtn.addEventListener('click', () => {
            if (!this.isDownloading) {
                this.downloadImage();
            }
        });

        // 重置按钮
        const resetBtn = document.getElementById('resetBtn');
        resetBtn.addEventListener('click', () => {
            this.resetEditor();
        });
    }

    syncTextInputs() {
        // 初始化文本显示区域
        const textDisplay1 = document.getElementById('textDisplay1');
        const textDisplay2 = document.getElementById('textDisplay2');
        
        textDisplay1.value = '';
        textDisplay2.value = '';
        
        this.adjustTextareaHeight(textDisplay1);
        this.adjustTextareaHeight(textDisplay2);
    }

    adjustTextareaHeight(textarea) {
        // 自动调整文本框高度
        textarea.style.height = 'auto';
        const newHeight = Math.max(60, textarea.scrollHeight);
        textarea.style.height = newHeight + 'px';
    }

    updateFontSize(size) {
        const textDisplays = document.querySelectorAll('.text-overlay');
        textDisplays.forEach(display => {
            display.style.fontSize = size + 'px';
        });
        
        document.getElementById('fontSizeDisplay').textContent = size;
    }

    updateFontSizeDisplay() {
        const fontSizeSlider = document.getElementById('fontSizeSlider');
        document.getElementById('fontSizeDisplay').textContent = fontSizeSlider.value;
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    document.getElementById('backgroundImage').src = e.target.result;
                    this.currentBackground = e.target.result;
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }
	drawVerticalText(text, startX, startY, fontSize) {
		const lineHeight = fontSize * 0.8; // 字符间距
		const maxHeight = this.fixedHeight * 0.7; // 最大高度限制
		
		// 逐字绘制
		for (let i = 0; i < text.length; i++) {
			const char = text[i];
			const currentY = startY + i * lineHeight;
			
			// 检查是否超出最大高度
			if (currentY > startY + maxHeight) {
				break; // 超出范围停止绘制
			}
			
			this.ctx.fillText(char, startX, currentY);
		}
	}

    async downloadImage() {
        if (this.isDownloading) {
            return;
        }

        this.isDownloading = true;
        
        try {
            const textInput1 = document.getElementById('textInput1').value;
            const textInput2 = document.getElementById('textInput2').value;
            const fontSize = 150;
            
            // 清空画布
            this.ctx.clearRect(0, 0, this.fixedWidth, this.fixedHeight);
            
            // 创建Promise来处理图片加载
            const imageLoaded = await this.loadBackgroundImage();
            if (!imageLoaded) {
                throw new Error('背景图片加载失败');
            }
            
            // 绘制背景图片
            const bgImage = new Image();
            bgImage.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
                bgImage.onload = resolve;
                bgImage.onerror = reject;
                
                if (this.currentBackground.startsWith('data:') || 
                    this.currentBackground.startsWith('http')) {
                    bgImage.src = this.currentBackground;
                } else {
                    // 对于本地图片，使用绝对路径
                    bgImage.src = new URL(this.currentBackground, window.location.origin).href;
                }
            });
			//bgImage.src = this.backgroundImage;
            this.ctx.drawImage(bgImage, 0, 0, this.fixedWidth, this.fixedHeight);
            
            // 设置文本样式
            this.ctx.font = `${fontSize}px 'HuaWen XingKai2', 'Noto Sans SC', sans-serif`;
            this.ctx.fillStyle = '#000000';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // 绘制上方文本
            if (textInput1.trim()) {
                this.drawVerticalText(textInput1, 1670, 160, fontSize * 1.5);
            }
            
            // 绘制下方文本
            if (textInput2.trim()) {
                this.drawVerticalText(textInput2, 1850, 500, fontSize * 1.5);
            }
            
            // 尝试下载图片
            const downloadSuccess = await this.tryDownloadImage();
            
            if (downloadSuccess) {
                this.showDownloadSuccess();
            } else {
                // 如果自动下载失败，显示手动下载选项
                this.showManualDownload(this.canvas.toDataURL('image/png'));
            }
            
        } catch (error) {
            console.error('下载图片时出错:', error);
            this.showError(error.message || '下载失败，请重试');
        } finally {
            this.isDownloading = false;
        }
    }

    loadBackgroundImage() {
        return new Promise((resolve) => {
            this.backgroundImage = new Image();
            this.backgroundImage.onload = () => {
                resolve(true);
            };
            this.backgroundImage.onerror = () => {
                resolve(false);
            };
            this.backgroundImage.src = this.currentBackground;
        });
    }

    tryDownloadImage() {
        return new Promise((resolve) => {
            try {
                // 获取画布数据
                const dataURL = this.canvas.toDataURL('image/png');
                
                // 创建下载链接
                const link = document.createElement('a');
                link.download = `合成图片_${new Date().getTime()}.png`;
                link.href = dataURL;
                
                // 添加到文档以确保兼容性
                document.body.appendChild(link);
                
                // 尝试触发下载
                let downloadTriggered = false;
                
                // 监听下载开始
                const originalClick = link.click;
                link.click = function() {
                    downloadTriggered = true;
                    if (originalClick) {
                        originalClick.call(this);
                    }
                };
                
                // 触发点击
                if (link.click) {
                    link.click();
                } else {
                    // 降级方案
                    const event = new MouseEvent('click', {
                        view: window,
                        bubbles: true,
                        cancelable: true
                    });
                    link.dispatchEvent(event);
                }
                
                // 清理
                document.body.removeChild(link);
                
                // 检查是否真的触发了下载
                setTimeout(() => {
                    // 如果浏览器阻止了自动下载，我们需要显示手动下载选项
                    if (!downloadTriggered) {
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                }, 500);
                
            } catch (error) {
                console.error('下载过程中出错:', error);
                resolve(false);
            }
        });
    }

    drawTextWithLineBreaks(text, x, y, lineHeight) {
        const maxWidth = this.fixedWidth * 0.8; // 80% 宽度
        const lines = this.wrapText(text, maxWidth);
        
        // 计算总行高度，使文本垂直居中
        const totalHeight = (lines.length - 1) * lineHeight;
        const startY = y - totalHeight / 2;
        
        lines.forEach((line, index) => {
            const currentY = startY + index * lineHeight;
            this.ctx.fillText(line, x, currentY);
        });
    }

    wrapText(text, maxWidth) {
        const words = text.split('');
        const lines = [];
        let currentLine = '';
        
        for (let i = 0; i < words.length; i++) {
            const testLine = currentLine + words[i];
            const metrics = this.ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine !== '') {
                lines.push(currentLine);
                currentLine = words[i];
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine !== '') {
            lines.push(currentLine);
        }
        
        return lines;
    }

    showManualDownload(dataURL) {
        // 创建手动下载提示
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            max-width: 500px;
            margin: 20px;
        `;
        
        content.innerHTML = `
            <h3 style="margin-bottom: 15px; color: #333; font-size: 20px;">图片已生成</h3>
            <p style="margin-bottom: 20px; color: #666; font-size: 14px;">如果自动下载失败，请长按或右键点击图片选择"保存图片"：</p>
            <img src="${dataURL}" style="max-width: 100%; max-height: 300px; border: 1px solid #ddd; margin-bottom: 15px; border-radius: 8px;" />
            <br>
            <div style="margin-top: 20px;">
                <button onclick="this.closest('.modal').remove()" style="
                    background: #ff6b35;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    margin: 5px;
                ">关闭</button>
                <a href="${dataURL}" download="合成图片.png" style="
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    margin: 5px;
                    text-decoration: none;
                    display: inline-block;
                ">重新下载</a>
            </div>
        `;
        
        modal.className = 'modal';
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    showDownloadSuccess() {
        // 创建成功提示动画
        const notification = document.createElement('div');
        notification.innerHTML = '✓ 图片下载成功';
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 255, 0, 0.9);
            color: white;
            padding: 20px 40px;
            border-radius: 8px;
            font-size: 18px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        `;
        
        document.body.appendChild(notification);
        
        // 动画效果
        anime({
            targets: notification,
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutBack',
            complete: () => {
                setTimeout(() => {
                    anime({
                        targets: notification,
                        opacity: 0,
                        scale: 0.8,
                        duration: 200,
                        complete: () => {
                            if (document.body.contains(notification)) {
                                document.body.removeChild(notification);
                            }
                        }
                    });
                }, 2000);
            }
        });
    }

    showError(message) {
        // 创建错误提示
        const notification = document.createElement('div');
        notification.innerHTML = `✗ ${message}`;
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 20px 40px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            text-align: center;
        `;
        
        document.body.appendChild(notification);
        
        // 动画效果
        anime({
            targets: notification,
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutBack',
            complete: () => {
                setTimeout(() => {
                    anime({
                        targets: notification,
                        opacity: 0,
                        scale: 0.8,
                        duration: 200,
                        complete: () => {
                            if (document.body.contains(notification)) {
                                document.body.removeChild(notification);
                            }
                        }
                    });
                }, 3000);
            }
        });
    }

    resetEditor() {
        // 重置所有输入
        document.getElementById('textInput1').value = '';
        document.getElementById('textInput2').value = '';
        document.getElementById('textDisplay1').value = '';
        document.getElementById('textDisplay2').value = '';
        document.getElementById('fontSizeSlider').value = 150;
        
        // 重置显示
        this.updateFontSize(150);
        this.syncTextInputs();
        
        // 重置背景图片
        document.getElementById('backgroundImage').src = 'resources/background.png';
        this.currentBackground = 'resources/background.png';
        
        // 重置文件输入
        document.getElementById('imageUpload').value = '';
        
        // 显示重置动画
        this.showResetAnimation();
    }

    showResetAnimation() {
        const canvasArea = document.getElementById('canvasArea');
        
        anime({
            targets: canvasArea,
            scale: [1, 0.95, 1],
            duration: 400,
            easing: 'easeInOutQuad'
        });
    }

    initAnimations() {
        // 页面加载动画
        anime({
            targets: '.control-panel',
            translateX: [100, 0],
            opacity: [0, 1],
            duration: 800,
            delay: 200,
            easing: 'easeOutExpo'
        });

        anime({
            targets: '.editor-container',
            translateY: [50, 0],
            opacity: [0, 1],
            duration: 800,
            delay: 100,
            easing: 'easeOutExpo'
        });

        anime({
            targets: '.text-input-panel',
            translateY: [30, 0],
            opacity: [0, 1],
            duration: 600,
            delay: 400,
            easing: 'easeOutExpo'
        });
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new ImageTextEditor();
});