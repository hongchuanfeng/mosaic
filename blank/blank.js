class GrayscaleConverter {
    constructor() {
        this.images = [];
        this.convertedImages = [];
        this.isConverting = false;
        
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
        document.getElementById('contrastSlider').addEventListener('input', (e) => this.updateContrastValue(e));
        document.getElementById('brightnessSlider').addEventListener('input', (e) => this.updateBrightnessValue(e));
        document.getElementById('toneSlider').addEventListener('input', (e) => this.updateToneValue(e));
        
        // 按钮事件
        document.getElementById('convertAllBtn').addEventListener('click', () => this.convertAllImages());
        document.getElementById('previewBtn').addEventListener('click', () => this.previewConversion());
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

        if (imageFiles.length > 15) {
            alert('最多只能上传15张图片');
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
                    <button class="btn btn-primary" onclick="grayscaleConverter.convertSingleImage('${imageData.id}')">转换</button>
                    <button class="btn btn-secondary" onclick="grayscaleConverter.removeImage('${imageData.id}')">删除</button>
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
        // 对比度预设按钮
        document.querySelectorAll('.contrast-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setContrastPreset(e));
        });
        
        // 亮度预设按钮
        document.querySelectorAll('.brightness-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setBrightnessPreset(e));
        });
        
        // 色调预设按钮
        document.querySelectorAll('.tone-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setTonePreset(e));
        });
    }

    updateContrastValue(e) {
        document.getElementById('contrastValue').textContent = e.target.value + '%';
    }

    updateBrightnessValue(e) {
        document.getElementById('brightnessValue').textContent = e.target.value + '%';
    }

    updateToneValue(e) {
        document.getElementById('toneValue').textContent = e.target.value;
    }

    setContrastPreset(e) {
        const value = parseInt(e.target.dataset.value);
        const slider = document.getElementById('contrastSlider');
        const valueDisplay = document.getElementById('contrastValue');
        
        slider.value = value;
        valueDisplay.textContent = value + '%';
        
        // 更新按钮状态
        document.querySelectorAll('.contrast-preset-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
    }

    setBrightnessPreset(e) {
        const value = parseInt(e.target.dataset.value);
        const slider = document.getElementById('brightnessSlider');
        const valueDisplay = document.getElementById('brightnessValue');
        
        slider.value = value;
        valueDisplay.textContent = value + '%';
        
        // 更新按钮状态
        document.querySelectorAll('.brightness-preset-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
    }

    setTonePreset(e) {
        const value = parseInt(e.target.dataset.value);
        const slider = document.getElementById('toneSlider');
        const valueDisplay = document.getElementById('toneValue');
        
        slider.value = value;
        valueDisplay.textContent = value;
        
        // 更新按钮状态
        document.querySelectorAll('.tone-preset-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
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
            
            canvas.width = imageData.width;
            canvas.height = imageData.height;
            
            // 绘制原图
            ctx.drawImage(imageData.img, 0, 0);
            
            // 获取图像数据
            const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageDataObj.data;
            
            // 获取转换参数
            const settings = this.getConversionSettings();
            
            // 应用灰度转换和调整
            this.applyGrayscaleConversion(data, settings);
            
            // 将处理后的数据放回画布
            ctx.putImageData(imageDataObj, 0, 0);
            
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
            const dataUrl = canvas.toDataURL(mimeType, 0.9);
            
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
            const fileName = `${originalName}_grayscale.${fileExtension}`;
            
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

    getConversionSettings() {
        const grayscaleMode = document.querySelector('input[name="grayscaleMode"]:checked').value;
        const contrast = parseInt(document.getElementById('contrastSlider').value) / 100;
        const brightness = parseInt(document.getElementById('brightnessSlider').value) / 100;
        const tone = parseInt(document.getElementById('toneSlider').value);
        const outputFormat = document.getElementById('outputFormat').value;
        const enhanceDetails = document.getElementById('enhanceDetails').checked;
        const removeNoise = document.getElementById('removeNoise').checked;
        const vintageEffect = document.getElementById('vintageEffect').checked;
        
        return {
            grayscaleMode,
            contrast,
            brightness,
            tone,
            outputFormat,
            enhanceDetails,
            removeNoise,
            vintageEffect
        };
    }

    applyGrayscaleConversion(data, settings) {
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // 应用灰度转换
            let gray = this.calculateGrayscale(r, g, b, settings.grayscaleMode);
            
            // 应用对比度调整
            gray = this.applyContrast(gray, settings.contrast);
            
            // 应用亮度调整
            gray = this.applyBrightness(gray, settings.brightness);
            
            // 应用色调调整
            gray = this.applyTone(gray, settings.tone);
            
            // 应用高级效果
            if (settings.enhanceDetails) {
                gray = this.enhanceDetails(gray, data, i);
            }
            
            if (settings.removeNoise) {
                gray = this.removeNoise(gray, data, i);
            }
            
            if (settings.vintageEffect) {
                gray = this.applyVintageEffect(gray);
            }
            
            // 确保值在0-255范围内
            gray = Math.max(0, Math.min(255, Math.round(gray)));
            
            // 设置灰度值
            data[i] = gray;     // R
            data[i + 1] = gray; // G
            data[i + 2] = gray; // B
            // data[i + 3] 保持原透明度
        }
    }

    calculateGrayscale(r, g, b, mode) {
        switch (mode) {
            case 'luminance':
                // 使用人眼感知的亮度公式
                return 0.299 * r + 0.587 * g + 0.114 * b;
            case 'average':
                // 简单的平均值
                return (r + g + b) / 3;
            case 'red':
                return r;
            case 'green':
                return g;
            case 'blue':
                return b;
            default:
                return 0.299 * r + 0.587 * g + 0.114 * b;
        }
    }

    applyContrast(gray, contrast) {
        // 对比度调整：以128为中心点
        return (gray - 128) * contrast + 128;
    }

    applyBrightness(gray, brightness) {
        // 亮度调整
        return gray * brightness;
    }

    applyTone(gray, tone) {
        // 色调调整：添加冷暖色调
        if (tone > 0) {
            // 暖色调：增加红色和黄色
            return gray + (tone / 100) * (255 - gray) * 0.3;
        } else if (tone < 0) {
            // 冷色调：增加蓝色
            return gray + (Math.abs(tone) / 100) * (255 - gray) * 0.2;
        }
        return gray;
    }

    enhanceDetails(gray, data, index) {
        // 简单的细节增强：使用拉普拉斯算子
        const width = Math.sqrt(data.length / 4);
        const x = (index / 4) % width;
        const y = Math.floor((index / 4) / width);
        
        if (x > 0 && x < width - 1 && y > 0 && y < width - 1) {
            const center = gray;
            const top = this.getGrayValue(data, x, y - 1, width);
            const bottom = this.getGrayValue(data, x, y + 1, width);
            const left = this.getGrayValue(data, x - 1, y, width);
            const right = this.getGrayValue(data, x + 1, y, width);
            
            const laplacian = center * 4 - (top + bottom + left + right);
            return Math.max(0, Math.min(255, gray + laplacian * 0.1));
        }
        return gray;
    }

    getGrayValue(data, x, y, width) {
        const index = (y * width + x) * 4;
        if (index >= 0 && index < data.length) {
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            return 0.299 * r + 0.587 * g + 0.114 * b;
        }
        return 128;
    }

    removeNoise(gray, data, index) {
        // 简单的降噪：使用中值滤波
        const width = Math.sqrt(data.length / 4);
        const x = (index / 4) % width;
        const y = Math.floor((index / 4) / width);
        
        if (x > 0 && x < width - 1 && y > 0 && y < width - 1) {
            const values = [];
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const neighborIndex = ((y + dy) * width + (x + dx)) * 4;
                    if (neighborIndex >= 0 && neighborIndex < data.length) {
                        const r = data[neighborIndex];
                        const g = data[neighborIndex + 1];
                        const b = data[neighborIndex + 2];
                        values.push(0.299 * r + 0.587 * g + 0.114 * b);
                    }
                }
            }
            values.sort((a, b) => a - b);
            return values[Math.floor(values.length / 2)];
        }
        return gray;
    }

    applyVintageEffect(gray) {
        // 复古效果：增加对比度和添加轻微的色彩偏移
        let vintage = this.applyContrast(gray, 1.2);
        vintage = this.applyBrightness(vintage, 0.9);
        // 添加轻微的棕褐色调
        return vintage * 0.95 + 20;
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

        this.convertedImages.forEach(imageData => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.innerHTML = `
                <img src="${imageData.dataUrl}" alt="${imageData.name}" class="result-preview" />
                <div class="result-info">${this.formatFileSize(imageData.size)} | ${imageData.width}×${imageData.height}</div>
                <div class="result-name">${imageData.name}</div>
                <div class="result-actions">
                    <button class="btn btn-success" onclick="grayscaleConverter.downloadSingleImage('${imageData.name}')">下载</button>
                </div>
            `;
            resultsGrid.appendChild(resultItem);
        });

        document.getElementById('resultsSection').style.display = 'block';
    }

    async previewConversion() {
        if (this.images.length === 0) {
            alert('请先选择图片');
            return;
        }

        const firstImage = this.images[0];
        const convertedImage = await this.convertImage(firstImage);
        
        if (convertedImage) {
            // 创建预览窗口
            const previewWindow = window.open('', '_blank', 'width=800,height=600');
            previewWindow.document.write(`
                <html>
                    <head>
                        <title>转换预览</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
                            .preview-container { display: flex; gap: 20px; justify-content: center; }
                            .preview-item { text-align: center; }
                            .preview-item h3 { margin-bottom: 10px; }
                            .preview-item img { max-width: 300px; max-height: 300px; border: 1px solid #ddd; }
                        </style>
                    </head>
                    <body>
                        <h2>转换预览</h2>
                        <div class="preview-container">
                            <div class="preview-item">
                                <h3>原图</h3>
                                <img src="${firstImage.dataUrl}" alt="原图" />
                            </div>
                            <div class="preview-item">
                                <h3>黑白图</h3>
                                <img src="${convertedImage.dataUrl}" alt="黑白图" />
                            </div>
                        </div>
                    </body>
                </html>
            `);
        }
    }

    downloadSingleImage(imageName) {
        const imageData = this.convertedImages.find(img => img.name === imageName);
        if (!imageData) return;

        const link = document.createElement('a');
        link.download = imageData.name;
        link.href = imageData.dataUrl;
        link.click();
    }

    downloadAllImages() {
        this.convertedImages.forEach(imageData => {
            setTimeout(() => {
                this.downloadSingleImage(imageData.name);
            }, 100);
        });
    }

    async downloadAsZip() {
        if (this.convertedImages.length === 0) {
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
let grayscaleConverter;
document.addEventListener('DOMContentLoaded', () => {
    grayscaleConverter = new GrayscaleConverter();
});
