class WatermarkProcessor {
    constructor() {
        this.images = [];
        this.watermarkedImages = [];
        this.isProcessing = false;
        this.watermarkImage = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupWatermarkTypeToggle();
        this.setupPositionButtons();
        this.setupRotationToggle();
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
        
        // 水印图片上传
        document.getElementById('watermarkImageInput').addEventListener('change', (e) => this.handleWatermarkImageSelect(e));
        
        // 滑块控制
        document.getElementById('fontSizeSlider').addEventListener('input', (e) => this.updateFontSizeValue(e));
        document.getElementById('opacitySlider').addEventListener('input', (e) => this.updateOpacityValue(e));
        document.getElementById('watermarkSizeSlider').addEventListener('input', (e) => this.updateWatermarkSizeValue(e));
        document.getElementById('watermarkOpacitySlider').addEventListener('input', (e) => this.updateWatermarkOpacityValue(e));
        document.getElementById('rotationSlider').addEventListener('input', (e) => this.updateRotationValue(e));
        
        // 自定义位置切换
        document.getElementById('customPosition').addEventListener('change', (e) => this.toggleCustomPosition(e));
        
        // 旋转切换
        document.getElementById('rotateWatermark').addEventListener('change', (e) => this.toggleRotation(e));
        
        // 按钮事件
        document.getElementById('addWatermarkBtn').addEventListener('click', () => this.addWatermarkToAll());
        document.getElementById('previewBtn').addEventListener('click', () => this.previewWatermark());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('downloadAllBtn').addEventListener('click', () => this.downloadAllImages());
        document.getElementById('downloadZipBtn').addEventListener('click', () => this.downloadAsZip());
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

        if (imageFiles.length > 10) {
            alert('最多只能上传10张图片');
            return;
        }

        imageFiles.forEach(file => this.loadImage(file));
    }

    loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const imageData = {
                    id: Date.now() + Math.random(),
                    file: file,
                    name: file.name,
                    size: file.size,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    dataUrl: e.target.result,
                    img: img
                };
                
                this.images.push(imageData);
                this.displayImages();
                this.showSettings();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    handleWatermarkImageSelect(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    this.watermarkImage = img;
                    this.displayWatermarkPreview(img);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    displayWatermarkPreview(img) {
        const preview = document.getElementById('watermarkImagePreview');
        preview.innerHTML = '';
        const imgElement = document.createElement('img');
        imgElement.src = img.src;
        imgElement.style.maxWidth = '100%';
        imgElement.style.maxHeight = '100%';
        imgElement.style.objectFit = 'contain';
        preview.appendChild(imgElement);
    }

    displayImages() {
        const imagesGrid = document.getElementById('imagesGrid');
        imagesGrid.innerHTML = '';

        this.images.forEach(imageData => {
            const imageItem = document.createElement('div');
            imageItem.className = 'image-item';
            imageItem.innerHTML = `
                <img src="${imageData.dataUrl}" alt="${imageData.name}" class="image-preview" />
                <div class="image-info">${this.formatFileSize(imageData.size)} | ${imageData.width}×${imageData.height}</div>
                <div class="image-name">${imageData.name}</div>
                <div class="image-actions">
                    <button class="btn btn-primary" onclick="watermarkProcessor.addWatermarkToSingle('${imageData.id}')">添加水印</button>
                    <button class="btn btn-secondary" onclick="watermarkProcessor.removeImage('${imageData.id}')">删除</button>
                </div>
            `;
            imagesGrid.appendChild(imageItem);
        });
    }

    removeImage(imageId) {
        this.images = this.images.filter(img => img.id != imageId);
        this.displayImages();
        
        if (this.images.length === 0) {
            this.hideSettings();
        }
    }

    showSettings() {
        document.getElementById('settingsSection').style.display = 'block';
        document.getElementById('imagesSection').style.display = 'block';
    }

    hideSettings() {
        document.getElementById('settingsSection').style.display = 'none';
        document.getElementById('imagesSection').style.display = 'none';
        document.getElementById('progressSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'none';
    }

    setupWatermarkTypeToggle() {
        document.querySelectorAll('input[name="watermarkType"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handleWatermarkTypeChange(e));
        });
    }

    handleWatermarkTypeChange(e) {
        const textGroup = document.getElementById('textWatermarkGroup');
        const imageGroup = document.getElementById('imageWatermarkGroup');
        
        if (e.target.value === 'text') {
            textGroup.style.display = 'flex';
            imageGroup.style.display = 'none';
        } else {
            textGroup.style.display = 'none';
            imageGroup.style.display = 'flex';
        }
    }

    setupPositionButtons() {
        document.querySelectorAll('.position-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setPosition(e));
        });
    }

