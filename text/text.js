class TextToImageGenerator {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.settings = {
            text: '',
            fontFamily: 'Arial, sans-serif',
            fontSize: 48,
            fontWeight: 'normal',
            textColor: '#000000',
            backgroundColor: '#ffffff',
            canvasWidth: 800,
            canvasHeight: 400,
            textAlign: 'center',
            padding: 20,
            addShadow: false,
            addBorder: false,
            addGradient: false
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupCanvas();
        this.updatePreview();
    }

    bindEvents() {
        // 文字输入
        document.getElementById('textInput').addEventListener('input', (e) => {
            this.settings.text = e.target.value;
            this.updatePreview();
        });

        // 字体设置
        document.getElementById('fontFamily').addEventListener('change', (e) => {
            this.settings.fontFamily = e.target.value;
            this.updatePreview();
        });

        document.getElementById('fontSize').addEventListener('input', (e) => {
            this.settings.fontSize = parseInt(e.target.value);
            document.getElementById('fontSizeValue').textContent = e.target.value + 'px';
            this.updatePreview();
        });

        document.getElementById('fontWeight').addEventListener('change', (e) => {
            this.settings.fontWeight = e.target.value;
            this.updatePreview();
        });

        // 颜色设置
        document.getElementById('textColor').addEventListener('change', (e) => {
            this.settings.textColor = e.target.value;
            document.getElementById('textColorHex').value = e.target.value;
            this.updatePreview();
        });

        document.getElementById('textColorHex').addEventListener('input', (e) => {
            if (this.isValidHex(e.target.value)) {
                this.settings.textColor = e.target.value;
                document.getElementById('textColor').value = e.target.value;
                this.updatePreview();
            }
        });

        document.getElementById('backgroundColor').addEventListener('change', (e) => {
            this.settings.backgroundColor = e.target.value;
            document.getElementById('backgroundColorHex').value = e.target.value;
            this.updatePreview();
        });

        document.getElementById('backgroundColorHex').addEventListener('input', (e) => {
            if (this.isValidHex(e.target.value)) {
                this.settings.backgroundColor = e.target.value;
                document.getElementById('backgroundColor').value = e.target.value;
                this.updatePreview();
            }
        });

        // 布局设置
        document.getElementById('canvasWidth').addEventListener('input', (e) => {
            this.settings.canvasWidth = parseInt(e.target.value);
            this.setupCanvas();
            this.updatePreview();
        });

        document.getElementById('canvasHeight').addEventListener('input', (e) => {
            this.settings.canvasHeight = parseInt(e.target.value);
            this.setupCanvas();
            this.updatePreview();
        });

        // 文字对齐
        document.querySelectorAll('.align-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.align-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.settings.textAlign = e.target.dataset.align;
                this.updatePreview();
            });
        });

        document.getElementById('padding').addEventListener('input', (e) => {
            this.settings.padding = parseInt(e.target.value);
            document.getElementById('paddingValue').textContent = e.target.value + 'px';
            this.updatePreview();
        });

        // 效果设置
        document.getElementById('addShadow').addEventListener('change', (e) => {
            this.settings.addShadow = e.target.checked;
            this.updatePreview();
        });

        document.getElementById('addBorder').addEventListener('change', (e) => {
            this.settings.addBorder = e.target.checked;
            this.updatePreview();
        });

        document.getElementById('addGradient').addEventListener('change', (e) => {
            this.settings.addGradient = e.target.checked;
            this.updatePreview();
        });

        // 按钮事件
        document.getElementById('generateBtn').addEventListener('click', () => this.generateImage());
        document.getElementById('previewBtn').addEventListener('click', () => this.showPreview());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadImage('png'));
        document.getElementById('downloadPngBtn').addEventListener('click', () => this.downloadImage('png'));
        document.getElementById('downloadJpgBtn').addEventListener('click', () => this.downloadImage('jpeg'));
    }

    setupCanvas() {
        this.canvas = document.getElementById('previewCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.settings.canvasWidth;
        this.canvas.height = this.settings.canvasHeight;
    }

    isValidHex(hex) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
    }

    updatePreview() {
        if (!this.ctx || !this.settings.text.trim()) {
            this.clearCanvas();
            return;
        }

        this.clearCanvas();
        this.drawBackground();
        this.drawText();
        this.drawBorder();
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawBackground() {
        if (this.settings.addGradient) {
            this.drawGradientBackground();
        } else {
            this.ctx.fillStyle = this.settings.backgroundColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    drawGradientBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, this.settings.backgroundColor);
        gradient.addColorStop(1, this.lightenColor(this.settings.backgroundColor, 20));
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawText() {
        const { padding, fontSize, fontFamily, fontWeight, textColor, textAlign, addShadow } = this.settings;
        
        // 设置字体
        this.ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        this.ctx.fillStyle = textColor;
        this.ctx.textAlign = textAlign;
        this.ctx.textBaseline = 'middle';

        // 设置阴影
        if (addShadow) {
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            this.ctx.shadowBlur = 4;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;
        } else {
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
        }

        // 计算文字位置
        const textLines = this.settings.text.split('\n');
        const lineHeight = fontSize * 1.2;
        const totalHeight = textLines.length * lineHeight;
        const startY = (this.canvas.height - totalHeight) / 2 + lineHeight / 2;

        // 计算水平位置
        let x;
        switch (textAlign) {
            case 'left':
                x = padding;
                break;
            case 'right':
                x = this.canvas.width - padding;
                break;
            case 'center':
            default:
                x = this.canvas.width / 2;
                break;
        }

        // 绘制文字
        textLines.forEach((line, index) => {
            const y = startY + index * lineHeight;
            this.ctx.fillText(line, x, y);
        });
    }

    drawBorder() {
        if (!this.settings.addBorder) return;

        this.ctx.strokeStyle = this.darkenColor(this.settings.backgroundColor, 20);
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(1, 1, this.canvas.width - 2, this.canvas.height - 2);
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
            (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
            (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
    }

    showPreview() {
        if (!this.settings.text.trim()) {
            alert('请输入要生成图片的文字内容');
            return;
        }

        document.getElementById('previewSection').style.display = 'block';
        this.updatePreview();
        
        // 滚动到预览区域
        document.getElementById('previewSection').scrollIntoView({ 
            behavior: 'smooth' 
        });
    }

    generateImage() {
        if (!this.settings.text.trim()) {
            alert('请输入要生成图片的文字内容');
            return;
        }

        this.showPreview();
    }

    downloadImage(format = 'png') {
        if (!this.settings.text.trim()) {
            alert('请先生成图片');
            return;
        }

        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const quality = format === 'jpeg' ? 0.9 : undefined;
        
        // 创建下载链接
        const link = document.createElement('a');
        link.download = `text-image-${Date.now()}.${format}`;
        link.href = this.canvas.toDataURL(mimeType, quality);
        link.click();
    }

    clearAll() {
        this.settings.text = '';
        document.getElementById('textInput').value = '';
        this.updatePreview();
        document.getElementById('previewSection').style.display = 'none';
    }

    // 预设样式功能
    applyPreset(presetName) {
        const presets = {
            'title': {
                fontSize: 72,
                fontWeight: 'bold',
                textColor: '#ffffff',
                backgroundColor: '#007bff',
                addShadow: true,
                addBorder: true
            },
            'subtitle': {
                fontSize: 36,
                fontWeight: 'normal',
                textColor: '#333333',
                backgroundColor: '#f8f9fa',
                addShadow: false,
                addBorder: true
            },
            'quote': {
                fontSize: 24,
                fontWeight: 'normal',
                textColor: '#666666',
                backgroundColor: '#ffffff',
                addShadow: true,
                addBorder: false
            },
            'warning': {
                fontSize: 48,
                fontWeight: 'bold',
                textColor: '#ffffff',
                backgroundColor: '#ffc107',
                addShadow: true,
                addBorder: true
            },
            'error': {
                fontSize: 48,
                fontWeight: 'bold',
                textColor: '#ffffff',
                backgroundColor: '#dc3545',
                addShadow: true,
                addBorder: true
            }
        };

        if (presets[presetName]) {
            const preset = presets[presetName];
            Object.keys(preset).forEach(key => {
                this.settings[key] = preset[key];
            });
            this.updateUI();
            this.updatePreview();
        }
    }

    updateUI() {
        // 更新UI元素以反映当前设置
        document.getElementById('fontSize').value = this.settings.fontSize;
        document.getElementById('fontSizeValue').textContent = this.settings.fontSize + 'px';
        document.getElementById('fontWeight').value = this.settings.fontWeight;
        document.getElementById('textColor').value = this.settings.textColor;
        document.getElementById('textColorHex').value = this.settings.textColor;
        document.getElementById('backgroundColor').value = this.settings.backgroundColor;
        document.getElementById('backgroundColorHex').value = this.settings.backgroundColor;
        document.getElementById('canvasWidth').value = this.settings.canvasWidth;
        document.getElementById('canvasHeight').value = this.settings.canvasHeight;
        document.getElementById('padding').value = this.settings.padding;
        document.getElementById('paddingValue').textContent = this.settings.padding + 'px';
        document.getElementById('addShadow').checked = this.settings.addShadow;
        document.getElementById('addBorder').checked = this.settings.addBorder;
        document.getElementById('addGradient').checked = this.settings.addGradient;

        // 更新对齐按钮
        document.querySelectorAll('.align-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.align === this.settings.textAlign) {
                btn.classList.add('active');
            }
        });
    }

    // 获取当前设置
    getSettings() {
        return { ...this.settings };
    }

    // 设置配置
    setSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.updateUI();
        this.updatePreview();
    }

    // 导出为Base64
    exportAsBase64(format = 'png') {
        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const quality = format === 'jpeg' ? 0.9 : undefined;
        return this.canvas.toDataURL(mimeType, quality);
    }

    // 获取图片Blob
    async getImageBlob(format = 'png') {
        return new Promise((resolve) => {
            this.canvas.toBlob((blob) => {
                resolve(blob);
            }, format === 'png' ? 'image/png' : 'image/jpeg', format === 'jpeg' ? 0.9 : undefined);
        });
    }
}

// 初始化应用
let textToImageGenerator;
document.addEventListener('DOMContentLoaded', () => {
    textToImageGenerator = new TextToImageGenerator();
});

// 全局函数，供HTML调用
function applyPreset(presetName) {
    if (textToImageGenerator) {
        textToImageGenerator.applyPreset(presetName);
    }
}
