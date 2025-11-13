class OldPhotoRestorer {
    constructor() {
        this.images = [];
        this.restoredImages = [];
        this.isProcessing = false;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupPresetButtons();
    }

    bindEvents() {
        // File Upload
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.querySelector('.upload-area');
        
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and Drop Upload
        uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Slider Controls
        document.getElementById('intensitySlider').addEventListener('input', (e) => this.updateIntensityValue(e));
        document.getElementById('saturationSlider').addEventListener('input', (e) => this.updateSaturationValue(e));
        document.getElementById('contrastSlider').addEventListener('input', (e) => this.updateContrastValue(e));
        document.getElementById('brightnessSlider').addEventListener('input', (e) => this.updateBrightnessValue(e));
        document.getElementById('sharpenSlider').addEventListener('input', (e) => this.updateSharpenValue(e));
        document.getElementById('detailSlider').addEventListener('input', (e) => this.updateDetailValue(e));
        document.getElementById('qualitySlider').addEventListener('input', (e) => this.updateQualityValue(e));
        
        // Button Events
        document.getElementById('restoreBtn').addEventListener('click', () => this.restoreAllImages());
        document.getElementById('previewBtn').addEventListener('click', () => this.previewRestoration());
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
            alert('Please select image files');
            return;
        }

        if (imageFiles.length > 5) {
            alert('You can upload a maximum of 5 images');
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
                    <button class="btn btn-primary" onclick="oldPhotoRestorer.restoreSingleImage('${imageData.id}')">Restore</button>
                    <button class="btn btn-outline" onclick="oldPhotoRestorer.removeImage('${imageData.id}')">Remove</button>
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
        // Intensity Preset Buttons
        document.querySelectorAll('.intensity-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setIntensityPreset(e));
        });
    }

    setIntensityPreset(e) {
        const value = parseInt(e.target.dataset.value);
        const slider = document.getElementById('intensitySlider');
        const valueDisplay = document.getElementById('intensityValue');
        
        slider.value = value;
        valueDisplay.textContent = value;
        
        // Update Button States
        document.querySelectorAll('.intensity-preset-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
    }

    updateIntensityValue(e) {
        document.getElementById('intensityValue').textContent = e.target.value;
    }

    updateSaturationValue(e) {
        document.getElementById('saturationValue').textContent = e.target.value + '%';
    }

    updateContrastValue(e) {
        document.getElementById('contrastValue').textContent = e.target.value + '%';
    }

    updateBrightnessValue(e) {
        document.getElementById('brightnessValue').textContent = e.target.value + '%';
    }

    updateSharpenValue(e) {
        document.getElementById('sharpenValue').textContent = e.target.value + '%';
    }

    updateDetailValue(e) {
        document.getElementById('detailValue').textContent = e.target.value + '%';
    }

    updateQualityValue(e) {
        document.getElementById('qualityValue').textContent = e.target.value + '%';
    }

    async restoreSingleImage(imageId) {
        const imageData = this.images.find(img => img.id == imageId);
        if (!imageData) return;

        const restoredImage = await this.restoreImage(imageData);
        if (restoredImage) {
            this.restoredImages.push(restoredImage);
            this.displayResults();
        }
    }

    async restoreAllImages() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.restoredImages = [];
        this.showProgress();
        
        const totalImages = this.images.length;
        let completed = 0;

        for (let i = 0; i < totalImages; i++) {
            const imageData = this.images[i];
            this.updateProgress(completed, totalImages, `Restoring: ${imageData.name}`);
            
            try {
                const restoredImage = await this.restoreImage(imageData);
                if (restoredImage) {
                    this.restoredImages.push(restoredImage);
                }
                completed++;
            } catch (error) {
                console.error('Photo restoration failed:', error);
                completed++;
            }
        }

        this.updateProgress(totalImages, totalImages, 'Restoration completed');
        this.isProcessing = false;
        this.displayResults();
    }

    async restoreImage(imageData) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = imageData.width;
            canvas.height = imageData.height;
            
            // Draw Original Image
            ctx.drawImage(imageData.img, 0, 0);
            
            // Get Restoration Settings
            const settings = this.getRestorationSettings();
            
            // Apply Restoration Algorithm
            this.applyRestoration(ctx, settings, canvas.width, canvas.height);
            
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
            const fileName = `${originalName}_restored.${fileExtension}`;
            
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

    applyRestoration(ctx, settings, width, height) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // Apply Different Algorithms Based on Repair Type
        switch (settings.repairType) {
            case 'auto':
                this.applyAutoRestoration(data, settings, width, height);
                break;
            case 'color':
                this.applyColorRestoration(data, settings, width, height);
                break;
            case 'damage':
                this.applyDamageRestoration(data, settings, width, height);
                break;
            case 'noise':
                this.applyNoiseRestoration(data, settings, width, height);
                break;
        }
        
        // Apply Post-processing Effects
        if (settings.autoColorBalance) {
            this.applyColorBalance(data, width, height);
        }
        
        if (settings.noiseReduction) {
            this.reduceNoise(data, width, height);
        }
        
        if (settings.edgeEnhancement) {
            this.enhanceEdges(data, width, height);
        }
        
        if (settings.textureRestoration) {
            this.restoreTexture(data, width, height);
        }
        
        if (settings.scratchRemoval) {
            this.removeScratches(data, width, height);
        }
        
        if (settings.stainRemoval) {
            this.removeStains(data, width, height);
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    applyAutoRestoration(data, settings, width, height) {
        const intensity = settings.intensity / 10;
        
        // Auto-detect and Repair Various Issues
        this.applyColorRestoration(data, settings, width, height);
        this.applyDamageRestoration(data, settings, width, height);
        this.applyNoiseRestoration(data, settings, width, height);
    }

    applyColorRestoration(data, settings, width, height) {
        const intensity = settings.intensity / 10;
        const saturation = settings.saturation / 100;
        const contrast = settings.contrast / 100;
        const brightness = settings.brightness / 100;
        
        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];
            
            // Brightness Adjustment
            r = Math.min(255, Math.max(0, r * brightness));
            g = Math.min(255, Math.max(0, g * brightness));
            b = Math.min(255, Math.max(0, b * brightness));
            
            // Contrast Adjustment
            r = Math.min(255, Math.max(0, (r - 128) * contrast + 128));
            g = Math.min(255, Math.max(0, (g - 128) * contrast + 128));
            b = Math.min(255, Math.max(0, (b - 128) * contrast + 128));
            
            // Saturation Adjustment
            const gray = (r + g + b) / 3;
            r = Math.min(255, Math.max(0, gray + (r - gray) * saturation));
            g = Math.min(255, Math.max(0, gray + (g - gray) * saturation));
            b = Math.min(255, Math.max(0, gray + (b - gray) * saturation));
            
            data[i] = Math.round(r);
            data[i + 1] = Math.round(g);
            data[i + 2] = Math.round(b);
        }
    }

    applyDamageRestoration(data, settings, width, height) {
        const intensity = settings.intensity / 10;
        
        // Detect and Repair Damaged Areas
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const index = (y * width + x) * 4;
                
                // Detect Abnormal Pixels
                if (this.isDamagedPixel(data, width, height, x, y)) {
                    // Repair Using Surrounding Pixels
                    const repaired = this.repairPixel(data, width, height, x, y);
                    data[index] = Math.round(data[index] * (1 - intensity) + repaired.r * intensity);
                    data[index + 1] = Math.round(data[index + 1] * (1 - intensity) + repaired.g * intensity);
                    data[index + 2] = Math.round(data[index + 2] * (1 - intensity) + repaired.b * intensity);
                }
            }
        }
    }

    applyNoiseRestoration(data, settings, width, height) {
        const intensity = settings.intensity / 10;
        const tempData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const index = (y * width + x) * 4;
                
                // Median Filter Noise Reduction
                const median = this.calculateMedian(tempData, width, height, x, y);
                
                data[index] = Math.round(data[index] * (1 - intensity) + median.r * intensity);
                data[index + 1] = Math.round(data[index + 1] * (1 - intensity) + median.g * intensity);
                data[index + 2] = Math.round(data[index + 2] * (1 - intensity) + median.b * intensity);
            }
        }
    }

    applyColorBalance(data, width, height) {
        // Calculate Overall Color Statistics
        let rSum = 0, gSum = 0, bSum = 0;
        let count = 0;
        
        for (let i = 0; i < data.length; i += 40) { // Sampling
            rSum += data[i];
            gSum += data[i + 1];
            bSum += data[i + 2];
            count++;
        }
        
        const rAvg = rSum / count;
        const gAvg = gSum / count;
        const bAvg = bSum / count;
        
        // White Balance Correction
        const maxAvg = Math.max(rAvg, gAvg, bAvg);
        const rFactor = maxAvg / rAvg;
        const gFactor = maxAvg / gAvg;
        const bFactor = maxAvg / bAvg;
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, Math.max(0, data[i] * rFactor));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * gFactor));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * bFactor));
        }
    }

    reduceNoise(data, width, height) {
        const tempData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const index = (y * width + x) * 4;
                
                // Gaussian Blur Noise Reduction
                const blurred = this.applyGaussianBlur(tempData, width, height, x, y);
                
                data[index] = Math.round(data[index] * 0.7 + blurred.r * 0.3);
                data[index + 1] = Math.round(data[index + 1] * 0.7 + blurred.g * 0.3);
                data[index + 2] = Math.round(data[index + 2] * 0.7 + blurred.b * 0.3);
            }
        }
    }

    enhanceEdges(data, width, height) {
        const tempData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const index = (y * width + x) * 4;
                
                // Laplacian Operator Edge Enhancement
                const laplacian = this.applyLaplacian(tempData, width, height, x, y);
                
                data[index] = Math.max(0, Math.min(255, data[index] + laplacian.r * 0.3));
                data[index + 1] = Math.max(0, Math.min(255, data[index + 1] + laplacian.g * 0.3));
                data[index + 2] = Math.max(0, Math.min(255, data[index + 2] + laplacian.b * 0.3));
            }
        }
    }

    restoreTexture(data, width, height) {
        // Texture Repair Algorithm
        for (let y = 2; y < height - 2; y++) {
            for (let x = 2; x < width - 2; x++) {
                const index = (y * width + x) * 4;
                
                // Calculate Local Texture
                const texture = this.calculateLocalTexture(data, width, height, x, y);
                
                data[index] = Math.round(data[index] * 0.8 + texture.r * 0.2);
                data[index + 1] = Math.round(data[index + 1] * 0.8 + texture.g * 0.2);
                data[index + 2] = Math.round(data[index + 2] * 0.8 + texture.b * 0.2);
            }
        }
    }

    removeScratches(data, width, height) {
        // Scratch Detection and Repair
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const index = (y * width + x) * 4;
                
                if (this.isScratchPixel(data, width, height, x, y)) {
                    const repaired = this.repairPixel(data, width, height, x, y);
                    data[index] = repaired.r;
                    data[index + 1] = repaired.g;
                    data[index + 2] = repaired.b;
                }
            }
        }
    }

    removeStains(data, width, height) {
        // Stain Detection and Repair
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const index = (y * width + x) * 4;
                
                if (this.isStainPixel(data, width, height, x, y)) {
                    const repaired = this.repairPixel(data, width, height, x, y);
                    data[index] = repaired.r;
                    data[index + 1] = repaired.g;
                    data[index + 2] = repaired.b;
                }
            }
        }
    }

    // Helper Methods
    isDamagedPixel(data, width, height, x, y) {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        
        // Detect Abnormal Pixels (Overly Bright, Dark or Color Anomalies)
        const brightness = (r + g + b) / 3;
        return brightness < 10 || brightness > 245 || Math.abs(r - g) > 50 || Math.abs(g - b) > 50;
    }

    isScratchPixel(data, width, height, x, y) {
        // Simplified Scratch Detection
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        
        // Detect Linear Anomalies
        return Math.abs(r - g) < 5 && Math.abs(g - b) < 5 && (r + g + b) / 3 < 50;
    }

    isStainPixel(data, width, height, x, y) {
        // Simplified Stain Detection
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        
        // Detect Color Anomalies
        return Math.abs(r - g) > 30 || Math.abs(g - b) > 30;
    }

    repairPixel(data, width, height, x, y) {
        let r = 0, g = 0, b = 0, count = 0;
        
        // Use Average of 8 Surrounding Pixels
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const px = x + dx;
                const py = y + dy;
                
                if (px >= 0 && px < width && py >= 0 && py < height) {
                    const index = (py * width + px) * 4;
                    r += data[index];
                    g += data[index + 1];
                    b += data[index + 2];
                    count++;
                }
            }
        }
        
        return {
            r: count > 0 ? Math.round(r / count) : 128,
            g: count > 0 ? Math.round(g / count) : 128,
            b: count > 0 ? Math.round(b / count) : 128
        };
    }

    calculateMedian(data, width, height, x, y) {
        const values = [];
        
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const px = x + dx;
                const py = y + dy;
                
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
        
        values.sort((a, b) => (a.r + a.g + a.b) - (b.r + b.g + b.b));
        return values[Math.floor(values.length / 2)];
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

    calculateLocalTexture(data, width, height, x, y) {
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                const px = x + dx;
                const py = y + dy;
                
                if (px >= 0 && px < width && py >= 0 && py < height) {
                    const index = (py * width + px) * 4;
                    r += data[index];
                    g += data[index + 1];
                    b += data[index + 2];
                    count++;
                }
            }
        }
        
        return {
            r: Math.round(r / count),
            g: Math.round(g / count),
            b: Math.round(b / count)
        };
    }

    getRestorationSettings() {
        const repairType = document.querySelector('input[name="repairType"]:checked').value;
        const intensity = parseInt(document.getElementById('intensitySlider').value);
        const saturation = parseInt(document.getElementById('saturationSlider').value);
        const contrast = parseInt(document.getElementById('contrastSlider').value);
        const brightness = parseInt(document.getElementById('brightnessSlider').value);
        const sharpen = parseInt(document.getElementById('sharpenSlider').value);
        const detail = parseInt(document.getElementById('detailSlider').value);
        const autoColorBalance = document.getElementById('autoColorBalance').checked;
        const noiseReduction = document.getElementById('noiseReduction').checked;
        const edgeEnhancement = document.getElementById('edgeEnhancement').checked;
        const textureRestoration = document.getElementById('textureRestoration').checked;
        const scratchRemoval = document.getElementById('scratchRemoval').checked;
        const stainRemoval = document.getElementById('stainRemoval').checked;
        const outputFormat = document.getElementById('outputFormat').value;
        const quality = parseInt(document.getElementById('qualitySlider').value);
        
        return {
            repairType,
            intensity,
            saturation,
            contrast,
            brightness,
            sharpen,
            detail,
            autoColorBalance,
            noiseReduction,
            edgeEnhancement,
            textureRestoration,
            scratchRemoval,
            stainRemoval,
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

        this.restoredImages.forEach(imageData => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.innerHTML = `
                <img src="${imageData.dataUrl}" alt="${imageData.name}" class="result-preview" />
                <div class="result-info">${this.formatFileSize(imageData.size)} | ${imageData.width}×${imageData.height}</div>
                <div class="result-name">${imageData.name}</div>
                <div class="result-actions">
                    <button class="btn btn-success" onclick="oldPhotoRestorer.downloadSingleImage('${imageData.name}')">Download</button>
                </div>
            `;
            resultsGrid.appendChild(resultItem);
        });

        document.getElementById('resultsSection').style.display = 'block';
    }

    async previewRestoration() {
        if (this.images.length === 0) {
            alert('Please select an image first');
            return;
        }

        const firstImage = this.images[0];
        const restoredImage = await this.restoreImage(firstImage);
        
        if (restoredImage) {
            // Create Preview Window
            const previewWindow = window.open('', '_blank', 'width=1200,height=800');
            previewWindow.document.write(`
                <html>
                    <head>
                        <title>Old Photo Restoration Preview</title>
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
                        <h2>Old Photo Restoration Preview</h2>
                        <div class="preview-container">
                            <div class="preview-item">
                                <h3>Before Restoration</h3>
                                <img src="${firstImage.dataUrl}" alt="Before Restoration" />
                                <div class="preview-info">Size: ${firstImage.width}×${firstImage.height}</div>
                                <div class="preview-info">File Size: ${this.formatFileSize(firstImage.size)}</div>
                            </div>
                            <div class="preview-item">
                                <h3>After Restoration</h3>
                                <img src="${restoredImage.dataUrl}" alt="After Restoration" />
                                <div class="preview-info">Size: ${restoredImage.width}×${restoredImage.height}</div>
                                <div class="preview-info">File Size: ${this.formatFileSize(restoredImage.size)}</div>
                            </div>
                        </div>
                    </body>
                </html>
            `);
        }
    }

    downloadSingleImage(imageName) {
        const imageData = this.restoredImages.find(img => img.name === imageName);
        if (!imageData) return;

        const link = document.createElement('a');
        link.download = imageData.name;
        link.href = imageData.dataUrl;
        link.click();
    }

    downloadAllImages() {
        this.restoredImages.forEach(imageData => {
            setTimeout(() => {
                this.downloadSingleImage(imageData.name);
            }, 100);
        });
    }

    async downloadAsZip() {
        if (this.restoredImages.length === 0) {
            alert('No images available for download');
            return;
        }

        // Due to browser limitations, we cannot directly create ZIP files
        // Alternative solution: download one by one
        alert('Due to browser limitations, images will be downloaded one by one');
        this.downloadAllImages();
    }

    clearAll() {
        this.images = [];
        this.restoredImages = [];
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

// Initialize the application
let oldPhotoRestorer;
document.addEventListener('DOMContentLoaded', () => {
    oldPhotoRestorer = new OldPhotoRestorer();
});
