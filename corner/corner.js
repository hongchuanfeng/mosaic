class ImageCornerProcessor {
    constructor() {
        this.originalImage = null;
        this.canvas = null;
        this.ctx = null;
        this.settings = {
            cornerType: 'uniform',
            cornerRadius: 30,
            topLeftRadius: 30,
            topRightRadius: 30,
            bottomLeftRadius: 30,
            bottomRightRadius: 30,
            circleSize: 200,
            autoCrop: true,
            backgroundType: 'color',
            backgroundColor: '#ffffff',
            sizeMode: 'original',
            customWidth: 400,
            customHeight: 300,
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
        
        // 圆角类型切换
        document.querySelectorAll('input[name="cornerType"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handleCornerTypeChange(e));
        });
        
        // 统一圆角设置
        document.getElementById('cornerRadius').addEventListener('input', (e) => {
            this.settings.cornerRadius = parseInt(e.target.value);
            document.getElementById('cornerRadiusValue').textContent = e.target.value + 'px';
            this.updatePreview();
        });
        
        // 快速设置按钮
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const radius = parseInt(e.target.dataset.radius);
                this.settings.cornerRadius = radius;
                document.getElementById('cornerRadius').value = radius;
                document.getElementById('cornerRadiusValue').textContent = radius + 'px';
                this.updatePreview();
            });
        });
        
        // 自定义圆角设置
        document.getElementById('topLeftRadius').addEventListener('input', (e) => {
            this.settings.topLeftRadius = parseInt(e.target.value);
            document.getElementById('topLeftRadiusValue').textContent = e.target.value + 'px';
            this.updatePreview();
        });
        
        document.getElementById('topRightRadius').addEventListener('input', (e) => {
            this.settings.topRightRadius = parseInt(e.target.value);
            document.getElementById('topRightRadiusValue').textContent = e.target.value + 'px';
            this.updatePreview();
        });
        
        document.getElementById('bottomLeftRadius').addEventListener('input', (e) => {
            this.settings.bottomLeftRadius = parseInt(e.target.value);
            document.getElementById('bottomLeftRadiusValue').textContent = e.target.value + 'px';
            this.updatePreview();
        });
        
        document.getElementById('bottomRightRadius').addEventListener('input', (e) => {
            this.settings.bottomRightRadius = parseInt(e.target.value);
            document.getElementById('bottomRightRadiusValue').textContent = e.target.value + 'px';
            this.updatePreview();
        });
        
        // 圆形图片设置
        document.getElementById('circleSize').addEventListener('input', (e) => {
            this.settings.circleSize = parseInt(e.target.value);
            document.getElementById('circleSizeValue').textContent = e.target.value + 'px';
            this.updatePreview();
        });
        
        // 圆形快速设置按钮
        document.querySelectorAll('.preset-btn[data-size]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.settings.cornerType === 'circle') {
                    document.querySelectorAll('.preset-btn[data-size]').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    const size = parseInt(e.target.dataset.size);
                    this.settings.circleSize = size;
                    document.getElementById('circleSize').value = size;
                    document.getElementById('circleSizeValue').textContent = size + 'px';
                    this.updatePreview();
                }
            });
        });
        
        document.getElementById('autoCrop').addEventListener('change', (e) => {
            this.settings.autoCrop = e.target.checked;
            this.updatePreview();
        });
        
        // 背景设置
        document.querySelectorAll('input[name="backgroundType"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handleBackgroundTypeChange(e));
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
        
        // 尺寸设置
        document.querySelectorAll('input[name="sizeMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handleSizeModeChange(e));
        });
        
        document.getElementById('customWidth').addEventListener('input', (e) => {
            this.settings.customWidth = parseInt(e.target.value);
            this.updatePreview();
        });
        
        document.getElementById('customHeight').addEventListener('input', (e) => {
            this.settings.customHeight = parseInt(e.target.value);
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
        document.getElementById('processBtn').addEventListener('click', () => this.processImage());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearImage());
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
        
        if (this.settings.cornerType === 'circle') {
            // 圆形图片使用固定尺寸
            this.canvas.width = this.settings.circleSize;
            this.canvas.height = this.settings.circleSize;
        } else if (this.settings.sizeMode === 'original') {
            this.canvas.width = this.originalImage.width;
            this.canvas.height = this.originalImage.height;
        } else {
            this.canvas.width = this.settings.customWidth;
            this.canvas.height = this.settings.customHeight;
        }
    }

    isValidHex(hex) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
    }

    handleCornerTypeChange(e) {
        this.settings.cornerType = e.target.value;
        
        const uniformGroup = document.getElementById('uniformCornerGroup');
        const customGroup = document.getElementById('customCornerGroup');
        const circleGroup = document.getElementById('circleGroup');
        
        // 隐藏所有组
        uniformGroup.style.display = 'none';
        customGroup.style.display = 'none';
        circleGroup.style.display = 'none';
        
        // 显示对应的组
        if (e.target.value === 'uniform') {
            uniformGroup.style.display = 'block';
        } else if (e.target.value === 'custom') {
            customGroup.style.display = 'block';
        } else if (e.target.value === 'circle') {
            circleGroup.style.display = 'block';
        }
        
        this.updatePreview();
    }

    handleBackgroundTypeChange(e) {
        this.settings.backgroundType = e.target.value;
        
        const backgroundColorGroup = document.getElementById('backgroundColorGroup');
        if (e.target.value === 'color' || e.target.value === 'gradient') {
            backgroundColorGroup.style.display = 'block';
        } else {
            backgroundColorGroup.style.display = 'none';
        }
        
        this.updatePreview();
    }

    handleSizeModeChange(e) {
        this.settings.sizeMode = e.target.value;
        
        const sizeInputs = document.getElementById('sizeInputs');
        if (e.target.value === 'custom') {
            sizeInputs.style.display = 'flex';
        } else {
            sizeInputs.style.display = 'none';
        }
        
        this.setupCanvas();
        this.updatePreview();
    }

    toggleQualityGroup() {
        const qualityGroup = document.getElementById('qualityGroup');
        if (this.settings.outputFormat === 'jpeg') {
            qualityGroup.style.display = 'block';
        } else {
            qualityGroup.style.display = 'none';
        }
    }

    getCornerRadius() {
        if (this.settings.cornerType === 'uniform') {
            return {
                topLeft: this.settings.cornerRadius,
                topRight: this.settings.cornerRadius,
                bottomLeft: this.settings.cornerRadius,
                bottomRight: this.settings.cornerRadius
            };
        } else {
            return {
                topLeft: this.settings.topLeftRadius,
                topRight: this.settings.topRightRadius,
                bottomLeft: this.settings.bottomLeftRadius,
                bottomRight: this.settings.bottomRightRadius
            };
        }
    }

    drawRoundedRect(x, y, width, height, radius) {
        const { topLeft, topRight, bottomLeft, bottomRight } = radius;
        
        this.ctx.beginPath();
        // 从左上角开始
        this.ctx.moveTo(x + topLeft, y);
        // 上边
        this.ctx.lineTo(x + width - topRight, y);
        // 右上角
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + topRight);
        // 右边
        this.ctx.lineTo(x + width, y + height - bottomRight);
        // 右下角
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - bottomRight, y + height);
        // 下边
        this.ctx.lineTo(x + bottomLeft, y + height);
        // 左下角
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - bottomLeft);
        // 左边
        this.ctx.lineTo(x, y + topLeft);
        // 左上角
        this.ctx.quadraticCurveTo(x, y, x + topLeft, y);
        this.ctx.closePath();
    }

    drawRoundedRectMask(x, y, width, height, radius) {
        const { topLeft, topRight, bottomLeft, bottomRight } = radius;
        
        this.ctx.beginPath();
        // 从左上角开始
        this.ctx.moveTo(x + topLeft, y);
        // 上边
        this.ctx.lineTo(x + width - topRight, y);
        // 右上角
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + topRight);
        // 右边
        this.ctx.lineTo(x + width, y + height - bottomRight);
        // 右下角
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - bottomRight, y + height);
        // 下边
        this.ctx.lineTo(x + bottomLeft, y + height);
        // 左下角
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - bottomLeft);
        // 左边
        this.ctx.lineTo(x, y + topLeft);
        // 左上角
        this.ctx.quadraticCurveTo(x, y, x + topLeft, y);
        this.ctx.closePath();
    }

    drawCircleMask() {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const radius = canvasWidth / 2;
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.closePath();
    }

    drawBackground() {
        const { backgroundType, backgroundColor } = this.settings;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        if (backgroundType === 'transparent') {
            // 透明背景不需要绘制
            return;
        } else if (backgroundType === 'color') {
            // 创建圆角背景
            this.ctx.save();
            if (this.settings.cornerType === 'circle') {
                this.drawCircleMask();
            } else {
                this.drawRoundedRectMask(0, 0, canvasWidth, canvasHeight, this.getCornerRadius());
            }
            this.ctx.clip();
            
            // 在剪切区域内绘制背景色
            this.ctx.fillStyle = backgroundColor;
            this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            this.ctx.restore();
        } else if (backgroundType === 'gradient') {
            // 创建圆角背景
            this.ctx.save();
            if (this.settings.cornerType === 'circle') {
                this.drawCircleMask();
            } else {
                this.drawRoundedRectMask(0, 0, canvasWidth, canvasHeight, this.getCornerRadius());
            }
            this.ctx.clip();
            
            // 在剪切区域内绘制渐变背景
            const gradient = this.ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
            gradient.addColorStop(0, backgroundColor);
            gradient.addColorStop(1, this.lightenColor(backgroundColor, 20));
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            this.ctx.restore();
        }
    }

    drawRoundedImage() {
        if (!this.originalImage) return;
        
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        if (this.settings.cornerType === 'circle') {
            this.drawCircleImage();
        } else {
            const radius = this.getCornerRadius();
            
            // 创建圆角路径并剪切
            this.ctx.save();
            this.drawRoundedRect(0, 0, canvasWidth, canvasHeight, radius);
            this.ctx.clip();
            
            // 绘制图片
            if (this.settings.sizeMode === 'original') {
                this.ctx.drawImage(this.originalImage.img, 0, 0);
            } else {
                this.ctx.drawImage(this.originalImage.img, 0, 0, canvasWidth, canvasHeight);
            }
            
            this.ctx.restore();
        }
    }

    drawCircleImage() {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const radius = canvasWidth / 2;
        
        // 创建圆形路径
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.closePath();
        
        // 剪切路径
        this.ctx.save();
        this.ctx.clip();
        
        // 绘制图片
        if (this.settings.autoCrop) {
            // 自动裁剪为正方形
            const imgSize = Math.min(this.originalImage.width, this.originalImage.height);
            const sourceX = (this.originalImage.width - imgSize) / 2;
            const sourceY = (this.originalImage.height - imgSize) / 2;
            
            this.ctx.drawImage(
                this.originalImage.img,
                sourceX, sourceY, imgSize, imgSize,
                0, 0, canvasWidth, canvasHeight
            );
        } else {
            // 直接绘制，可能会变形
            this.ctx.drawImage(this.originalImage.img, 0, 0, canvasWidth, canvasHeight);
        }
        
        this.ctx.restore();
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

    updatePreview() {
        if (!this.originalImage) return;
        
        // 清空canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 先绘制背景
        this.drawBackground();
        
        // 再绘制圆角图片
        this.drawRoundedImage();
    }

    previewImage() {
        if (!this.originalImage) {
            alert('请先上传图片');
            return;
        }

        this.updatePreview();
        document.getElementById('previewSection').style.display = 'block';
        
        // 滚动到预览区域
        document.getElementById('previewSection').scrollIntoView({ 
            behavior: 'smooth' 
        });
    }

    processImage() {
        if (!this.originalImage) {
            alert('请先上传图片');
            return;
        }

        this.previewImage();
    }

    downloadImage(format = null) {
        if (!this.originalImage) {
            alert('请先生成圆角图片');
            return;
        }

        const outputFormat = format || this.settings.outputFormat;
        const mimeType = outputFormat === 'png' ? 'image/png' : 
                        outputFormat === 'jpeg' ? 'image/jpeg' : 'image/webp';
        const quality = outputFormat === 'jpeg' ? this.settings.imageQuality : undefined;
        
        // 创建下载链接
        const link = document.createElement('a');
        link.download = `rounded-image-${Date.now()}.${outputFormat}`;
        link.href = this.canvas.toDataURL(mimeType, quality);
        link.click();
    }

    clearImage() {
        this.originalImage = null;
        this.hideSettings();
        document.getElementById('fileInput').value = '';
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

    updateUI() {
        // 更新UI元素以反映当前设置
        document.querySelector(`input[name="cornerType"][value="${this.settings.cornerType}"]`).checked = true;
        document.getElementById('cornerRadius').value = this.settings.cornerRadius;
        document.getElementById('cornerRadiusValue').textContent = this.settings.cornerRadius + 'px';
        document.getElementById('topLeftRadius').value = this.settings.topLeftRadius;
        document.getElementById('topLeftRadiusValue').textContent = this.settings.topLeftRadius + 'px';
        document.getElementById('topRightRadius').value = this.settings.topRightRadius;
        document.getElementById('topRightRadiusValue').textContent = this.settings.topRightRadius + 'px';
        document.getElementById('bottomLeftRadius').value = this.settings.bottomLeftRadius;
        document.getElementById('bottomLeftRadiusValue').textContent = this.settings.bottomLeftRadius + 'px';
        document.getElementById('bottomRightRadius').value = this.settings.bottomRightRadius;
        document.getElementById('bottomRightRadiusValue').textContent = this.settings.bottomRightRadius + 'px';
        document.getElementById('circleSize').value = this.settings.circleSize;
        document.getElementById('circleSizeValue').textContent = this.settings.circleSize + 'px';
        document.getElementById('autoCrop').checked = this.settings.autoCrop;
        document.querySelector(`input[name="backgroundType"][value="${this.settings.backgroundType}"]`).checked = true;
        document.getElementById('backgroundColor').value = this.settings.backgroundColor;
        document.getElementById('backgroundColorHex').value = this.settings.backgroundColor;
        document.querySelector(`input[name="sizeMode"][value="${this.settings.sizeMode}"]`).checked = true;
        document.getElementById('customWidth').value = this.settings.customWidth;
        document.getElementById('customHeight').value = this.settings.customHeight;
        document.getElementById('outputFormat').value = this.settings.outputFormat;
        document.getElementById('imageQuality').value = this.settings.imageQuality;
        document.getElementById('imageQualityValue').textContent = Math.round(this.settings.imageQuality * 100) + '%';
        
        // 触发相关事件
        this.handleCornerTypeChange({ target: { value: this.settings.cornerType } });
        this.handleBackgroundTypeChange({ target: { value: this.settings.backgroundType } });
        this.handleSizeModeChange({ target: { value: this.settings.sizeMode } });
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
let imageCornerProcessor;
document.addEventListener('DOMContentLoaded', () => {
    imageCornerProcessor = new ImageCornerProcessor();
});
