class ImageExpander {
    constructor() {
        this.images = [];
        this.expandedImages = [];
        this.isProcessing = false;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupPresetButtons();
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
        
        // 滑块控制
        document.getElementById('scaleSlider').addEventListener('input', (e) => this.updateScaleValue(e));
        document.getElementById('qualitySlider').addEventListener('input', (e) => this.updateQualityValue(e));
        
        // 按钮事件
        document.getElementById('expandBtn').addEventListener('click', () => this.expandAllImages());
        document.getElementById('previewBtn').addEventListener('click', () => this.previewExpansion());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('downloadAllBtn').addEventListener('click', () => this.downloadAllImages());
        document.getElementById('downloadZipBtn').addEventListener('click', () => this.downloadAsZip());
        
        // 尺寸控制
        document.getElementById('resetSizeBtn').addEventListener('click', () => this.resetSize());
        document.getElementById('calculateSizeBtn').addEventListener('click', () => this.calculateSize());
        document.getElementById('targetWidth').addEventListener('input', (e) => this.handleSizeChange(e));
        document.getElementById('targetHeight').addEventListener('input', (e) => this.handleSizeChange(e));
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

        if (imageFiles.length > 5) {
            alert('最多只能上传5张图片');
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
                    <button class="btn btn-primary" onclick="imageExpander.expandSingleImage('${imageData.id}')">放大</button>
                    <button class="btn btn-outline" onclick="imageExpander.removeImage('${imageData.id}')">删除</button>
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

    setupPresetButtons() {
        // 放大倍数预设按钮
        document.querySelectorAll('.scale-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setScalePreset(e));
        });
        
        // 质量预设按钮
        document.querySelectorAll('.quality-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setQualityPreset(e));
        });
    }

