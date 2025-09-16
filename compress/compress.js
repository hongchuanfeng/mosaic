class ImageCompressor {
    constructor() {
        this.images = [];
        this.compressedImages = [];
        this.isCompressing = false;
        this.totalOriginalSize = 0;
        this.totalCompressedSize = 0;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupCompressionModeToggle();
        this.setupResizeToggle();
        this.setupResizeModeToggle();
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
        
        // 压缩模式切换
        document.querySelectorAll('input[name="compressionMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handleCompressionModeChange(e));
        });
        
        // 质量控制
        document.getElementById('qualitySlider').addEventListener('input', (e) => this.updateQualityValue(e));
        document.querySelectorAll('.quality-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setQualityPreset(e));
        });
        
        // 文件大小控制
        document.querySelectorAll('.size-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setSizePreset(e));
        });
        
        // 尺寸调整
        document.getElementById('resizeEnabled').addEventListener('change', (e) => this.toggleResize(e));
        document.querySelectorAll('input[name="resizeMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handleResizeModeChange(e));
        });
        document.getElementById('resizePercentage').addEventListener('input', (e) => this.updateResizePercentage(e));
        document.getElementById('keepAspectRatio').addEventListener('change', (e) => this.handleAspectRatioChange(e));
        
        // 按钮事件
        document.getElementById('compressAllBtn').addEventListener('click', () => this.compressAllImages());
        document.getElementById('previewBtn').addEventListener('click', () => this.previewCompression());
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

        if (imageFiles.length > 20) {
            alert('最多只能上传20张图片');
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
                this.totalOriginalSize += file.size;
                this.displayImages();
                this.showSettings();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
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
                    <button class="btn btn-primary" onclick="imageCompressor.compressSingleImage('${imageData.id}')">压缩</button>
                    <button class="btn btn-secondary" onclick="imageCompressor.removeImage('${imageData.id}')">删除</button>
                </div>
            `;
            imagesGrid.appendChild(imageItem);
        });
    }

    removeImage(imageId) {
        const imageIndex = this.images.findIndex(img => img.id == imageId);
        if (imageIndex !== -1) {
            this.totalOriginalSize -= this.images[imageIndex].size;
            this.images.splice(imageIndex, 1);
            this.displayImages();
            
            if (this.images.length === 0) {
                this.hideSettings();
            }
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

    setupCompressionModeToggle() {
        this.handleCompressionModeChange({ target: { value: 'quality' } });
    }

    handleCompressionModeChange(e) {
        const mode = e.target.value;
        const qualityGroup = document.getElementById('qualityGroup');
        const sizeGroup = document.getElementById('sizeGroup');
        
        if (mode === 'quality') {
            qualityGroup.style.display = 'flex';
            sizeGroup.style.display = 'none';
        } else if (mode === 'size') {
            qualityGroup.style.display = 'none';
            sizeGroup.style.display = 'flex';
        } else if (mode === 'custom') {
            qualityGroup.style.display = 'flex';
            sizeGroup.style.display = 'flex';
        }
    }

    setupResizeToggle() {
        const resizeEnabled = document.getElementById('resizeEnabled');
        const resizeControls = document.getElementById('resizeControls');
        
        resizeEnabled.addEventListener('change', (e) => {
            resizeControls.style.display = e.target.checked ? 'block' : 'none';
        });
    }

    setupResizeModeToggle() {
        this.handleResizeModeChange({ target: { value: 'percentage' } });
    }

    handleResizeModeChange(e) {
        const mode = e.target.value;
        const percentageInput = document.getElementById('percentageInput');
        const pixelsInput = document.getElementById('pixelsInput');
        
        if (mode === 'percentage') {
            percentageInput.style.display = 'flex';
            pixelsInput.style.display = 'none';
        } else {
            percentageInput.style.display = 'none';
            pixelsInput.style.display = 'flex';
        }
    }

    updateQualityValue(e) {
        document.getElementById('qualityValue').textContent = e.target.value + '%';
    }

    setQualityPreset(e) {
        const value = parseInt(e.target.dataset.value);
        const slider = document.getElementById('qualitySlider');
        const valueDisplay = document.getElementById('qualityValue');
        
        slider.value = value;
        valueDisplay.textContent = value + '%';
        
        // 更新按钮状态
        document.querySelectorAll('.quality-preset-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
    }

    setSizePreset(e) {
        const value = parseInt(e.target.dataset.value);
        const targetSize = document.getElementById('targetSize');
        const sizeUnit = document.getElementById('sizeUnit');
        
        if (value >= 1000) {
            targetSize.value = value / 1000;
            sizeUnit.value = 'MB';
        } else {
            targetSize.value = value;
            sizeUnit.value = 'KB';
        }
        
        // 更新按钮状态
        document.querySelectorAll('.size-preset-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
    }

    toggleResize(e) {
        const resizeControls = document.getElementById('resizeControls');
        resizeControls.style.display = e.target.checked ? 'block' : 'none';
    }

    updateResizePercentage(e) {
        document.getElementById('resizePercentageValue').textContent = e.target.value + '%';
    }

    handleAspectRatioChange(e) {
        // 保持宽高比的逻辑
        if (e.target.checked) {
            this.aspectRatio = null;
        }
    }

    async compressSingleImage(imageId) {
        const imageData = this.images.find(img => img.id == imageId);
        if (!imageData) return;

        const compressedImage = await this.compressImage(imageData);
        if (compressedImage) {
            this.compressedImages.push(compressedImage);
            this.displayResults();
        }
    }

    async compressAllImages() {
        if (this.isCompressing) return;
        
        this.isCompressing = true;
        this.compressedImages = [];
        this.totalCompressedSize = 0;
        this.showProgress();
        
        const totalImages = this.images.length;
        let completed = 0;

        for (let i = 0; i < totalImages; i++) {
            const imageData = this.images[i];
            this.updateProgress(completed, totalImages, `正在压缩: ${imageData.name}`);
            
            try {
                const compressedImage = await this.compressImage(imageData);
                if (compressedImage) {
                    this.compressedImages.push(compressedImage);
                    this.totalCompressedSize += compressedImage.size;
                }
                completed++;
                this.updateCompressionStats();
            } catch (error) {
                console.error('压缩失败:', error);
                completed++;
            }
        }

        this.updateProgress(totalImages, totalImages, '压缩完成');
        this.isCompressing = false;
        this.displayResults();
    }

    async compressImage(imageData) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 获取压缩设置
            const settings = this.getCompressionSettings();
            
            // 计算输出尺寸
            let outputWidth = imageData.width;
            let outputHeight = imageData.height;
            
            if (settings.resizeEnabled) {
                if (settings.resizeMode === 'percentage') {
                    const percentage = settings.resizePercentage / 100;
                    outputWidth = Math.round(imageData.width * percentage);
                    outputHeight = Math.round(imageData.height * percentage);
                } else {
                    outputWidth = settings.resizeWidth || imageData.width;
                    outputHeight = settings.resizeHeight || imageData.height;
                }
            }
            
            canvas.width = outputWidth;
            canvas.height = outputHeight;
            
            // 绘制图片
            ctx.drawImage(imageData.img, 0, 0, outputWidth, outputHeight);
            
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
            
            // 计算质量
            let quality = settings.quality;
            if (settings.compressionMode === 'size') {
                quality = this.calculateQualityForTargetSize(imageData, outputWidth, outputHeight, settings.targetSizeBytes);
            }
            
            // 生成数据URL
            const dataUrl = canvas.toDataURL(mimeType, quality);
            
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
            const fileName = `${originalName}_compressed.${fileExtension}`;
            
            const compressionRatio = ((imageData.size - blob.size) / imageData.size * 100).toFixed(1);
            
            resolve({
                id: Date.now() + Math.random(),
                name: fileName,
                size: blob.size,
                width: outputWidth,
                height: outputHeight,
                dataUrl: dataUrl,
                blob: blob,
                mimeType: mimeType,
                originalSize: imageData.size,
                compressionRatio: compressionRatio
            });
        });
    }

    getCompressionSettings() {
        const compressionMode = document.querySelector('input[name="compressionMode"]:checked').value;
        const quality = parseInt(document.getElementById('qualitySlider').value) / 100;
        const targetSize = parseInt(document.getElementById('targetSize').value);
        const sizeUnit = document.getElementById('sizeUnit').value;
        const targetSizeBytes = sizeUnit === 'MB' ? targetSize * 1024 * 1024 : targetSize * 1024;
        const resizeEnabled = document.getElementById('resizeEnabled').checked;
        const resizeMode = document.querySelector('input[name="resizeMode"]:checked').value;
        const resizePercentage = parseInt(document.getElementById('resizePercentage').value);
        const resizeWidth = parseInt(document.getElementById('resizeWidth').value);
        const resizeHeight = parseInt(document.getElementById('resizeHeight').value);
        const outputFormat = document.getElementById('outputFormat').value;
        
        return {
            compressionMode,
            quality,
            targetSizeBytes,
            resizeEnabled,
            resizeMode,
            resizePercentage,
            resizeWidth,
            resizeHeight,
            outputFormat
        };
    }

    calculateQualityForTargetSize(imageData, width, height, targetSizeBytes) {
        // 简单的质量计算算法
        let quality = 0.8;
        const estimatedSize = (width * height * 3) / 1000; // 粗略估算
        
        if (estimatedSize > targetSizeBytes) {
            quality = Math.max(0.1, targetSizeBytes / estimatedSize);
        }
        
        return quality;
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

    updateCompressionStats() {
        const compressionRatio = ((this.totalOriginalSize - this.totalCompressedSize) / this.totalOriginalSize * 100).toFixed(1);
        
        document.getElementById('originalSize').textContent = this.formatFileSize(this.totalOriginalSize);
        document.getElementById('compressedSize').textContent = this.formatFileSize(this.totalCompressedSize);
        document.getElementById('compressionRatio').textContent = compressionRatio + '%';
    }

    displayResults() {
        const resultsGrid = document.getElementById('resultsGrid');
        resultsGrid.innerHTML = '';

        this.compressedImages.forEach(imageData => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.innerHTML = `
                <img src="${imageData.dataUrl}" alt="${imageData.name}" class="result-preview" />
                <div class="result-info">${this.formatFileSize(imageData.size)} | ${imageData.width}×${imageData.height}</div>
                <div class="result-name">${imageData.name}</div>
                <div class="compression-info">压缩率: ${imageData.compressionRatio}%</div>
                <div class="result-actions">
                    <button class="btn btn-success" onclick="imageCompressor.downloadSingleImage('${imageData.name}')">下载</button>
                </div>
            `;
            resultsGrid.appendChild(resultItem);
        });

        document.getElementById('resultsSection').style.display = 'block';
    }

    async previewCompression() {
        if (this.images.length === 0) {
            alert('请先选择图片');
            return;
        }

        const firstImage = this.images[0];
        const compressedImage = await this.compressImage(firstImage);
        
        if (compressedImage) {
            alert(`预览结果：\n原始大小: ${this.formatFileSize(firstImage.size)}\n压缩后大小: ${this.formatFileSize(compressedImage.size)}\n压缩率: ${compressedImage.compressionRatio}%`);
        }
    }

    downloadSingleImage(imageName) {
        const imageData = this.compressedImages.find(img => img.name === imageName);
        if (!imageData) return;

        const link = document.createElement('a');
        link.download = imageData.name;
        link.href = imageData.dataUrl;
        link.click();
    }

    downloadAllImages() {
        this.compressedImages.forEach(imageData => {
            setTimeout(() => {
                this.downloadSingleImage(imageData.name);
            }, 100);
        });
    }

    async downloadAsZip() {
        if (this.compressedImages.length === 0) {
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
        this.compressedImages = [];
        this.totalOriginalSize = 0;
        this.totalCompressedSize = 0;
        this.displayImages();
        this.hideSettings();
        document.getElementById('fileInput').value = '';
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
let imageCompressor;
document.addEventListener('DOMContentLoaded', () => {
    imageCompressor = new ImageCompressor();
});
