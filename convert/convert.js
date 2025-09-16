class ImageConverter {
    constructor() {
        this.images = [];
        this.convertedImages = [];
        this.isConverting = false;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupFormatChange();
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
        
        // 设置变化
        document.getElementById('outputFormat').addEventListener('change', () => this.updateQualityVisibility());
        document.getElementById('qualitySlider').addEventListener('input', (e) => this.updateQualityValue(e));
        document.getElementById('resizeEnabled').addEventListener('change', (e) => this.toggleResizeInputs(e));
        document.getElementById('keepAspectRatio').addEventListener('change', (e) => this.handleAspectRatioChange(e));
        document.getElementById('widthInput').addEventListener('input', (e) => this.handleWidthChange(e));
        document.getElementById('heightInput').addEventListener('input', (e) => this.handleHeightChange(e));
        
        // 按钮事件
        document.getElementById('convertAllBtn').addEventListener('click', () => this.convertAllImages());
        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAllImages());
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
                    <button class="btn btn-primary" onclick="imageConverter.convertSingleImage('${imageData.id}')">转换</button>
                    <button class="btn btn-secondary" onclick="imageConverter.removeImage('${imageData.id}')">删除</button>
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

    setupFormatChange() {
        this.updateQualityVisibility();
    }

    updateQualityVisibility() {
        const format = document.getElementById('outputFormat').value;
        const qualityGroup = document.getElementById('qualityGroup');
        
        // JPEG和WebP支持质量设置
        if (format === 'jpeg' || format === 'webp') {
            qualityGroup.style.display = 'flex';
        } else {
            qualityGroup.style.display = 'none';
        }
    }

    updateQualityValue(e) {
        document.getElementById('qualityValue').textContent = e.target.value + '%';
    }

    toggleResizeInputs(e) {
        const sizeInputs = document.getElementById('sizeInputs');
        sizeInputs.style.display = e.target.checked ? 'flex' : 'none';
    }

    handleAspectRatioChange(e) {
        // 保持宽高比的逻辑
        if (e.target.checked) {
            this.aspectRatio = null;
        }
    }

    handleWidthChange(e) {
        if (document.getElementById('keepAspectRatio').checked && this.aspectRatio) {
            const newHeight = Math.round(e.target.value / this.aspectRatio);
            document.getElementById('heightInput').value = newHeight;
        }
    }

    handleHeightChange(e) {
        if (document.getElementById('keepAspectRatio').checked && this.aspectRatio) {
            const newWidth = Math.round(e.target.value * this.aspectRatio);
            document.getElementById('widthInput').value = newWidth;
        }
    }

    async convertSingleImage(imageId) {
        const imageData = this.images.find(img => img.id == imageId);
        if (!imageData) return;

        const convertedImage = await this.convertImage(imageData);
        if (convertedImage) {
            this.convertedImages.push(convertedImage);
            this.displayResults();
        }
    }

    async convertAllImages() {
        if (this.isConverting) return;
        
        this.isConverting = true;
        this.convertedImages = [];
        this.showProgress();
        
        const totalImages = this.images.length;
        let completed = 0;

        for (let i = 0; i < totalImages; i++) {
            const imageData = this.images[i];
            this.updateProgress(completed, totalImages, `正在转换: ${imageData.name}`);
            
            try {
                const convertedImage = await this.convertImage(imageData);
                if (convertedImage) {
                    this.convertedImages.push(convertedImage);
                }
                completed++;
            } catch (error) {
                console.error('转换失败:', error);
                completed++;
            }
        }

        this.updateProgress(totalImages, totalImages, '转换完成');
        this.isConverting = false;
        this.displayResults();
    }

    async convertImage(imageData) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 计算输出尺寸
            let outputWidth = imageData.width;
            let outputHeight = imageData.height;
            
            if (document.getElementById('resizeEnabled').checked) {
                const widthInput = document.getElementById('widthInput').value;
                const heightInput = document.getElementById('heightInput').value;
                
                if (widthInput && heightInput) {
                    outputWidth = parseInt(widthInput);
                    outputHeight = parseInt(heightInput);
                } else if (widthInput) {
                    outputWidth = parseInt(widthInput);
                    if (document.getElementById('keepAspectRatio').checked) {
                        outputHeight = Math.round(outputWidth * imageData.height / imageData.width);
                    }
                } else if (heightInput) {
                    outputHeight = parseInt(heightInput);
                    if (document.getElementById('keepAspectRatio').checked) {
                        outputWidth = Math.round(outputHeight * imageData.width / imageData.height);
                    }
                }
            }
            
            canvas.width = outputWidth;
            canvas.height = outputHeight;
            
            // 绘制图片
            ctx.drawImage(imageData.img, 0, 0, outputWidth, outputHeight);
            
            // 获取输出格式和质量
            const outputFormat = document.getElementById('outputFormat').value;
            const quality = document.getElementById('qualitySlider').value / 100;
            
            // 转换为指定格式
            let mimeType = 'image/jpeg';
            let fileExtension = 'jpg';
            
            switch (outputFormat) {
                case 'png':
                    mimeType = 'image/png';
                    fileExtension = 'png';
                    break;
                case 'webp':
                    mimeType = 'image/webp';
                    fileExtension = 'webp';
                    break;
                case 'bmp':
                    mimeType = 'image/bmp';
                    fileExtension = 'bmp';
                    break;
                default:
                    mimeType = 'image/jpeg';
                    fileExtension = 'jpg';
            }
            
            // 生成数据URL
            const dataUrl = canvas.toDataURL(mimeType, quality);
            
            // 创建Blob
            const byteString = atob(dataUrl.split(',')[1]);
            const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: mimeType });
            
            // 生成文件名
            const originalName = imageData.name.split('.')[0];
            const fileName = `${originalName}_converted.${fileExtension}`;
            
            const convertedImage = {
                id: Date.now() + Math.random(),
                name: fileName,
                size: blob.size,
                width: outputWidth,
                height: outputHeight,
                dataUrl: dataUrl,
                blob: blob,
                mimeType: mimeType
            };
            
            resolve(convertedImage);
        });
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

        this.convertedImages.forEach(imageData => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.innerHTML = `
                <img src="${imageData.dataUrl}" alt="${imageData.name}" class="result-preview" />
                <div class="result-info">${this.formatFileSize(imageData.size)} | ${imageData.width}×${imageData.height}</div>
                <div class="result-name">${imageData.name}</div>
                <div class="result-actions">
                    <button class="btn btn-success" onclick="imageConverter.downloadSingleImage('${imageData.id}')">下载</button>
                </div>
            `;
            resultsGrid.appendChild(resultItem);
        });

        document.getElementById('resultsSection').style.display = 'block';
    }

    downloadSingleImage(imageId) {
        const imageData = this.convertedImages.find(img => img.id == imageId);
        if (!imageData) return;

        const link = document.createElement('a');
        link.download = imageData.name;
        link.href = imageData.dataUrl;
        link.click();
    }

    downloadAllImages() {
        this.convertedImages.forEach(imageData => {
            setTimeout(() => {
                this.downloadSingleImage(imageData.id);
            }, 100);
        });
    }

    async downloadAsZip() {
        if (this.convertedImages.length === 0) {
            alert('没有可下载的图片');
            return;
        }

        // 简单的打包下载 - 创建多个下载链接
        const zipName = `converted_images_${new Date().getTime()}.zip`;
        
        // 由于浏览器限制，我们无法直接创建ZIP文件
        // 这里提供一个替代方案：逐个下载
        alert('由于浏览器限制，将逐个下载图片文件');
        this.downloadAllImages();
    }

    clearAllImages() {
        this.images = [];
        this.convertedImages = [];
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
let imageConverter;
document.addEventListener('DOMContentLoaded', () => {
    imageConverter = new ImageConverter();
});
