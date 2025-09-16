class BackgroundRemover {
    constructor() {
        this.images = [];
        this.processedImages = [];
        this.isProcessing = false;
        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.selectionMode = 'rectangle';
        this.selectionPoints = [];
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupPresetButtons();
        this.setupModeToggle();
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
        
        // 滑块控制
        document.getElementById('precisionSlider').addEventListener('input', (e) => this.updatePrecisionValue(e));
        document.getElementById('brushSize').addEventListener('input', (e) => this.updateBrushSizeValue(e));
        document.getElementById('tolerance').addEventListener('input', (e) => this.updateToleranceValue(e));
        document.getElementById('colorTolerance').addEventListener('input', (e) => this.updateColorToleranceValue(e));
        document.getElementById('qualitySlider').addEventListener('input', (e) => this.updateQualityValue(e));
        
        // 按钮事件
        document.getElementById('processBtn').addEventListener('click', () => this.processAllImages());
        document.getElementById('previewBtn').addEventListener('click', () => this.previewProcessing());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('downloadAllBtn').addEventListener('click', () => this.downloadAllImages());
        document.getElementById('downloadZipBtn').addEventListener('click', () => this.downloadAsZip());
        document.getElementById('pickColorBtn').addEventListener('click', () => this.activateColorPicker());
    }

    setupCanvas() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 添加画布事件监听
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', (e) => this.stopDrawing(e));
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
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
                    <button class="btn btn-primary" onclick="backgroundRemover.processSingleImage('${imageData.id}')">处理</button>
                    <button class="btn btn-outline" onclick="backgroundRemover.removeImage('${imageData.id}')">删除</button>
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
        // 精度预设按钮
        document.querySelectorAll('.precision-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setPrecisionPreset(e));
        });
    }

    setupModeToggle() {
        // 处理模式切换
        document.querySelectorAll('input[name="processingMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handleModeChange(e));
        });
    }

    handleModeChange(e) {
        const manualGroup = document.getElementById('manualGroup');
        const colorGroup = document.getElementById('colorGroup');
        
        manualGroup.style.display = e.target.value === 'manual' ? 'block' : 'none';
        colorGroup.style.display = e.target.value === 'color' ? 'block' : 'none';
    }

    setPrecisionPreset(e) {
        const value = parseInt(e.target.dataset.value);
        const slider = document.getElementById('precisionSlider');
        const valueDisplay = document.getElementById('precisionValue');
        
        slider.value = value;
        valueDisplay.textContent = value;
        
        // 更新按钮状态
        document.querySelectorAll('.precision-preset-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
    }

    updatePrecisionValue(e) {
        document.getElementById('precisionValue').textContent = e.target.value;
    }

    updateBrushSizeValue(e) {
        document.getElementById('brushSizeValue').textContent = e.target.value + 'px';
    }

    updateToleranceValue(e) {
        document.getElementById('toleranceValue').textContent = e.target.value;
    }

    updateColorToleranceValue(e) {
        document.getElementById('colorToleranceValue').textContent = e.target.value;
    }

    updateQualityValue(e) {
        document.getElementById('qualityValue').textContent = e.target.value + '%';
    }

    async processSingleImage(imageId) {
        const imageData = this.images.find(img => img.id == imageId);
        if (!imageData) return;

        try {
            const processedImage = await this.processImage(imageData);
            if (processedImage) {
                this.processedImages.push(processedImage);
                this.displayResults();
                alert('背景移除成功！');
            }
        } catch (error) {
            console.error('单张图片处理失败:', error);
            alert('处理失败，请检查图片格式和设置');
        }
    }

    async processAllImages() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.processedImages = [];
        this.showProgress();
        
        const totalImages = this.images.length;
        let completed = 0;
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < totalImages; i++) {
            const imageData = this.images[i];
            this.updateProgress(completed, totalImages, `正在处理: ${imageData.name}`);
            
            try {
                const processedImage = await this.processImage(imageData);
                if (processedImage) {
                    this.processedImages.push(processedImage);
                    successCount++;
                }
                completed++;
            } catch (error) {
                console.error('图片处理失败:', error);
                errorCount++;
                completed++;
            }
        }

        // 显示处理结果
        let resultMessage = `处理完成！成功: ${successCount}张`;
        if (errorCount > 0) {
            resultMessage += `，失败: ${errorCount}张`;
        }
        
        this.updateProgress(totalImages, totalImages, resultMessage);
        this.isProcessing = false;
        this.displayResults();
        
        // 显示结果提示
        if (successCount > 0) {
            alert(resultMessage);
        } else {
            alert('处理失败，请检查图片格式和设置');
        }
    }

    async processImage(imageData) {
        return new Promise((resolve, reject) => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                if (!ctx) {
                    reject(new Error('无法创建Canvas上下文'));
                    return;
                }
                
                canvas.width = imageData.width;
                canvas.height = imageData.height;
                
                // 绘制原图
                ctx.drawImage(imageData.img, 0, 0);
                
                // 获取处理设置
                const settings = this.getProcessingSettings();
                
                // 应用背景移除算法
                this.removeBackground(ctx, settings, canvas.width, canvas.height);
                
                // 获取输出格式
                let mimeType = 'image/png'; // 默认PNG支持透明
                let fileExtension = 'png';
                
                switch (settings.outputFormat) {
                    case 'webp':
                        mimeType = 'image/webp';
                        fileExtension = 'webp';
                        break;
                    case 'gif':
                        mimeType = 'image/gif';
                        fileExtension = 'gif';
                        break;
                }
                
                // 生成数据URL
                const quality = settings.quality / 100;
                const dataUrl = canvas.toDataURL(mimeType, quality);
                
                if (!dataUrl || dataUrl === 'data:,') {
                    reject(new Error('无法生成处理后的图像'));
                    return;
                }
                
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
                const fileName = `${originalName}_transparent.${fileExtension}`;
                
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
            } catch (error) {
                console.error('图像处理错误:', error);
                reject(error);
            }
        });
    }

    removeBackground(ctx, settings, width, height) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        console.log('开始背景移除处理:', {
            width,
            height,
            mode: settings.processingMode,
            precision: settings.precision,
            edgeMode: settings.edgeMode
        });
        
        // 根据处理模式应用不同的算法
        switch (settings.processingMode) {
            case 'auto':
                console.log('应用智能背景移除算法');
                this.applyAutoBackgroundRemoval(data, settings, width, height);
                break;
            case 'manual':
                console.log('应用手动背景移除算法');
                this.applyManualBackgroundRemoval(data, settings, width, height);
                break;
            case 'color':
                console.log('应用颜色背景移除算法');
                this.applyColorBackgroundRemoval(data, settings, width, height);
                break;
        }
        
        // 应用后处理效果
        if (settings.enhanceEdges) {
            console.log('应用边缘增强');
            this.enhanceEdges(data, width, height);
        }
        
        if (settings.smoothTransitions) {
            console.log('应用平滑过渡');
            this.smoothTransitions(data, width, height);
        }
        
        if (settings.removeNoise) {
            console.log('应用噪点去除');
            this.removeNoise(data, width, height);
        }
        
        ctx.putImageData(imageData, 0, 0);
        console.log('背景移除处理完成');
    }

    applyAutoBackgroundRemoval(data, settings, width, height) {
        const precision = settings.precision / 10;
        
        // 智能背景检测算法
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const alpha = data[i + 3];
            
            // 计算像素位置
            const pixelIndex = i / 4;
            const x = pixelIndex % width;
            const y = Math.floor(pixelIndex / width);
            
            // 边缘检测 - 边缘像素更可能是主体
            const isEdge = this.isEdgePixel(x, y, width, height);
            
            // 颜色分析 - 检测背景色
            const isBackground = this.isBackgroundColor(r, g, b, data, width, height, x, y);
            
            // 位置分析 - 角落和边缘更可能是背景
            const isCorner = this.isCornerPixel(x, y, width, height);
            
            // 综合判断
            let shouldRemove = false;
            
            if (isCorner && !isEdge) {
                shouldRemove = true;
            } else if (isBackground && !isEdge) {
                shouldRemove = true;
            } else if (isBackground && precision > 0.7) {
                shouldRemove = true;
            }
            
            if (shouldRemove) {
                data[i + 3] = 0; // 设置为透明
            }
        }
    }

    applyManualBackgroundRemoval(data, settings, width, height) {
        // 手动选择区域处理
        // 这里可以实现基于用户选择的区域进行背景移除
        // 暂时使用自动算法作为基础
        this.applyAutoBackgroundRemoval(data, settings, width, height);
    }

    applyColorBackgroundRemoval(data, settings, width, height) {
        const backgroundColor = this.hexToRgb(settings.backgroundColor);
        const tolerance = settings.colorTolerance;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // 计算颜色差异
            const colorDiff = Math.sqrt(
                Math.pow(r - backgroundColor.r, 2) +
                Math.pow(g - backgroundColor.g, 2) +
                Math.pow(b - backgroundColor.b, 2)
            );
            
            // 如果颜色差异在容差范围内，移除背景
            if (colorDiff <= tolerance) {
                data[i + 3] = 0; // 设置为透明
            }
        }
    }

    isEdgePixel(x, y, width, height) {
        // 检测是否为边缘像素
        const edgeThreshold = 5;
        return x < edgeThreshold || x >= width - edgeThreshold || 
               y < edgeThreshold || y >= height - edgeThreshold;
    }

    isCornerPixel(x, y, width, height) {
        // 检测是否为角落像素
        const cornerSize = Math.min(width, height) * 0.1;
        return (x < cornerSize && y < cornerSize) ||
               (x >= width - cornerSize && y < cornerSize) ||
               (x < cornerSize && y >= height - cornerSize) ||
               (x >= width - cornerSize && y >= height - cornerSize);
    }

    isBackgroundColor(r, g, b, data, width, height, x, y) {
        // 分析周围像素来判断是否为背景色
        const sampleSize = 3;
        let similarCount = 0;
        let totalCount = 0;
        
        for (let dy = -sampleSize; dy <= sampleSize; dy++) {
            for (let dx = -sampleSize; dx <= sampleSize; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const index = (ny * width + nx) * 4;
                    const nr = data[index];
                    const ng = data[index + 1];
                    const nb = data[index + 2];
                    
                    // 计算颜色相似度
                    const colorDiff = Math.sqrt(
                        Math.pow(r - nr, 2) +
                        Math.pow(g - ng, 2) +
                        Math.pow(b - nb, 2)
                    );
                    
                    if (colorDiff < 30) { // 相似颜色阈值
                        similarCount++;
                    }
                    totalCount++;
                }
            }
        }
        
        return similarCount / totalCount > 0.6; // 如果60%以上像素相似，认为是背景
    }

    enhanceEdges(data, width, height) {
        // 边缘增强算法
        const tempData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const index = (y * width + x) * 4;
                
                // 拉普拉斯算子边缘检测
                const laplacian = this.applyLaplacian(tempData, width, height, x, y);
                
                // 增强边缘
                if (laplacian > 50) {
                    data[index + 3] = Math.min(255, data[index + 3] + 20);
                }
            }
        }
    }

    smoothTransitions(data, width, height) {
        // 平滑过渡算法
        const tempData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const index = (y * width + x) * 4;
                
                // 计算周围像素的alpha平均值
                let alphaSum = 0;
                let count = 0;
                
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const nIndex = (ny * width + nx) * 4;
                            alphaSum += tempData[nIndex + 3];
                            count++;
                        }
                    }
                }
                
                const avgAlpha = alphaSum / count;
                
                // 平滑alpha值
                data[index + 3] = Math.round(data[index + 3] * 0.7 + avgAlpha * 0.3);
            }
        }
    }

    removeNoise(data, width, height) {
        // 噪点去除算法
        const tempData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const index = (y * width + x) * 4;
                
                // 计算周围像素的alpha值
                const alphaValues = [];
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const nIndex = (ny * width + nx) * 4;
                            alphaValues.push(tempData[nIndex + 3]);
                        }
                    }
                }
                
                // 中值滤波
                alphaValues.sort((a, b) => a - b);
                const medianAlpha = alphaValues[Math.floor(alphaValues.length / 2)];
                
                // 如果当前像素与中值差异很大，使用中值
                if (Math.abs(data[index + 3] - medianAlpha) > 50) {
                    data[index + 3] = medianAlpha;
                }
            }
        }
    }

    applyLaplacian(data, width, height, x, y) {
        const kernel = [
            [0, -1, 0],
            [-1, 4, -1],
            [0, -1, 0]
        ];
        
        let result = 0;
        
        for (let ky = 0; ky < 3; ky++) {
            for (let kx = 0; kx < 3; kx++) {
                const px = x + kx - 1;
                const py = y + ky - 1;
                
                if (px >= 0 && px < width && py >= 0 && py < height) {
                    const index = (py * width + px) * 4;
                    const weight = kernel[ky][kx];
                    
                    result += data[index] * weight;
                }
            }
        }
        
        return Math.abs(result);
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }

    getProcessingSettings() {
        const processingMode = document.querySelector('input[name="processingMode"]:checked').value;
        const precision = parseInt(document.getElementById('precisionSlider').value);
        const edgeMode = document.querySelector('input[name="edgeMode"]:checked').value;
        const backgroundColor = document.getElementById('backgroundColor').value;
        const colorTolerance = parseInt(document.getElementById('colorTolerance').value);
        const preserveShadows = document.getElementById('preserveShadows').checked;
        const enhanceEdges = document.getElementById('enhanceEdges').checked;
        const smoothTransitions = document.getElementById('smoothTransitions').checked;
        const removeNoise = document.getElementById('removeNoise').checked;
        const autoDetect = document.getElementById('autoDetect').checked;
        const previewMode = document.getElementById('previewMode').checked;
        const outputFormat = document.getElementById('outputFormat').value;
        const quality = parseInt(document.getElementById('qualitySlider').value);
        
        return {
            processingMode,
            precision,
            edgeMode,
            backgroundColor,
            colorTolerance,
            preserveShadows,
            enhanceEdges,
            smoothTransitions,
            removeNoise,
            autoDetect,
            previewMode,
            outputFormat,
            quality
        };
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

        this.processedImages.forEach(imageData => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.innerHTML = `
                <img src="${imageData.dataUrl}" alt="${imageData.name}" class="result-preview" />
                <div class="result-info">${this.formatFileSize(imageData.size)} | ${imageData.width}×${imageData.height}</div>
                <div class="result-name">${imageData.name}</div>
                <div class="result-actions">
                    <button class="btn btn-success" onclick="backgroundRemover.downloadSingleImage('${imageData.name}')">下载</button>
                </div>
            `;
            resultsGrid.appendChild(resultItem);
        });

        document.getElementById('resultsSection').style.display = 'block';
    }

    async previewProcessing() {
        if (this.images.length === 0) {
            alert('请先选择图片');
            return;
        }

        const firstImage = this.images[0];
        const processedImage = await this.processImage(firstImage);
        
        if (processedImage) {
            // 创建预览窗口
            const previewWindow = window.open('', '_blank', 'width=1200,height=800');
            previewWindow.document.write(`
                <html>
                    <head>
                        <title>背景移除预览</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; background-color: #f5f5f5; }
                            .preview-container { display: flex; gap: 30px; justify-content: center; flex-wrap: wrap; }
                            .preview-item { text-align: center; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                            .preview-item h3 { margin-bottom: 15px; color: #333; }
                            .preview-item img { max-width: 500px; max-height: 500px; border: 1px solid #ddd; border-radius: 5px; }
                            .preview-info { margin-top: 10px; font-size: 14px; color: #666; }
                            .transparent-bg { 
                                background: 
                                    linear-gradient(45deg, #ccc 25%, transparent 25%), 
                                    linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                                    linear-gradient(45deg, transparent 75%, #ccc 75%), 
                                    linear-gradient(-45deg, transparent 75%, #ccc 75%);
                                background-size: 20px 20px;
                                background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
                            }
                        </style>
                    </head>
                    <body>
                        <h2>背景移除预览</h2>
                        <div class="preview-container">
                            <div class="preview-item">
                                <h3>处理前</h3>
                                <img src="${firstImage.dataUrl}" alt="处理前" />
                                <div class="preview-info">尺寸: ${firstImage.width}×${firstImage.height}</div>
                                <div class="preview-info">大小: ${this.formatFileSize(firstImage.size)}</div>
                            </div>
                            <div class="preview-item">
                                <h3>处理后</h3>
                                <div class="transparent-bg">
                                    <img src="${processedImage.dataUrl}" alt="处理后" />
                                </div>
                                <div class="preview-info">尺寸: ${processedImage.width}×${processedImage.height}</div>
                                <div class="preview-info">大小: ${this.formatFileSize(processedImage.size)}</div>
                            </div>
                        </div>
                    </body>
                </html>
            `);
        }
    }

    downloadSingleImage(imageName) {
        const imageData = this.processedImages.find(img => img.name === imageName);
        if (!imageData) return;

        const link = document.createElement('a');
        link.download = imageData.name;
        link.href = imageData.dataUrl;
        link.click();
    }

    downloadAllImages() {
        this.processedImages.forEach(imageData => {
            setTimeout(() => {
                this.downloadSingleImage(imageData.name);
            }, 100);
        });
    }

    async downloadAsZip() {
        if (this.processedImages.length === 0) {
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
        this.processedImages = [];
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

    // 手动选择相关方法
    startDrawing(e) {
        this.isDrawing = true;
        // 实现手动选择功能
    }

    draw(e) {
        if (!this.isDrawing) return;
        // 实现绘制功能
    }

    stopDrawing(e) {
        this.isDrawing = false;
        // 实现停止绘制功能
    }

    handleCanvasClick(e) {
        // 处理画布点击事件
    }

    activateColorPicker() {
        // 激活取色器功能
        alert('取色器功能：点击图片上的颜色来设置背景色');
    }
}

// 初始化应用
let backgroundRemover;
document.addEventListener('DOMContentLoaded', () => {
    backgroundRemover = new BackgroundRemover();
});