    setPosition(e) {
        // 更新按钮状态
        document.querySelectorAll('.position-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
    }

    setupRotationToggle() {
        const rotateCheckbox = document.getElementById('rotateWatermark');
        const rotationControl = document.getElementById('rotationControl');
        
        rotateCheckbox.addEventListener('change', (e) => {
            rotationControl.style.display = e.target.checked ? 'block' : 'none';
        });
    }

    toggleCustomPosition(e) {
        const positionInputs = document.getElementById('positionInputs');
        positionInputs.style.display = e.target.checked ? 'flex' : 'none';
    }

    toggleRotation(e) {
        const rotationControl = document.getElementById('rotationControl');
        rotationControl.style.display = e.target.checked ? 'block' : 'none';
    }

    updateFontSizeValue(e) {
        document.getElementById('fontSizeValue').textContent = e.target.value + 'px';
    }

    updateOpacityValue(e) {
        document.getElementById('opacityValue').textContent = e.target.value + '%';
    }

    updateWatermarkSizeValue(e) {
        document.getElementById('watermarkSizeValue').textContent = e.target.value + 'px';
    }

    updateWatermarkOpacityValue(e) {
        document.getElementById('watermarkOpacityValue').textContent = e.target.value + '%';
    }

    updateRotationValue(e) {
        document.getElementById('rotationValue').textContent = e.target.value + '°';
    }

    async addWatermarkToSingle(imageId) {
        const imageData = this.images.find(img => img.id == imageId);
        if (!imageData) return;

        const watermarkedImage = await this.addWatermark(imageData);
        if (watermarkedImage) {
            this.watermarkedImages.push(watermarkedImage);
            this.displayResults();
        }
    }

    async addWatermarkToAll() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.watermarkedImages = [];
        this.showProgress();
        
        const totalImages = this.images.length;
        let completed = 0;

        for (let i = 0; i < totalImages; i++) {
            const imageData = this.images[i];
            this.updateProgress(completed, totalImages, `正在处理: ${imageData.name}`);
            
            try {
                const watermarkedImage = await this.addWatermark(imageData);
                if (watermarkedImage) {
                    this.watermarkedImages.push(watermarkedImage);
                }
                completed++;
            } catch (error) {
                console.error('添加水印失败:', error);
                completed++;
            }
        }

        this.updateProgress(totalImages, totalImages, '处理完成');
        this.isProcessing = false;
        this.displayResults();
    }

    async addWatermark(imageData) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = imageData.width;
            canvas.height = imageData.height;
            
            // 绘制原图
            ctx.drawImage(imageData.img, 0, 0);
            
            // 获取水印设置
            const settings = this.getWatermarkSettings();
            
            if (settings.watermarkType === 'text') {
                this.addTextWatermark(ctx, settings, canvas.width, canvas.height);
            } else if (settings.watermarkType === 'image' && this.watermarkImage) {
                this.addImageWatermark(ctx, settings, canvas.width, canvas.height);
            }
            
            // 获取输出格式
            let mimeType = imageData.file.type;
            let fileExtension = this.getFileExtension(imageData.file.name);
            
            if (settings.outputFormat !== 'original') {
                switch (settings.outputFormat) {
                    case 'jpeg':
                        mimeType = 'image/jpeg';
                        fileExtension = 'jpg';
                        break;
                    case 'png':
                        mimeType = 'image/png';
                        fileExtension = 'png';
                        break;
                    case 'webp':
                        mimeType = 'image/webp';
                        fileExtension = 'webp';
                        break;
                }
            }
            
            // 生成数据URL
            const dataUrl = canvas.toDataURL(mimeType, settings.maintainQuality ? 1.0 : 0.9);
            
