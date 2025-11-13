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
        // File upload
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.querySelector('.upload-area');
        
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop upload
        uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Slider controls
        document.getElementById('scaleSlider').addEventListener('input', (e) => this.updateScaleValue(e));
        document.getElementById('qualitySlider').addEventListener('input', (e) => this.updateQualityValue(e));
        
        // Button events
        document.getElementById('expandBtn').addEventListener('click', () => this.expandAllImages());
        document.getElementById('previewBtn').addEventListener('click', () => this.previewExpansion());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('downloadAllBtn').addEventListener('click', () => this.downloadAllImages());
        document.getElementById('downloadZipBtn').addEventListener('click', () => this.downloadAsZip());
        
        // Size controls
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
            alert('Please select image files');
            return;
        }

        if (imageFiles.length > 5) {
            alert('You can upload up to 5 images');
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
                        <button class="btn btn-primary" onclick="imageExpander.expandSingleImage('${imageData.id}')">Expand</button>
                        <button class="btn btn-outline" onclick="imageExpander.removeImage('${imageData.id}')">Remove</button>
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
        // Magnification preset buttons
        document.querySelectorAll('.scale-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setScalePreset(e));
        });
        
        // Quality preset buttons
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
        
        // Update button state
        document.querySelectorAll('.scale-preset-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
        
        // Calculate new size
        this.calculateSize();
    }

    setQualityPreset(e) {
        const value = parseInt(e.target.dataset.value);
        const slider = document.getElementById('qualitySlider');
        const valueDisplay = document.getElementById('qualityValue');
        
        slider.value = value;
        valueDisplay.textContent = value + '%';
        
        // Update button state
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
            
            // Get settings
            const settings = this.getExpansionSettings();
            
            // Calculate target dimensions
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
            
            // Set image smoothing
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // Select interpolation method based on algorithm
            this.setInterpolationMethod(ctx, settings.algorithm);
            
            // Draw the expanded image
            ctx.drawImage(imageData.img, 0, 0, targetWidth, targetHeight);
            
            // Apply post-processing effects
            if (settings.enhanceDetails || settings.smoothEdges || settings.noiseReduction) {
                this.applyPostProcessing(ctx, settings, targetWidth, targetHeight);
            }
            
            // Get output format
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
            
            // Generate data URL
            const quality = settings.quality / 100;
            const dataUrl = canvas.toDataURL(mimeType, quality);
            
            // Create Blob
            const byteString = atob(dataUrl.split(',')[1]);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: mimeType });
            
            // Generate file name
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
        // Set different interpolation methods
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
        // Get image data
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // Apply detail enhancement
        if (settings.enhanceDetails) {
            this.enhanceDetails(data, width, height);
        }
        
        // Apply edge smoothing
        if (settings.smoothEdges) {
            this.smoothEdges(data, width, height);
        }
        
        // Apply noise reduction
        if (settings.noiseReduction) {
            this.reduceNoise(data, width, height);
        }
        
        // Draw processed image
        ctx.putImageData(imageData, 0, 0);
    }

    enhanceDetails(data, width, height) {
        // Detail enhancement algorithm
        const tempData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const index = (y * width + x) * 4;
                
                // Laplacian operator enhancement
                const laplacian = this.applyLaplacian(tempData, width, height, x, y);
                
                data[index] = Math.max(0, Math.min(255, data[index] + laplacian.r * 0.3));
                data[index + 1] = Math.max(0, Math.min(255, data[index + 1] + laplacian.g * 0.3));
                data[index + 2] = Math.max(0, Math.min(255, data[index + 2] + laplacian.b * 0.3));
            }
        }
    }

    smoothEdges(data, width, height) {
        // Edge smoothing algorithm
        const tempData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const index = (y * width + x) * 4;
                
                // Light Gaussian blur
                const blurred = this.applyGaussianBlur(tempData, width, height, x, y);
                
                data[index] = Math.round(data[index] * 0.8 + blurred.r * 0.2);
                data[index + 1] = Math.round(data[index + 1] * 0.8 + blurred.g * 0.2);
                data[index + 2] = Math.round(data[index + 2] * 0.8 + blurred.b * 0.2);
            }
        }
    }

    reduceNoise(data, width, height) {
        // Noise reduction algorithm
        const tempData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const index = (y * width + x) * 4;
                
                // Median filtering
                const median = this.calculateMedian(tempData, width, height, x, y);
                
                data[index] = Math.round(data[index] * 0.7 + median.r * 0.3);
                data[index + 1] = Math.round(data[index + 1] * 0.7 + median.g * 0.3);
                data[index + 2] = Math.round(data[index + 2] * 0.7 + median.b * 0.3);
            }
        }
    }

    applyLaplacian(data, width, height, x, y) {
        // Laplacian operator
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
        
        // Calculate median
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
            alert('Please select an image first');
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
                        <h2>Image Expansion Preview</h2>
                        <div class="preview-container">
                            <div class="preview-item">
                                <h3>Original</h3>
                                <img src="${firstImage.dataUrl}" alt="Original" />
                                <div class="preview-info">Size: ${firstImage.width}×${firstImage.height}</div>
                                <div class="preview-info">File Size: ${this.formatFileSize(firstImage.size)}</div>
                            </div>
                            <div class="preview-item">
                                <h3>Expanded</h3>
                                <img src="${expandedImage.dataUrl}" alt="Expanded" />
                                <div class="preview-info">Size: ${expandedImage.width}×${expandedImage.height}</div>
                                <div class="preview-info">File Size: ${this.formatFileSize(expandedImage.size)}</div>
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
            alert('No images to download');
            return;
        }

        // Due to browser limitations, we cannot directly create ZIP files
        // Alternative solution: download one by one
        alert('Due to browser limitations, images will be downloaded one by one');
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

// Initialize the application
let imageExpander;
document.addEventListener('DOMContentLoaded', () => {
    imageExpander = new ImageExpander();
});