    setScalePreset(e) {
        const value = parseFloat(e.target.dataset.value);
        const slider = document.getElementById('scaleSlider');
        const valueDisplay = document.getElementById('scaleValue');
        
        slider.value = value;
        valueDisplay.textContent = value + 'x';
        
        // 更新按钮状态
        document.querySelectorAll('.scale-preset-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
        
        // 计算新尺寸
        this.calculateSize();
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

    updateScaleValue(e) {
        document.getElementById('scaleValue').textContent = e.target.value + 'x';
        this.calculateSize();
    }

    updateQualityValue(e) {
        document.getElementById('qualityValue').textContent = e.target.value + '%';
    }

    calculateSize() {
        if (this.images.length === 0) return;
        
        const firstImage = this.images[0];
        const scale = parseFloat(document.getElementById('scaleSlider').value);
        const preserveAspectRatio = document.getElementById('preserveAspectRatio').checked;
        
        if (preserveAspectRatio) {
            const newWidth = Math.round(firstImage.width * scale);
            const newHeight = Math.round(firstImage.height * scale);
            
            document.getElementById('targetWidth').value = newWidth;
            document.getElementById('targetHeight').value = newHeight;
        }
    }

    resetSize() {
        document.getElementById('targetWidth').value = '';
        document.getElementById('targetHeight').value = '';
        this.calculateSize();
    }

    handleSizeChange(e) {
        const preserveAspectRatio = document.getElementById('preserveAspectRatio').checked;
        
        if (preserveAspectRatio && this.images.length > 0) {
            const firstImage = this.images[0];
            const aspectRatio = firstImage.width / firstImage.height;
            
            if (e.target.id === 'targetWidth') {
                const newHeight = Math.round(e.target.value / aspectRatio);
                document.getElementById('targetHeight').value = newHeight;
            } else if (e.target.id === 'targetHeight') {
                const newWidth = Math.round(e.target.value * aspectRatio);
                document.getElementById('targetWidth').value = newWidth;
            }
        }
    }

    async expandSingleImage(imageId) {
        const imageData = this.images.find(img => img.id == imageId);
        if (!imageData) return;

        const expandedImage = await this.expandImage(imageData);
        if (expandedImage) {
            this.expandedImages.push(expandedImage);
            this.displayResults();
        }
    }

    async expandAllImages() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.expandedImages = [];
        this.showProgress();
        
        const totalImages = this.images.length;
        let completed = 0;

        for (let i = 0; i < totalImages; i++) {
            const imageData = this.images[i];
            this.updateProgress(completed, totalImages, `正在放大: ${imageData.name}`);
            
            try {
                const expandedImage = await this.expandImage(imageData);
                if (expandedImage) {
                    this.expandedImages.push(expandedImage);
                }
                completed++;
            } catch (error) {
                console.error('图片放大失败:', error);
                completed++;
            }
        }

        this.updateProgress(totalImages, totalImages, '处理完成');
        this.isProcessing = false;
        this.displayResults();
    }

    async expandImage(imageData) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 获取设置
            const settings = this.getExpansionSettings();
            
            // 计算目标尺寸
            let targetWidth, targetHeight;
            
            if (settings.targetWidth && settings.targetHeight) {
                targetWidth = parseInt(settings.targetWidth);
                targetHeight = parseInt(settings.targetHeight);
            } else {
                const scale = settings.scale;
                targetWidth = Math.round(imageData.width * scale);
                targetHeight = Math.round(imageData.height * scale);
            }
            
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            
            // 设置图像平滑
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // 根据算法选择不同的插值方法
            this.setInterpolationMethod(ctx, settings.algorithm);
            
            // 绘制放大后的图片
            ctx.drawImage(imageData.img, 0, 0, targetWidth, targetHeight);
            
            // 应用后处理效果
            if (settings.enhanceDetails || settings.smoothEdges || settings.noiseReduction) {
                this.applyPostProcessing(ctx, settings, targetWidth, targetHeight);
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
            const quality = settings.quality / 100;
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
            const fileName = `${originalName}_expanded_${targetWidth}x${targetHeight}.${fileExtension}`;
            
            resolve({
                id: Date.now() + Math.random(),
                name: fileName,
                size: blob.size,
                width: targetWidth,
                height: targetHeight,
                originalWidth: imageData.width,
                originalHeight: imageData.height,
                dataUrl: dataUrl,
                blob: blob,
                mimeType: mimeType
            });
        });
    }

    setInterpolationMethod(ctx, algorithm) {
        // 设置不同的插值方法
        switch (algorithm) {
            case 'nearest':
                ctx.imageSmoothingEnabled = false;
                break;
            case 'bilinear':
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'low';
                break;
            case 'bicubic':
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                break;
            case 'lanczos':
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                break;
        }
    }

    applyPostProcessing(ctx, settings, width, height) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        if (settings.enhanceDetails) {
            this.enhanceDetails(data, width, height);
        }
        
        if (settings.smoothEdges) {
            this.smoothEdges(data, width, height);
        }
        
        if (settings.noiseReduction) {
            this.reduceNoise(data, width, height);
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    enhanceDetails(data, width, height) {
        // 细节增强算法
        const tempData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const index = (y * width + x) * 4;
                
                // 拉普拉斯算子增强
                const laplacian = this.applyLaplacian(tempData, width, height, x, y);
                
                data[index] = Math.max(0, Math.min(255, data[index] + laplacian.r * 0.3));
                data[index + 1] = Math.max(0, Math.min(255, data[index + 1] + laplacian.g * 0.3));
                data[index + 2] = Math.max(0, Math.min(255, data[index + 2] + laplacian.b * 0.3));
            }
        }
    }

    smoothEdges(data, width, height) {
        // 边缘平滑算法
        const tempData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const index = (y * width + x) * 4;
                
                // 轻微的高斯模糊
                const blurred = this.applyGaussianBlur(tempData, width, height, x, y);
                
                data[index] = Math.round(data[index] * 0.8 + blurred.r * 0.2);
                data[index + 1] = Math.round(data[index + 1] * 0.8 + blurred.g * 0.2);
                data[index + 2] = Math.round(data[index + 2] * 0.8 + blurred.b * 0.2);
            }
        }
    }

    reduceNoise(data, width, height) {
        // 降噪算法
        const tempData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const index = (y * width + x) * 4;
                
                // 中值滤波
                const median = this.calculateMedian(tempData, width, height, x, y);
                
                data[index] = Math.round(data[index] * 0.7 + median.r * 0.3);
                data[index + 1] = Math.round(data[index + 1] * 0.7 + median.g * 0.3);
                data[index + 2] = Math.round(data[index + 2] * 0.7 + median.b * 0.3);
            }
        }
    }

    applyLaplacian(data, width, height, x, y) {
        const kernel = [
            [0, -1, 0],
            [-1, 4, -1],
            [0, -1, 0]
        ];
        
        let r = 0, g = 0, b = 0;
        
        for (let ky = 0; ky < 3; ky++) {
            for (let kx = 0; kx < 3; kx++) {
                const px = x + kx - 1;
                const py = y + ky - 1;
                
                if (px >= 0 && px < width && py >= 0 && py < height) {
                    const index = (py * width + px) * 4;
                    const weight = kernel[ky][kx];
                    
                    r += data[index] * weight;
                    g += data[index + 1] * weight;
                    b += data[index + 2] * weight;
                }
            }
        }
        
        return { r, g, b };
    }

    applyGaussianBlur(data, width, height, x, y) {
        const kernel = [
            [1, 2, 1],
            [2, 4, 2],
            [1, 2, 1]
        ];
        
        let r = 0, g = 0, b = 0, total = 0;
        
        for (let ky = 0; ky < 3; ky++) {
            for (let kx = 0; kx < 3; kx++) {
                const px = x + kx - 1;
                const py = y + ky - 1;
                
                if (px >= 0 && px < width && py >= 0 && py < height) {
                    const index = (py * width + px) * 4;
                    const weight = kernel[ky][kx];
                    
                    r += data[index] * weight;
                    g += data[index + 1] * weight;
                    b += data[index + 2] * weight;
                    total += weight;
                }
            }
        }
        
        return {
            r: Math.round(r / total),
            g: Math.round(g / total),
            b: Math.round(b / total)
        };
    }

    calculateMedian(data, width, height, x, y) {
        const values = [];
        
        for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
                const px = x + kx;
                const py = y + ky;
                
                if (px >= 0 && px < width && py >= 0 && py < height) {
                    const index = (py * width + px) * 4;
                    values.push({
                        r: data[index],
                        g: data[index + 1],
                        b: data[index + 2]
                    });
                }
            }
        }
        
        // 计算中值
        values.sort((a, b) => (a.r + a.g + a.b) - (b.r + b.g + b.b));
        const median = values[Math.floor(values.length / 2)];
        
        return median;
    }

    getExpansionSettings() {
        const scale = parseFloat(document.getElementById('scaleSlider').value);
        const algorithm = document.querySelector('input[name="algorithm"]:checked').value;
        const quality = parseInt(document.getElementById('qualitySlider').value);
        const outputFormat = document.getElementById('outputFormat').value;
        const preserveAspectRatio = document.getElementById('preserveAspectRatio').checked;
        const enhanceDetails = document.getElementById('enhanceDetails').checked;
        const smoothEdges = document.getElementById('smoothEdges').checked;
        const noiseReduction = document.getElementById('noiseReduction').checked;
        const targetWidth = document.getElementById('targetWidth').value;
        const targetHeight = document.getElementById('targetHeight').value;
        
        return {
            scale,
            algorithm,
            quality,
            outputFormat,
            preserveAspectRatio,
            enhanceDetails,
            smoothEdges,
            noiseReduction,
            targetWidth,
            targetHeight
        };
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

        this.expandedImages.forEach(imageData => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.innerHTML = `
                <img src="${imageData.dataUrl}" alt="${imageData.name}" class="result-preview" />
                <div class="result-info">${this.formatFileSize(imageData.size)} | ${imageData.width}×${imageData.height}</div>
                <div class="result-info">原尺寸: ${imageData.originalWidth}×${imageData.originalHeight}</div>
                <div class="result-name">${imageData.name}</div>
                <div class="result-actions">
                    <button class="btn btn-success" onclick="imageExpander.downloadSingleImage('${imageData.name}')">下载</button>
                </div>
            `;
            resultsGrid.appendChild(resultItem);
        });

        document.getElementById('resultsSection').style.display = 'block';
    }

    async previewExpansion() {
        if (this.images.length === 0) {
            alert('请先选择图片');
            return;
        }

        const firstImage = this.images[0];
        const expandedImage = await this.expandImage(firstImage);
        
        if (expandedImage) {
            // 创建预览窗口
            const previewWindow = window.open('', '_blank', 'width=1200,height=800');
            previewWindow.document.write(`
                <html>
                    <head>
                        <title>图片放大预览</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; background-color: #f5f5f5; }
                            .preview-container { display: flex; gap: 30px; justify-content: center; flex-wrap: wrap; }
                            .preview-item { text-align: center; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                            .preview-item h3 { margin-bottom: 15px; color: #333; }
                            .preview-item img { max-width: 500px; max-height: 500px; border: 1px solid #ddd; border-radius: 5px; }
                            .preview-info { margin-top: 10px; font-size: 14px; color: #666; }
                        </style>
                    </head>
                    <body>
                        <h2>图片放大预览</h2>
                        <div class="preview-container">
                            <div class="preview-item">
                                <h3>原图</h3>
                                <img src="${firstImage.dataUrl}" alt="原图" />
                                <div class="preview-info">尺寸: ${firstImage.width}×${firstImage.height}</div>
                                <div class="preview-info">大小: ${this.formatFileSize(firstImage.size)}</div>
                            </div>
                            <div class="preview-item">
                                <h3>放大后</h3>
                                <img src="${expandedImage.dataUrl}" alt="放大后" />
                                <div class="preview-info">尺寸: ${expandedImage.width}×${expandedImage.height}</div>
                                <div class="preview-info">大小: ${this.formatFileSize(expandedImage.size)}</div>
                            </div>
                        </div>
                    </body>
                </html>
            `);
        }
    }

    downloadSingleImage(imageName) {
        const imageData = this.expandedImages.find(img => img.name === imageName);
        if (!imageData) return;

        const link = document.createElement('a');
        link.download = imageData.name;
        link.href = imageData.dataUrl;
        link.click();
    }

    downloadAllImages() {
        this.expandedImages.forEach(imageData => {
            setTimeout(() => {
                this.downloadSingleImage(imageData.name);
            }, 100);
        });
    }

    async downloadAsZip() {
        if (this.expandedImages.length === 0) {
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
        this.expandedImages = [];
        this.displayImages();
        this.hideSettings();
        document.getElementById('fileInput').value = '';
        document.getElementById('targetWidth').value = '';
        document.getElementById('targetHeight').value = '';
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
let imageExpander;
document.addEventListener('DOMContentLoaded', () => {
    imageExpander = new ImageExpander();
});
