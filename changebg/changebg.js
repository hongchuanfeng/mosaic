class BackgroundChanger {
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
        this.setupModeToggle();
        this.setupCanvas();
    }

    bindEvents() {
        // File Upload
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.querySelector('.upload-area');
        
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag-and-Drop Upload
        uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Slider Control
        document.getElementById('colorIntensity').addEventListener('input', (e) => this.updateColorIntensityValue(e));
        document.getElementById('gradientAngle').addEventListener('input', (e) => this.updateGradientAngleValue(e));
        document.getElementById('patternSize').addEventListener('input', (e) => this.updatePatternSizeValue(e));
        document.getElementById('patternDensity').addEventListener('input', (e) => this.updatePatternDensityValue(e));
        document.getElementById('brushSize').addEventListener('input', (e) => this.updateBrushSizeValue(e));
        document.getElementById('tolerance').addEventListener('input', (e) => this.updateToleranceValue(e));
        document.getElementById('colorTolerance').addEventListener('input', (e) => this.updateColorToleranceValue(e));
        document.getElementById('qualitySlider').addEventListener('input', (e) => this.updateQualityValue(e));
        
        // Button Events
        document.getElementById('processBtn').addEventListener('click', () => this.processAllImages());
        document.getElementById('previewBtn').addEventListener('click', () => this.previewProcessing());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('downloadAllBtn').addEventListener('click', () => this.downloadAllImages());
        document.getElementById('downloadZipBtn').addEventListener('click', () => this.downloadAsZip());
        document.getElementById('pickColorBtn').addEventListener('click', () => this.activateColorPicker());
        document.getElementById('pickReplaceColorBtn').addEventListener('click', () => this.activateReplaceColorPicker());
    }

    setupCanvas() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Add Canvas Event Listeners
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
                    <button class="btn btn-primary" onclick="backgroundChanger.processSingleImage('${imageData.id}')">Process</button>
                    <button class="btn btn-outline" onclick="backgroundChanger.removeImage('${imageData.id}')">Delete</button>
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

    setupModeToggle() {
        // Background Type Switching
        document.querySelectorAll('input[name="backgroundType"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handleBackgroundTypeChange(e));
        });
        
        // Detection Mode Switching
        document.querySelectorAll('input[name="detectionMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handleDetectionModeChange(e));
        });
    }

    handleBackgroundTypeChange(e) {
        const solidGroup = document.getElementById('solidGroup');
        const gradientGroup = document.getElementById('gradientGroup');
        const patternGroup = document.getElementById('patternGroup');
        
        solidGroup.style.display = e.target.value === 'solid' ? 'block' : 'none';
        gradientGroup.style.display = e.target.value === 'gradient' ? 'block' : 'none';
        patternGroup.style.display = e.target.value === 'pattern' ? 'block' : 'none';
    }

    handleDetectionModeChange(e) {
        const manualGroup = document.getElementById('manualGroup');
        const colorGroup = document.getElementById('colorGroup');
        
        manualGroup.style.display = e.target.value === 'manual' ? 'block' : 'none';
        colorGroup.style.display = e.target.value === 'color' ? 'block' : 'none';
    }

    updateColorIntensityValue(e) {
        document.getElementById('colorIntensityValue').textContent = e.target.value + '%';
    }

    updateGradientAngleValue(e) {
        document.getElementById('gradientAngleValue').textContent = e.target.value + '°';
    }

    updatePatternSizeValue(e) {
        document.getElementById('patternSizeValue').textContent = e.target.value + 'px';
    }

    updatePatternDensityValue(e) {
        document.getElementById('patternDensityValue').textContent = e.target.value + '%';
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
                alert('Background changed successfully!');
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

        // Display Processing Results
        let resultMessage = `Processing complete! Success: ${successCount} images`;
        if (errorCount > 0) {
            resultMessage += `, Failed: ${errorCount} images`;
        }
        
        this.updateProgress(totalImages, totalImages, resultMessage);
        this.isProcessing = false;
        this.displayResults();
        
        // Show Result Notification
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
                    reject(new Error('Cannot create Canvas context'));
                    return;
                }
                
                canvas.width = imageData.width;
                canvas.height = imageData.height;
                
                // Draw Original Image
                ctx.drawImage(imageData.img, 0, 0);
                
                // Get Processing Settings
                const settings = this.getProcessingSettings();
                
                // Apply Background Replacement Algorithm
                this.changeBackground(ctx, settings, canvas.width, canvas.height);
                
                // Get Output Format
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
                
                // Generate Data URL
                const quality = settings.quality / 100;
                const dataUrl = canvas.toDataURL(mimeType, quality);
                
                if (!dataUrl || dataUrl === 'data:,') {
                    reject(new Error('Cannot generate processed image'));
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
                
                // Generate File Name
                const originalName = imageData.name.split('.')[0];
                const fileName = `${originalName}_newbg.${fileExtension}`;
                
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

    changeBackground(ctx, settings, width, height) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        console.log('Starting background replacement processing:', {
            width,
            height,
            backgroundType: settings.backgroundType,
            detectionMode: settings.detectionMode
        });
        
        // Detect Background Area
        const backgroundMask = this.detectBackground(data, settings, width, height);
        
        // Create New Background
        const newBackground = this.createNewBackground(settings, width, height);
        
        // Apply New Background
        this.applyNewBackground(data, backgroundMask, newBackground, width, height);
        
        // Apply Post-processing Effects
        if (settings.smoothEdges) {
            console.log('Applying edge smoothing');
            this.smoothEdges(data, width, height);
        }
        
        if (settings.enhanceContrast) {
            console.log('Applying contrast enhancement');
            this.enhanceContrast(data, width, height);
        }
        
        ctx.putImageData(imageData, 0, 0);
        console.log('Background replacement processing completed');
    }

    detectBackground(data, settings, width, height) {
        const mask = new Array(width * height).fill(false);
        
        switch (settings.detectionMode) {
            case 'auto':
                return this.autoDetectBackground(data, width, height);
            case 'manual':
                return this.manualDetectBackground(data, settings, width, height);
            case 'color':
                return this.colorDetectBackground(data, settings, width, height);
            default:
                return this.autoDetectBackground(data, width, height);
        }
    }

    autoDetectBackground(data, width, height) {
        const mask = new Array(width * height).fill(false);
        
        for (let i = 0; i < data.length; i += 4) {
            const pixelIndex = i / 4;
            const x = pixelIndex % width;
            const y = Math.floor(pixelIndex / width);
            
            // Edge Detection - Edge pixels are more likely to be subject
            const isEdge = this.isEdgePixel(x, y, width, height);
            
            // Color Analysis - Detect background color
            const isBackground = this.isBackgroundColor(data, width, height, x, y);
            
            // Position Analysis - Corners and edges are more likely to be background
            const isCorner = this.isCornerPixel(x, y, width, height);
            
            // Comprehensive Judgment
            if (isCorner && !isEdge) {
                mask[pixelIndex] = true;
            } else if (isBackground && !isEdge) {
                mask[pixelIndex] = true;
            }
        }
        
        return mask;
    }

    manualDetectBackground(data, settings, width, height) {
        // Manual Selection Area Processing
        // Background detection based on user-selected area can be implemented here
        // Temporarily using automatic algorithm as foundation
        return this.autoDetectBackground(data, width, height);
    }

    colorDetectBackground(data, settings, width, height) {
        const mask = new Array(width * height).fill(false);
        const replaceColor = this.hexToRgb(settings.replaceColor);
        const tolerance = settings.colorTolerance;
        
        for (let i = 0; i < data.length; i += 4) {
            const pixelIndex = i / 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Calculate Color Difference
            const colorDiff = Math.sqrt(
                Math.pow(r - replaceColor.r, 2) +
                Math.pow(g - replaceColor.g, 2) +
                Math.pow(b - replaceColor.b, 2)
            );
            
            // If color difference is within tolerance range, mark as background
            if (colorDiff <= tolerance) {
                mask[pixelIndex] = true;
            }
        }
        
        return mask;
    }

    createNewBackground(settings, width, height) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;
        
        switch (settings.backgroundType) {
            case 'solid':
                this.createSolidBackground(ctx, settings, width, height);
                break;
            case 'gradient':
                this.createGradientBackground(ctx, settings, width, height);
                break;
            case 'pattern':
                this.createPatternBackground(ctx, settings, width, height);
                break;
        }
        
        return ctx.getImageData(0, 0, width, height);
    }

    createSolidBackground(ctx, settings, width, height) {
        const backgroundColor = this.hexToRgb(settings.backgroundColor);
        const intensity = settings.colorIntensity / 100;
        
        ctx.fillStyle = `rgba(${backgroundColor.r}, ${backgroundColor.g}, ${backgroundColor.b}, ${intensity})`;
        ctx.fillRect(0, 0, width, height);
    }

    createGradientBackground(ctx, settings, width, height) {
        const startColor = this.hexToRgb(settings.gradientStartColor);
        const endColor = this.hexToRgb(settings.gradientEndColor);
        const angle = settings.gradientAngle;
        const direction = settings.gradientDirection;
        
        let gradient;
        
        if (direction === 'linear') {
            const radians = (angle * Math.PI) / 180;
            const x1 = width / 2 - (width / 2) * Math.cos(radians);
            const y1 = height / 2 - (height / 2) * Math.sin(radians);
            const x2 = width / 2 + (width / 2) * Math.cos(radians);
            const y2 = height / 2 + (height / 2) * Math.sin(radians);
            
            gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        } else if (direction === 'radial') {
            gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 2);
        } else { // conic
            gradient = ctx.createConicGradient(angle * Math.PI / 180, width / 2, height / 2);
        }
        
        gradient.addColorStop(0, `rgb(${startColor.r}, ${startColor.g}, ${startColor.b})`);
        gradient.addColorStop(1, `rgb(${endColor.r}, ${endColor.g}, ${endColor.b})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    createPatternBackground(ctx, settings, width, height) {
        const patternType = settings.patternType;
        const patternColor = this.hexToRgb(settings.patternColor);
        const patternSize = settings.patternSize;
        const patternDensity = settings.patternDensity / 100;
        
        // Create Pattern
        const patternCanvas = document.createElement('canvas');
        const patternCtx = patternCanvas.getContext('2d');
        patternCanvas.width = patternSize;
        patternCanvas.height = patternSize;
        
        patternCtx.fillStyle = `rgb(${patternColor.r}, ${patternColor.g}, ${patternColor.b})`;
        
        switch (patternType) {
            case 'dots':
                this.createDotsPattern(patternCtx, patternSize, patternDensity);
                break;
            case 'lines':
                this.createLinesPattern(patternCtx, patternSize, patternDensity);
                break;
            case 'grid':
                this.createGridPattern(patternCtx, patternSize, patternDensity);
                break;
            case 'waves':
                this.createWavesPattern(patternCtx, patternSize, patternDensity);
                break;
            case 'stars':
                this.createStarsPattern(patternCtx, patternSize, patternDensity);
                break;
        }
        
        const pattern = ctx.createPattern(patternCanvas, 'repeat');
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, width, height);
    }

    createDotsPattern(ctx, size, density) {
        const dotSize = size * 0.1;
        const spacing = size / Math.sqrt(density * 10);
        
        for (let x = 0; x < size; x += spacing) {
            for (let y = 0; y < size; y += spacing) {
                ctx.beginPath();
                ctx.arc(x, y, dotSize, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
    }

    createLinesPattern(ctx, size, density) {
        const lineWidth = size * 0.05;
        const spacing = size / (density * 5);
        
        ctx.lineWidth = lineWidth;
        
        for (let x = 0; x < size; x += spacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, size);
            ctx.stroke();
        }
    }

    createGridPattern(ctx, size, density) {
        const lineWidth = size * 0.02;
        const spacing = size / (density * 3);
        
        ctx.lineWidth = lineWidth;
        
        for (let x = 0; x < size; x += spacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, size);
            ctx.stroke();
        }
        
        for (let y = 0; y < size; y += spacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(size, y);
            ctx.stroke();
        }
    }

    createWavesPattern(ctx, size, density) {
        const amplitude = size * 0.1;
        const frequency = density * 2;
        
        ctx.lineWidth = 2;
        
        for (let i = 0; i < frequency; i++) {
            ctx.beginPath();
            for (let x = 0; x < size; x++) {
                const y = size / 2 + amplitude * Math.sin((x / size) * Math.PI * 2 + i * Math.PI / 2);
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }
    }

    createStarsPattern(ctx, size, density) {
        const starCount = Math.floor(density * 5);
        
        for (let i = 0; i < starCount; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const starSize = size * 0.05;
            
            this.drawStar(ctx, x, y, starSize);
        }
    }

    drawStar(ctx, x, y, size) {
        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size * 0.5;
        
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();
    }

    applyNewBackground(data, backgroundMask, newBackground, width, height) {
        for (let i = 0; i < data.length; i += 4) {
            const pixelIndex = i / 4;
            
            if (backgroundMask[pixelIndex]) {
                // Replace Background Pixels
                data[i] = newBackground.data[i];
                data[i + 1] = newBackground.data[i + 1];
                data[i + 2] = newBackground.data[i + 2];
                data[i + 3] = newBackground.data[i + 3];
            }
        }
    }

    isEdgePixel(x, y, width, height) {
        const edgeThreshold = 5;
        return x < edgeThreshold || x >= width - edgeThreshold || 
               y < edgeThreshold || y >= height - edgeThreshold;
    }

    isCornerPixel(x, y, width, height) {
        const cornerSize = Math.min(width, height) * 0.1;
        return (x < cornerSize && y < cornerSize) ||
               (x >= width - cornerSize && y < cornerSize) ||
               (x < cornerSize && y >= height - cornerSize) ||
               (x >= width - cornerSize && y >= height - cornerSize);
    }

    isBackgroundColor(data, width, height, x, y) {
        const sampleSize = 3;
        let similarCount = 0;
        let totalCount = 0;
        
        const centerIndex = (y * width + x) * 4;
        const r = data[centerIndex];
        const g = data[centerIndex + 1];
        const b = data[centerIndex + 2];
        
        for (let dy = -sampleSize; dy <= sampleSize; dy++) {
            for (let dx = -sampleSize; dx <= sampleSize; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const index = (ny * width + nx) * 4;
                    const nr = data[index];
                    const ng = data[index + 1];
                    const nb = data[index + 2];
                    
                    const colorDiff = Math.sqrt(
                        Math.pow(r - nr, 2) +
                        Math.pow(g - ng, 2) +
                        Math.pow(b - nb, 2)
                    );
                    
                    if (colorDiff < 30) {
                        similarCount++;
                    }
                    totalCount++;
                }
            }
        }
        
        return similarCount / totalCount > 0.6;
    }

    smoothEdges(data, width, height) {
        const tempData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const index = (y * width + x) * 4;
                
                let rSum = 0, gSum = 0, bSum = 0, count = 0;
                
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const nIndex = (ny * width + nx) * 4;
                            rSum += tempData[nIndex];
                            gSum += tempData[nIndex + 1];
                            bSum += tempData[nIndex + 2];
                            count++;
                        }
                    }
                }
                
                data[index] = Math.round(rSum / count);
                data[index + 1] = Math.round(gSum / count);
                data[index + 2] = Math.round(bSum / count);
            }
        }
    }

    enhanceContrast(data, width, height) {
        for (let i = 0; i < data.length; i += 4) {
            const contrast = 1.2;
            
            data[i] = Math.min(255, Math.max(0, (data[i] - 128) * contrast + 128));
            data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrast + 128));
            data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrast + 128));
        }
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
        const backgroundType = document.querySelector('input[name="backgroundType"]:checked').value;
        const backgroundColor = document.getElementById('backgroundColor').value;
        const colorIntensity = parseInt(document.getElementById('colorIntensity').value);
        const gradientStartColor = document.getElementById('gradientStartColor').value;
        const gradientEndColor = document.getElementById('gradientEndColor').value;
        const gradientDirection = document.getElementById('gradientDirection').value;
        const gradientAngle = parseInt(document.getElementById('gradientAngle').value);
        const patternType = document.getElementById('patternType').value;
        const patternColor = document.getElementById('patternColor').value;
        const patternSize = parseInt(document.getElementById('patternSize').value);
        const patternDensity = parseInt(document.getElementById('patternDensity').value);
        const detectionMode = document.querySelector('input[name="detectionMode"]:checked').value;
        const replaceColor = document.getElementById('replaceColor').value;
        const colorTolerance = parseInt(document.getElementById('colorTolerance').value);
        const preserveShadows = document.getElementById('preserveShadows').checked;
        const smoothEdges = document.getElementById('smoothEdges').checked;
        const enhanceContrast = document.getElementById('enhanceContrast').checked;
        const autoDetect = document.getElementById('autoDetect').checked;
        const previewMode = document.getElementById('previewMode').checked;
        const outputFormat = document.getElementById('outputFormat').value;
        const quality = parseInt(document.getElementById('qualitySlider').value);
        
        return {
            backgroundType,
            backgroundColor,
            colorIntensity,
            gradientStartColor,
            gradientEndColor,
            gradientDirection,
            gradientAngle,
            patternType,
            patternColor,
            patternSize,
            patternDensity,
            detectionMode,
            replaceColor,
            colorTolerance,
            preserveShadows,
            smoothEdges,
            enhanceContrast,
            autoDetect,
            previewMode,
            outputFormat,
            quality
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

        this.processedImages.forEach(imageData => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.innerHTML = `
                <img src="${imageData.dataUrl}" alt="${imageData.name}" class="result-preview" />
                <div class="result-info">${this.formatFileSize(imageData.size)} | ${imageData.width}×${imageData.height}</div>
                <div class="result-name">${imageData.name}</div>
                <div class="result-actions">
                    <button class="btn btn-success" onclick="backgroundChanger.downloadSingleImage('${imageData.name}')">Download</button>
                </div>
            `;
            resultsGrid.appendChild(resultItem);
        });

        document.getElementById('resultsSection').style.display = 'block';
    }

    async previewProcessing() {
        if (this.images.length === 0) {
            alert('Please select images first');
            return;
        }

        const firstImage = this.images[0];
        const processedImage = await this.processImage(firstImage);
        
        if (processedImage) {
            // Create Preview Window
            const previewWindow = window.open('', '_blank', 'width=1200,height=800');
            previewWindow.document.write(`
                <html>
                    <head>
                        <title>Background Change Preview</title>
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
                        <h2>Background Change Preview</h2>
                        <div class="preview-container">
                            <div class="preview-item">
                                <h3>Before</h3>
                                <img src="${firstImage.dataUrl}" alt="Before" />
                                <div class="preview-info">Size: ${firstImage.width}×${firstImage.height}</div>
                                <div class="preview-info">File Size: ${this.formatFileSize(firstImage.size)}</div>
                            </div>
                            <div class="preview-item">
                                <h3>After</h3>
                                <img src="${processedImage.dataUrl}" alt="After" />
                                <div class="preview-info">Size: ${processedImage.width}×${processedImage.height}</div>
                                <div class="preview-info">File Size: ${this.formatFileSize(processedImage.size)}</div>
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
        // An alternative solution is provided here: download one by one
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

    // Manual Selection Methods
    startDrawing(e) {
        this.isDrawing = true;
        // Implement Manual Selection Functionality
    }

    draw(e) {
        if (!this.isDrawing) return;
        // Implement Drawing Functionality
    }

    stopDrawing(e) {
        this.isDrawing = false;
        // Implement Stop Drawing Functionality
    }

    handleCanvasClick(e) {
        // Handle Canvas Click Events
    }

    activateColorPicker() {
        // Activate Color Picker Functionality
        alert('Color Picker: Click on colors in the image to set the background color');
    }

    activateReplaceColorPicker() {
        // Activate Replace Color Picker Functionality
        alert('Replace Color Picker: Click on colors in the image to set the color to replace')
    }
}

// Initialize Application
let backgroundChanger;
document.addEventListener('DOMContentLoaded', () => {
    backgroundChanger = new BackgroundChanger();
});