            // 创建Blob
            const byteString = atob(dataUrl.split(',')[1]);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: mimeType });
            
            // 生成文件名
            const originalName = imageData.name.split('.')[0];
            const fileName = `${originalName}_watermarked.${fileExtension}`;
            
            resolve({
                id: Date.now() + Math.random(),
                name: fileName,
                size: blob.size,
                width: imageData.width,
                height: imageData.height,
                dataUrl: dataUrl,
                blob: blob,
                mimeType: mimeType
            });
        });
    }

    getWatermarkSettings() {
        const watermarkType = document.querySelector('input[name="watermarkType"]:checked').value;
        const watermarkText = document.getElementById('watermarkText').value;
        const fontSize = parseInt(document.getElementById('fontSizeSlider').value);
        const textColor = document.getElementById('textColor').value;
        const opacity = parseInt(document.getElementById('opacitySlider').value) / 100;
        const fontFamily = document.getElementById('fontFamily').value;
        const watermarkSize = parseInt(document.getElementById('watermarkSizeSlider').value);
        const watermarkOpacity = parseInt(document.getElementById('watermarkOpacitySlider').value) / 100;
        const position = this.getSelectedPosition();
        const addShadow = document.getElementById('addShadow').checked;
        const addBorder = document.getElementById('addBorder').checked;
        const rotateWatermark = document.getElementById('rotateWatermark').checked;
        const rotation = parseInt(document.getElementById('rotationSlider').value);
        const maintainQuality = document.getElementById('maintainQuality').checked;
        const outputFormat = document.getElementById('outputFormat').value;
        
        return {
            watermarkType,
            watermarkText,
            fontSize,
            textColor,
            opacity,
            fontFamily,
            watermarkSize,
            watermarkOpacity,
            position,
            addShadow,
            addBorder,
            rotateWatermark,
            rotation,
            maintainQuality,
            outputFormat
        };
    }

    getSelectedPosition() {
        const activeBtn = document.querySelector('.position-btn.active');
        if (activeBtn) {
            return activeBtn.dataset.position;
        }
        return 'bottom-right';
    }

    addTextWatermark(ctx, settings, canvasWidth, canvasHeight) {
        const { watermarkText, fontSize, textColor, opacity, fontFamily, position, addShadow, addBorder, rotateWatermark, rotation } = settings;
        
        if (!watermarkText) return;
        
        // 设置字体
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = textColor;
        ctx.globalAlpha = opacity;
        
        // 计算文字位置
        const textMetrics = ctx.measureText(watermarkText);
        const textWidth = textMetrics.width;
        const textHeight = fontSize;
        
        const positionCoords = this.calculatePosition(position, textWidth, textHeight, canvasWidth, canvasHeight);
        
        // 保存当前状态
        ctx.save();
        
        // 移动到文字位置
        ctx.translate(positionCoords.x, positionCoords.y);
        
        // 旋转
        if (rotateWatermark) {
            ctx.rotate((rotation * Math.PI) / 180);
        }
        
        // 添加阴影
        if (addShadow) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
        }
        
        // 添加边框
        if (addBorder) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeText(watermarkText, 0, textHeight);
        }
        
        // 绘制文字
        ctx.fillText(watermarkText, 0, textHeight);
        
        // 恢复状态
        ctx.restore();
    }

    addImageWatermark(ctx, settings, canvasWidth, canvasHeight) {
        const { watermarkSize, watermarkOpacity, position, addShadow, addBorder, rotateWatermark, rotation } = settings;
        
        if (!this.watermarkImage) return;
        
        // 计算水印图片尺寸
        const aspectRatio = this.watermarkImage.width / this.watermarkImage.height;
        let watermarkWidth = watermarkSize;
        let watermarkHeight = watermarkSize / aspectRatio;
        
        // 计算位置
        const positionCoords = this.calculatePosition(position, watermarkWidth, watermarkHeight, canvasWidth, canvasHeight);
        
        // 保存当前状态
        ctx.save();
        
        // 移动到水印位置
        ctx.translate(positionCoords.x + watermarkWidth / 2, positionCoords.y + watermarkHeight / 2);
        
        // 旋转
        if (rotateWatermark) {
            ctx.rotate((rotation * Math.PI) / 180);
        }
        
        // 设置透明度
        ctx.globalAlpha = watermarkOpacity;
        
        // 添加阴影
        if (addShadow) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
        }
        
        // 添加边框
        if (addBorder) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(-watermarkWidth / 2, -watermarkHeight / 2, watermarkWidth, watermarkHeight);
        }
        
        // 绘制水印图片
        ctx.drawImage(this.watermarkImage, -watermarkWidth / 2, -watermarkHeight / 2, watermarkWidth, watermarkHeight);
        
        // 恢复状态
        ctx.restore();
    }

    calculatePosition(position, elementWidth, elementHeight, canvasWidth, canvasHeight) {
        const margin = 20;
        
        switch (position) {
            case 'top-left':
                return { x: margin, y: elementHeight + margin };
            case 'top-center':
                return { x: (canvasWidth - elementWidth) / 2, y: elementHeight + margin };
            case 'top-right':
                return { x: canvasWidth - elementWidth - margin, y: elementHeight + margin };
            case 'middle-left':
                return { x: margin, y: (canvasHeight + elementHeight) / 2 };
            case 'center':
                return { x: (canvasWidth - elementWidth) / 2, y: (canvasHeight + elementHeight) / 2 };
            case 'middle-right':
                return { x: canvasWidth - elementWidth - margin, y: (canvasHeight + elementHeight) / 2 };
            case 'bottom-left':
                return { x: margin, y: canvasHeight - margin };
            case 'bottom-center':
                return { x: (canvasWidth - elementWidth) / 2, y: canvasHeight - margin };
            case 'bottom-right':
            default:
                return { x: canvasWidth - elementWidth - margin, y: canvasHeight - margin };
        }
    }

    getFileExtension(fileName) {
        return fileName.split('.').pop().toLowerCase();
    }

    showProgress() {
        document.getElementById('progressSection').style.display = 'block';
    }

    updateProgress(current, total, text) {
        const percentage = (current / total) * 100;
        document.getElementById('progressFill').style.width = percentage + '%';
        document.getElementById('progressText').textContent = text;
    }

    displayResults() {
        const resultsGrid = document.getElementById('resultsGrid');
        resultsGrid.innerHTML = '';

        this.watermarkedImages.forEach(imageData => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.innerHTML = `
                <img src="${imageData.dataUrl}" alt="${imageData.name}" class="result-preview" />
                <div class="result-info">${this.formatFileSize(imageData.size)} | ${imageData.width}×${imageData.height}</div>
                <div class="result-name">${imageData.name}</div>
                <div class="result-actions">
                    <button class="btn btn-success" onclick="watermarkProcessor.downloadSingleImage('${imageData.name}')">下载</button>
                </div>
            `;
            resultsGrid.appendChild(resultItem);
        });

        document.getElementById('resultsSection').style.display = 'block';
    }

    async previewWatermark() {
        if (this.images.length === 0) {
            alert('请先选择图片');
            return;
        }

        const firstImage = this.images[0];
        const watermarkedImage = await this.addWatermark(firstImage);
        
        if (watermarkedImage) {
            // 创建预览窗口
            const previewWindow = window.open('', '_blank', 'width=1000,height=600');
            previewWindow.document.write(`
                <html>
                    <head>
                        <title>水印预览</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
                            .preview-container { display: flex; gap: 20px; justify-content: center; }
                            .preview-item { text-align: center; }
                            .preview-item h3 { margin-bottom: 10px; }
                            .preview-item img { max-width: 400px; max-height: 400px; border: 1px solid #ddd; }
                        </style>
                    </head>
                    <body>
                        <h2>水印预览</h2>
                        <div class="preview-container">
                            <div class="preview-item">
                                <h3>原图</h3>
                                <img src="${firstImage.dataUrl}" alt="原图" />
                            </div>
                            <div class="preview-item">
                                <h3>加水印后</h3>
                                <img src="${watermarkedImage.dataUrl}" alt="加水印后" />
                            </div>
                        </div>
                    </body>
                </html>
            `);
        }
    }

    downloadSingleImage(imageName) {
        const imageData = this.watermarkedImages.find(img => img.name === imageName);
        if (!imageData) return;

        const link = document.createElement('a');
        link.download = imageData.name;
        link.href = imageData.dataUrl;
        link.click();
    }

    downloadAllImages() {
        this.watermarkedImages.forEach(imageData => {
            setTimeout(() => {
                this.downloadSingleImage(imageData.name);
            }, 100);
        });
    }

    async downloadAsZip() {
        if (this.watermarkedImages.length === 0) {
            alert('没有可下载的图片');
            return;
        }

        // 由于浏览器限制，我们无法直接创建ZIP文件
        // 这里提供一个替代方案：逐个下载
        alert('由于浏览器限制，将逐个下载图片文件');
        this.downloadAllImages();
    }

    clearAll() {
        this.images = [];
        this.watermarkedImages = [];
        this.watermarkImage = null;
        this.displayImages();
        this.hideSettings();
        document.getElementById('fileInput').value = '';
        document.getElementById('watermarkImageInput').value = '';
        document.getElementById('watermarkImagePreview').innerHTML = '';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// 初始化应用
let watermarkProcessor;
document.addEventListener('DOMContentLoaded', () => {
    watermarkProcessor = new WatermarkProcessor();
});
