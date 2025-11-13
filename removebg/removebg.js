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
        // File upload
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.querySelector('.upload-area');
        
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop upload
        uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Slider controls
        document.getElementById('precisionSlider').addEventListener('input', (e) => this.updatePrecisionValue(e));
        document.getElementById('brushSize').addEventListener('input', (e) => this.updateBrushSizeValue(e));
        document.getElementById('tolerance').addEventListener('input', (e) => this.updateToleranceValue(e));
        document.getElementById('colorTolerance').addEventListener('input', (e) => this.updateColorToleranceValue(e));
        document.getElementById('qualitySlider').addEventListener('input', (e) => this.updateQualityValue(e));
        
        // Button events
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
        
        // Add canvas event listeners
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
            alert('Please select image files');
            return;
        }

        if (imageFiles.length > 5) {
            alert('Maximum 5 images can be uploaded');
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
                    <button class="btn btn-primary" onclick="backgroundRemover.processSingleImage('${imageData.id}')">Process</button>
                    <button class="btn btn-outline" onclick="backgroundRemover.removeImage('${imageData.id}')">Remove</button>
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
        // Precision preset buttons
        document.querySelectorAll('.precision-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setPrecisionPreset(e));
        });
    }

    setupModeToggle() {
        // Processing mode toggle
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
        
        // Update button state
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
                alert('Background removed successfully!');
            }
        } catch (error) {
            console.error('Single image processing failed:', error);
            alert('Processing failed, please check image format and settings');
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
            this.updateProgress(completed, totalImages, `Processing: ${imageData.name}`);
            
            try {
                const processedImage = await this.processImage(imageData);
                if (processedImage) {
                    this.processedImages.push(processedImage);
                    successCount++;
                }
                completed++;
            } catch (error) {
                console.error('Image processing failed:', error);
                errorCount++;
                completed++;
            }
        }

        // Display processing results
        let resultMessage = `Processing completed! Success: ${successCount} image(s)`;
        if (errorCount > 0) {
            resultMessage += `, Failed: ${errorCount} image(s)`;
        }
        
        this.updateProgress(totalImages, totalImages, resultMessage);
        this.isProcessing = false;
        this.displayResults();
        
        // Display result notification
        // if (successCount > 0) {
        //     alert(resultMessage);
        // } else {
        //     alert('Processing failed, please check image format and settings');
        // }
    }

    async processImage(imageData) {
        return new Promise((resolve, reject) => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                if (!ctx) {
                    reject(new Error('Unable to create Canvas context'));
                    return;
                }
                
                canvas.width = imageData.width;
                canvas.height = imageData.height;
                
                // Draw original image
                ctx.drawImage(imageData.img, 0, 0);
                
                // Get processing settings
                const settings = this.getProcessingSettings();
                
                // Apply background removal algorithm
                this.removeBackground(ctx, settings, canvas.width, canvas.height);
                
                // Get output format
                let mimeType = 'image/png'; // Default PNG supports transparency
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
                
                // Generate data URL
                const quality = settings.quality / 100;
                const dataUrl = canvas.toDataURL(mimeType, quality);
                
                if (!dataUrl || dataUrl === 'data:,') {
                    reject(new Error('Unable to generate processed image'));
                    return;
                }
                
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
                console.error('Image processing error:', error);
                reject(error);
            }
        });
    }

    removeBackground(ctx, settings, width, height) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        console.log('Starting background removal processing:', {
            width,
            height,
            mode: settings.processingMode,
            precision: settings.precision,
            edgeMode: settings.edgeMode
        });
        
        // Apply different algorithms based on processing mode
        switch (settings.processingMode) {
            case 'auto':
                console.log('Applying intelligent background removal algorithm');
                this.applyAutoBackgroundRemoval(data, settings, width, height);
                break;
            case 'manual':
                console.log('Applying manual background removal algorithm');
                this.applyManualBackgroundRemoval(data, settings, width, height);
                break;
            case 'color':
                console.log('Applying color background removal algorithm');
                this.applyColorBackgroundRemoval(data, settings, width, height);
                break;
        }
        
        // Apply post-processing effects
        if (settings.enhanceEdges) {
            console.log('Applying edge enhancement');
            this.enhanceEdges(data, width, height);
        }
        
        if (settings.smoothTransitions) {
            console.log('Applying smooth transitions');
            this.smoothTransitions(data, width, height);
        }
        
        if (settings.removeNoise) {
            console.log('Applying noise removal');
            this.removeNoise(data, width, height);
        }
        
        ctx.putImageData(imageData, 0, 0);
        console.log('Background removal processing completed');
    }

    applyAutoBackgroundRemoval(data, settings, width, height) {
        const precision = settings.precision / 10;
        
        // Intelligent background detection algorithm
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const alpha = data[i + 3];
            
            // Calculate pixel position
            const pixelIndex = i / 4;
            const x = pixelIndex % width;
            const y = Math.floor(pixelIndex / width);
            
            // Edge detection - edge pixels are more likely to be the subject
            const isEdge = this.isEdgePixel(x, y, width, height);
            
            // Color analysis - detect background color
            const isBackground = this.isBackgroundColor(r, g, b, data, width, height, x, y);
            
            // Position analysis - corners and edges are more likely to be background
            const isCorner = this.isCornerPixel(x, y, width, height);
            
            // Comprehensive judgment
            let shouldRemove = false;
            
            if (isCorner && !isEdge) {
                shouldRemove = true;
            } else if (isBackground && !isEdge) {
                shouldRemove = true;
            } else if (isBackground && precision > 0.7) {
                shouldRemove = true;
            }
            
            if (shouldRemove) {
                data[i + 3] = 0; // Set to transparent
            }
        }
    }

    applyManualBackgroundRemoval(data, settings, width, height) {
        // Manual selection area processing
        // Here we can implement background removal based on user-selected areas
        // Temporarily use auto algorithm as base
        this.applyAutoBackgroundRemoval(data, settings, width, height);
    }

    applyColorBackgroundRemoval(data, settings, width, height) {
        const backgroundColor = this.hexToRgb(settings.backgroundColor);
        const tolerance = settings.colorTolerance;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Calculate color difference
            const colorDiff = Math.sqrt(
                Math.pow(r - backgroundColor.r, 2) +
                Math.pow(g - backgroundColor.g, 2) +
                Math.pow(b - backgroundColor.b, 2)
            );
            
            // If color difference is within tolerance range, remove background
            if (colorDiff <= tolerance) {
                data[i + 3] = 0; // Set to transparent
            }
        }
    }

    isEdgePixel(x, y, width, height) {
        // Detect if pixel is an edge pixel
        const edgeThreshold = 5;
        return x < edgeThreshold || x >= width - edgeThreshold || 
               y < edgeThreshold || y >= height - edgeThreshold;
    }

    isCornerPixel(x, y, width, height) {
        // Detect if pixel is a corner pixel
        const cornerSize = Math.min(width, height) * 0.1;
        return (x < cornerSize && y < cornerSize) ||
               (x >= width - cornerSize && y < cornerSize) ||
               (x < cornerSize && y >= height - cornerSize) ||
               (x >= width - cornerSize && y >= height - cornerSize);
    }

    isBackgroundColor(r, g, b, data, width, height, x, y) {
        // Analyze surrounding pixels to determine if it's a background color
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
                    
                    // Calculate color similarity
                    const colorDiff = Math.sqrt(
                        Math.pow(r - nr, 2) +
                        Math.pow(g - ng, 2) +
                        Math.pow(b - nb, 2)
                    );
                    
                    if (colorDiff < 30) { // Similar color threshold
                        similarCount++;
                    }
                    totalCount++;
                }
            }
        }
        
        return similarCount / totalCount > 0.6; // If more than 60% of pixels are similar, consider it background
    }

    enhanceEdges(data, width, height) {
        // Edge enhancement algorithm
        const tempData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const index = (y * width + x) * 4;
                
                // Laplacian operator edge detection
                const laplacian = this.applyLaplacian(tempData, width, height, x, y);
                
                // Enhance edges
                if (laplacian > 50) {
                    data[index + 3] = Math.min(255, data[index + 3] + 20);
                }
            }
        }
    }

    smoothTransitions(data, width, height) {
        // Smooth transition algorithm
        const tempData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const index = (y * width + x) * 4;
                
                // Calculate average alpha of surrounding pixels
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
                
                // Smooth alpha value
                data[index + 3] = Math.round(data[index + 3] * 0.7 + avgAlpha * 0.3);
            }
        }
    }

    removeNoise(data, width, height) {
        // Noise removal algorithm
        const tempData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const index = (y * width + x) * 4;
                
                // Calculate alpha values of surrounding pixels
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
                
                // Median filter
                alphaValues.sort((a, b) => a - b);
                const medianAlpha = alphaValues[Math.floor(alphaValues.length / 2)];
                
                // If current pixel differs greatly from median, use median
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
                    <button class="btn btn-success" onclick="backgroundRemover.downloadSingleImage('${imageData.name}')">Download</button>
                </div>
            `;
            resultsGrid.appendChild(resultItem);
        });

        document.getElementById('resultsSection').style.display = 'block';
    }

    async previewProcessing() {
        if (this.images.length === 0) {
            alert('Please select an image first');
            return;
        }

        const firstImage = this.images[0];
        const processedImage = await this.processImage(firstImage);
        
        if (processedImage) {
            // Create preview window
            const previewWindow = window.open('', '_blank', 'width=1200,height=800');
            previewWindow.document.write(`
                <html>
                    <head>
                        <title>Background Removal Preview</title>
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
                        <h2>Background Removal Preview</h2>
                        <div class="preview-container">
                            <div class="preview-item">
                                <h3>Before Processing</h3>
                                <img src="${firstImage.dataUrl}" alt="Before Processing" />
                                <div class="preview-info">Dimensions: ${firstImage.width}×${firstImage.height}</div>
                                <div class="preview-info">Size: ${this.formatFileSize(firstImage.size)}</div>
                            </div>
                            <div class="preview-item">
                                <h3>After Processing</h3>
                                <div class="transparent-bg">
                                    <img src="${processedImage.dataUrl}" alt="After Processing" />
                                </div>
                                <div class="preview-info">Dimensions: ${processedImage.width}×${processedImage.height}</div>
                                <div class="preview-info">Size: ${this.formatFileSize(processedImage.size)}</div>
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
            alert('No images available for download');
            return;
        }

        // Due to browser limitations, we cannot directly create ZIP files
        // Here we provide an alternative: download files one by one
        alert('Due to browser limitations, images will be downloaded one by one');
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

    // Manual selection related methods
    startDrawing(e) {
        this.isDrawing = true;
        // Implement manual selection functionality
    }

    draw(e) {
        if (!this.isDrawing) return;
        // Implement drawing functionality
    }

    stopDrawing(e) {
        this.isDrawing = false;
        // Implement stop drawing functionality
    }

    handleCanvasClick(e) {
        // Handle canvas click events
    }

    activateColorPicker() {
        // Activate color picker functionality
        alert('Color Picker: Click on a color in the image to set the background color');
    }
}

// Initialize application
let backgroundRemover;
document.addEventListener('DOMContentLoaded', () => {
    backgroundRemover = new BackgroundRemover();
});
