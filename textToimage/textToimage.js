class TextToImageEditor {
    constructor() {
        this.originalImage = null;
        this.canvas = null;
        this.ctx = null;
        this.settings = {
            text: '',
            fontFamily: 'Arial, sans-serif',
            fontSize: 48,
            fontWeight: 'normal',
            textColor: '#ffffff',
            strokeColor: '#000000',
            backgroundColor: '#000000',
            position: 'center',
            positionX: 50,
            positionY: 50,
            addStroke: false,
            addBackground: false,
            addShadow: false,
            addBlur: false,
            strokeWidth: 2,
            shadowBlur: 5,
            backgroundOpacity: 0.5,
            outputFormat: 'png',
            imageQuality: 0.9
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupCanvas();
    }

    bindEvents() {
        // 文件上传
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.querySelector('.upload-area');
        
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // 拖拽上传
        uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // 文字输入
        document.getElementById('textInput').addEventListener('input', (e) => {
            this.settings.text = e.target.value;
            this.updateTextPreview();
            this.updatePreview();
        });

        // 字体设置
        document.getElementById('fontFamily').addEventListener('change', (e) => {
            this.settings.fontFamily = e.target.value;
            this.updateTextPreview();
            this.updatePreview();
        });

        document.getElementById('fontSize').addEventListener('input', (e) => {
            this.settings.fontSize = parseInt(e.target.value);
            document.getElementById('fontSizeValue').textContent = e.target.value + 'px';
            this.updateTextPreview();
            this.updatePreview();
        });

        document.getElementById('fontWeight').addEventListener('change', (e) => {
            this.settings.fontWeight = e.target.value;
            this.updateTextPreview();
            this.updatePreview();
        });

        // 颜色设置
        document.getElementById('textColor').addEventListener('change', (e) => {
            this.settings.textColor = e.target.value;
            document.getElementById('textColorHex').value = e.target.value;
            this.updateTextPreview();
            this.updatePreview();
        });

        document.getElementById('textColorHex').addEventListener('input', (e) => {
            if (this.isValidHex(e.target.value)) {
                this.settings.textColor = e.target.value;
                document.getElementById('textColor').value = e.target.value;
                this.updateTextPreview();
                this.updatePreview();
            }
        });

        document.getElementById('strokeColor').addEventListener('change', (e) => {
            this.settings.strokeColor = e.target.value;
            document.getElementById('strokeColorHex').value = e.target.value;
            this.updatePreview();
        });

        document.getElementById('strokeColorHex').addEventListener('input', (e) => {
            if (this.isValidHex(e.target.value)) {
                this.settings.strokeColor = e.target.value;
                document.getElementById('strokeColor').value = e.target.value;
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

        // 位置设置
        document.querySelectorAll('.position-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.position-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.settings.position = e.target.dataset.position;
                this.updatePreview();
            });
        });

        document.getElementById('positionX').addEventListener('input', (e) => {
            this.settings.positionX = parseInt(e.target.value);
            this.updatePreview();
        });

        document.getElementById('positionY').addEventListener('input', (e) => {
            this.settings.positionY = parseInt(e.target.value);
            this.updatePreview();
        });

        // 效果设置
        document.getElementById('addStroke').addEventListener('change', (e) => {
            this.settings.addStroke = e.target.checked;
            this.toggleEffectSettings();
            this.updatePreview();
        });

        document.getElementById('addBackground').addEventListener('change', (e) => {
            this.settings.addBackground = e.target.checked;
            this.toggleEffectSettings();
            this.updatePreview();
        });

        document.getElementById('addShadow').addEventListener('change', (e) => {
            this.settings.addShadow = e.target.checked;
            this.toggleEffectSettings();
            this.updatePreview();
        });

        document.getElementById('addBlur').addEventListener('change', (e) => {
            this.settings.addBlur = e.target.checked;
            this.toggleEffectSettings();
            this.updatePreview();
        });

        document.getElementById('strokeWidth').addEventListener('input', (e) => {
            this.settings.strokeWidth = parseInt(e.target.value);
            document.getElementById('strokeWidthValue').textContent = e.target.value + 'px';
            this.updatePreview();
        });

        document.getElementById('shadowBlur').addEventListener('input', (e) => {
            this.settings.shadowBlur = parseInt(e.target.value);
            document.getElementById('shadowBlurValue').textContent = e.target.value + 'px';
            this.updatePreview();
        });

        document.getElementById('backgroundOpacity').addEventListener('input', (e) => {
            this.settings.backgroundOpacity = parseFloat(e.target.value);
            document.getElementById('backgroundOpacityValue').textContent = Math.round(e.target.value * 100) + '%';
            this.updatePreview();
        });

        // 输出格式
        document.getElementById('outputFormat').addEventListener('change', (e) => {
            this.settings.outputFormat = e.target.value;
            this.toggleQualityGroup();
        });

        document.getElementById('imageQuality').addEventListener('input', (e) => {
            this.settings.imageQuality = parseFloat(e.target.value);
            document.getElementById('imageQualityValue').textContent = Math.round(e.target.value * 100) + '%';
        });

        // 按钮事件
        document.getElementById('previewBtn').addEventListener('click', () => this.previewImage());
        document.getElementById('addTextBtn').addEventListener('click', () => this.addTextToImage());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearText());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadImage());
        document.getElementById('downloadPngBtn').addEventListener('click', () => this.downloadImage('png'));
        document.getElementById('downloadJpgBtn').addEventListener('click', () => this.downloadImage('jpeg'));
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    }

    processFiles(files) {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            alert('请选择图片文件');
            return;
        }

        if (imageFiles.length > 1) {
            alert('请只选择一张图片');
            return;
        }

        this.loadImage(imageFiles[0]);
    }

    loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = {
                    file: file,
                    name: file.name,
                    size: file.size,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    dataUrl: e.target.result,
                    img: img
                };
                
                this.setupCanvas();
                this.showSettings();
                this.updatePreview();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    showSettings() {
        document.getElementById('settingsSection').style.display = 'block';
    }

    hideSettings() {
        document.getElementById('settingsSection').style.display = 'none';
        document.getElementById('previewSection').style.display = 'none';
    }

    setupCanvas() {
        if (!this.originalImage) return;
        
        this.canvas = document.getElementById('previewCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.originalImage.width;
        this.canvas.height = this.originalImage.height;
    }

    isValidHex(hex) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
    }

    updateTextPreview() {
        const textPreview = document.getElementById('textPreview');
        if (this.settings.text.trim()) {
            textPreview.textContent = this.settings.text;
            textPreview.style.fontFamily = this.settings.fontFamily;
            textPreview.style.fontSize = this.settings.fontSize + 'px';
            textPreview.style.fontWeight = this.settings.fontWeight;
            textPreview.style.color = this.settings.textColor;
        } else {
            textPreview.textContent = '文字预览';
            textPreview.style.fontFamily = 'inherit';
            textPreview.style.fontSize = '18px';
            textPreview.style.fontWeight = 'normal';
            textPreview.style.color = 'white';
        }
    }

    toggleEffectSettings() {
        const effectSettings = document.getElementById('effectSettings');
        const hasEffects = this.settings.addStroke || this.settings.addBackground || 
                          this.settings.addShadow || this.settings.addBlur;
        
        if (hasEffects) {
            effectSettings.style.display = 'block';
        } else {
            effectSettings.style.display = 'none';
        }
    }

    toggleQualityGroup() {
        const qualityGroup = document.getElementById('qualityGroup');
        if (this.settings.outputFormat === 'jpeg') {
            qualityGroup.style.display = 'block';
        } else {
            qualityGroup.style.display = 'none';
        }
    }

    calculateTextPosition() {
        if (!this.originalImage) return { x: 0, y: 0 };

        const { position, positionX, positionY } = this.settings;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        let x, y;

        switch (position) {
            case 'top-left':
                x = 20;
                y = this.settings.fontSize + 20;
                break;
            case 'top-center':
                x = canvasWidth / 2;
                y = this.settings.fontSize + 20;
                break;
            case 'top-right':
                x = canvasWidth - 20;
                y = this.settings.fontSize + 20;
                break;
            case 'center-left':
                x = 20;
                y = canvasHeight / 2;
                break;
            case 'center':
                x = canvasWidth / 2;
                y = canvasHeight / 2;
                break;
            case 'center-right':
                x = canvasWidth - 20;
                y = canvasHeight / 2;
                break;
            case 'bottom-left':
                x = 20;
                y = canvasHeight - 20;
                break;
            case 'bottom-center':
                x = canvasWidth / 2;
                y = canvasHeight - 20;
                break;
            case 'bottom-right':
                x = canvasWidth - 20;
                y = canvasHeight - 20;
                break;
            default:
                x = positionX;
                y = positionY;
                break;
        }

        return { x, y };
    }

    drawBackground() {
        if (!this.originalImage) return;
        
        this.ctx.drawImage(this.originalImage.img, 0, 0);
    }

    drawText() {
        if (!this.settings.text.trim()) return;

        const { x, y } = this.calculateTextPosition();
        const { fontSize, fontFamily, fontWeight, textColor, addStroke, addBackground, 
                addShadow, addBlur, strokeColor, strokeWidth, shadowBlur, 
                backgroundColor, backgroundOpacity } = this.settings;

        // 设置字体
        this.ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // 设置阴影
        if (addShadow) {
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = shadowBlur;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;
        } else {
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
        }

        // 绘制背景
        if (addBackground) {
            const textMetrics = this.ctx.measureText(this.settings.text);
            const textWidth = textMetrics.width;
            const textHeight = fontSize;
            const padding = 10;
            
            this.ctx.fillStyle = backgroundColor;
            this.ctx.globalAlpha = backgroundOpacity;
            this.ctx.fillRect(
                x - textWidth / 2 - padding,
                y - textHeight / 2 - padding,
                textWidth + padding * 2,
                textHeight + padding * 2
            );
            this.ctx.globalAlpha = 1;
        }

        // 绘制描边
        if (addStroke) {
            this.ctx.strokeStyle = strokeColor;
            this.ctx.lineWidth = strokeWidth;
            this.ctx.strokeText(this.settings.text, x, y);
        }

        // 绘制文字
        this.ctx.fillStyle = textColor;
        this.ctx.fillText(this.settings.text, x, y);
    }

    updatePreview() {
        if (!this.originalImage) return;
        
        this.drawBackground();
        this.drawText();
    }

    previewImage() {
        if (!this.originalImage) {
            alert('请先上传图片');
            return;
        }

        if (!this.settings.text.trim()) {
            alert('请输入要添加的文字');
            return;
        }

        this.updatePreview();
        document.getElementById('previewSection').style.display = 'block';
        
        // 滚动到预览区域
        document.getElementById('previewSection').scrollIntoView({ 
            behavior: 'smooth' 
        });
    }

    addTextToImage() {
        if (!this.originalImage) {
            alert('请先上传图片');
            return;
        }

        if (!this.settings.text.trim()) {
            alert('请输入要添加的文字');
            return;
        }

        this.previewImage();
    }

    downloadImage(format = null) {
        if (!this.originalImage) {
            alert('请先生成图片');
            return;
        }

        const outputFormat = format || this.settings.outputFormat;
        const mimeType = outputFormat === 'png' ? 'image/png' : 
                        outputFormat === 'jpeg' ? 'image/jpeg' : 'image/webp';
        const quality = outputFormat === 'jpeg' ? this.settings.imageQuality : undefined;
        
        // 创建下载链接
        const link = document.createElement('a');
        link.download = `text-image-${Date.now()}.${outputFormat}`;
        link.href = this.canvas.toDataURL(mimeType, quality);
        link.click();
    }

    clearText() {
        this.settings.text = '';
        document.getElementById('textInput').value = '';
        this.updateTextPreview();
        this.updatePreview();
    }

    // 获取当前设置
    getSettings() {
        return { ...this.settings };
    }

    // 设置配置
    setSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.updateUI();
        this.updateTextPreview();
        this.updatePreview();
    }

    updateUI() {
        // 更新UI元素以反映当前设置
        document.getElementById('textInput').value = this.settings.text;
        document.getElementById('fontFamily').value = this.settings.fontFamily;
        document.getElementById('fontSize').value = this.settings.fontSize;
        document.getElementById('fontSizeValue').textContent = this.settings.fontSize + 'px';
        document.getElementById('fontWeight').value = this.settings.fontWeight;
        document.getElementById('textColor').value = this.settings.textColor;
        document.getElementById('textColorHex').value = this.settings.textColor;
        document.getElementById('strokeColor').value = this.settings.strokeColor;
        document.getElementById('strokeColorHex').value = this.settings.strokeColor;
        document.getElementById('backgroundColor').value = this.settings.backgroundColor;
        document.getElementById('backgroundColorHex').value = this.settings.backgroundColor;
        document.getElementById('positionX').value = this.settings.positionX;
        document.getElementById('positionY').value = this.settings.positionY;
        document.getElementById('addStroke').checked = this.settings.addStroke;
        document.getElementById('addBackground').checked = this.settings.addBackground;
        document.getElementById('addShadow').checked = this.settings.addShadow;
        document.getElementById('addBlur').checked = this.settings.addBlur;
        document.getElementById('strokeWidth').value = this.settings.strokeWidth;
        document.getElementById('strokeWidthValue').textContent = this.settings.strokeWidth + 'px';
        document.getElementById('shadowBlur').value = this.settings.shadowBlur;
        document.getElementById('shadowBlurValue').textContent = this.settings.shadowBlur + 'px';
        document.getElementById('backgroundOpacity').value = this.settings.backgroundOpacity;
        document.getElementById('backgroundOpacityValue').textContent = Math.round(this.settings.backgroundOpacity * 100) + '%';
        document.getElementById('outputFormat').value = this.settings.outputFormat;
        document.getElementById('imageQuality').value = this.settings.imageQuality;
        document.getElementById('imageQualityValue').textContent = Math.round(this.settings.imageQuality * 100) + '%';

        // 更新位置按钮
        document.querySelectorAll('.position-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.position === this.settings.position) {
                btn.classList.add('active');
            }
        });

        // 触发相关事件
        this.toggleEffectSettings();
        this.toggleQualityGroup();
    }

    // 导出为Base64
    exportAsBase64(format = null) {
        const outputFormat = format || this.settings.outputFormat;
        const mimeType = outputFormat === 'png' ? 'image/png' : 
                        outputFormat === 'jpeg' ? 'image/jpeg' : 'image/webp';
        const quality = outputFormat === 'jpeg' ? this.settings.imageQuality : undefined;
        return this.canvas.toDataURL(mimeType, quality);
    }

    // 获取图片Blob
    async getImageBlob(format = null) {
        const outputFormat = format || this.settings.outputFormat;
        const mimeType = outputFormat === 'png' ? 'image/png' : 
                        outputFormat === 'jpeg' ? 'image/jpeg' : 'image/webp';
        const quality = outputFormat === 'jpeg' ? this.settings.imageQuality : undefined;
        
        return new Promise((resolve) => {
            this.canvas.toBlob((blob) => {
                resolve(blob);
            }, mimeType, quality);
        });
    }
}

// 初始化应用
let textToImageEditor;
document.addEventListener('DOMContentLoaded', () => {
    textToImageEditor = new TextToImageEditor();
});
