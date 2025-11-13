class WatermarkRemover {
    constructor() {
        this.images = [];
        this.processedImages = [];
        this.isProcessing = false;
        this.currentImage = null;
        this.selectionStart = null;
        this.selectionEnd = null;
        this.isSelecting = false;
        this.canvas = null;
        this.ctx = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupMethodToggle();
        this.setupPresetButtons();
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
        document.getElementById('aiIntensitySlider').addEventListener('input', (e) => this.updateAiIntensityValue(e));
        document.getElementById('sensitivitySlider').addEventListener('input', (e) => this.updateSensitivityValue(e));
        document.getElementById('qualitySlider').addEventListener('input', (e) => this.updateQualityValue(e));
        
        // Button events
        document.getElementById('removeWatermarkBtn').addEventListener('click', () => this.removeWatermarkFromAll());
        document.getElementById('previewBtn').addEventListener('click', () => this.previewRemoval());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('downloadAllBtn').addEventListener('click', () => this.downloadAllImages());
        document.getElementById('downloadZipBtn').addEventListener('click', () => this.downloadAsZip());
        
        // Editor tools
        document.getElementById('selectTool').addEventListener('click', () => this.setTool('select'));
        document.getElementById('zoomTool').addEventListener('click', () => this.setTool('zoom'));
        document.getElementById('panTool').addEventListener('click', () => this.setTool('pan'));
        document.getElementById('resetView').addEventListener('click', () => this.resetView());
        document.getElementById('confirmSelection').addEventListener('click', () => this.confirmSelection());
        document.getElementById('cancelSelection').addEventListener('click', () => this.cancelSelection());
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
            alert('Maximum 5 images allowed');
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
                    <button class="btn btn-primary" onclick="watermarkRemover.removeWatermarkFromSingle('${imageData.id}')">Remove Watermark</button>
                    <button class="btn btn-secondary" onclick="watermarkRemover.editImage('${imageData.id}')">Edit</button>
                    <button class="btn btn-outline" onclick="watermarkRemover.removeImage('${imageData.id}')">Remove</button>
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
        document.getElementById('editorSection').style.display = 'none';
        document.getElementById('progressSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'none';
    }

    setupMethodToggle() {
        document.querySelectorAll('input[name="removalMethod"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handleMethodChange(e));
        });
    }

    handleMethodChange(e) {
        const aiGroup = document.getElementById('aiSettingsGroup');
        const manualGroup = document.getElementById('manualSettingsGroup');
        const autoGroup = document.getElementById('autoSettingsGroup');
        
        // Hide all groups
        aiGroup.style.display = 'none';
        manualGroup.style.display = 'none';
        autoGroup.style.display = 'none';
        
        // Show selected group
        switch (e.target.value) {
            case 'ai':
                aiGroup.style.display = 'flex';
                break;
            case 'manual':
                manualGroup.style.display = 'flex';
                break;
            case 'auto':
                autoGroup.style.display = 'flex';
                break;
        }
    }

    setupPresetButtons() {
        // AI preset buttons
        document.querySelectorAll('.ai-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setAiPreset(e));
        });
    }

    setAiPreset(e) {
        const value = parseInt(e.target.dataset.value);
        const slider = document.getElementById('aiIntensitySlider');
        const valueDisplay = document.getElementById('aiIntensityValue');
        
        slider.value = value;
        valueDisplay.textContent = value;
        
        // Update button state
        document.querySelectorAll('.ai-preset-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
    }

    updateAiIntensityValue(e) {
        document.getElementById('aiIntensityValue').textContent = e.target.value;
    }

    updateSensitivityValue(e) {
        document.getElementById('sensitivityValue').textContent = e.target.value;
    }

    updateQualityValue(e) {
        document.getElementById('qualityValue').textContent = e.target.value + '%';
    }

    setupCanvas() {
        this.canvas = document.getElementById('editorCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleCanvasMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleCanvasWheel(e));
    }

    editImage(imageId) {
        const imageData = this.images.find(img => img.id == imageId);
        if (!imageData) return;

        this.currentImage = imageData;
        this.loadImageToCanvas(imageData);
        document.getElementById('editorSection').style.display = 'block';
    }

    loadImageToCanvas(imageData) {
        const canvas = this.canvas;
        const ctx = this.ctx;
        
        // Calculate canvas size
        const maxWidth = 800;
        const maxHeight = 600;
        const aspectRatio = imageData.width / imageData.height;
        
        let canvasWidth = imageData.width;
        let canvasHeight = imageData.height;
        
        if (canvasWidth > maxWidth) {
            canvasWidth = maxWidth;
            canvasHeight = canvasWidth / aspectRatio;
        }
        
        if (canvasHeight > maxHeight) {
            canvasHeight = maxHeight;
            canvasWidth = canvasHeight * aspectRatio;
        }
        
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // Draw image
        ctx.drawImage(imageData.img, 0, 0, canvasWidth, canvasHeight);
    }

    setTool(tool) {
        // Update tool button state
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(tool + 'Tool').classList.add('active');
        
        // Update canvas cursor
        switch (tool) {
            case 'select':
                this.canvas.style.cursor = 'crosshair';
                break;
            case 'zoom':
                this.canvas.style.cursor = 'zoom-in';
                break;
            case 'pan':
                this.canvas.style.cursor = 'grab';
                break;
        }
    }

    handleCanvasMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.selectionStart = { x, y };
        this.isSelecting = true;
    }

    handleCanvasMouseMove(e) {
        if (!this.isSelecting) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.selectionEnd = { x, y };
        this.drawSelection();
    }

    handleCanvasMouseUp(e) {
        if (!this.isSelecting) return;
        
        this.isSelecting = false;
        // Selection complete, can process selected area here
    }

    handleCanvasWheel(e) {
        e.preventDefault();
        // Zoom functionality
        const scale = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoomCanvas(scale);
    }

    zoomCanvas(scale) {
        const canvas = this.canvas;
        const ctx = this.ctx;
        
        // Simple zoom implementation
        ctx.scale(scale, scale);
        this.loadImageToCanvas(this.currentImage);
    }

    drawSelection() {
        if (!this.selectionStart || !this.selectionEnd) return;
        
        const overlay = document.getElementById('selectionOverlay');
        const rect = this.canvas.getBoundingClientRect();
        
        const x = Math.min(this.selectionStart.x, this.selectionEnd.x);
        const y = Math.min(this.selectionStart.y, this.selectionEnd.y);
        const width = Math.abs(this.selectionEnd.x - this.selectionStart.x);
        const height = Math.abs(this.selectionEnd.y - this.selectionStart.y);
        
        overlay.style.left = (rect.left + x) + 'px';
        overlay.style.top = (rect.top + y) + 'px';
        overlay.style.width = width + 'px';
        overlay.style.height = height + 'px';
        overlay.style.display = 'block';
    }

    resetView() {
        if (this.currentImage) {
            this.loadImageToCanvas(this.currentImage);
        }
    }

    confirmSelection() {
        // Confirm selection area, start watermark removal processing
        if (this.selectionStart && this.selectionEnd) {
            this.processSelectedArea();
        }
    }

    cancelSelection() {
        this.selectionStart = null;
        this.selectionEnd = null;
        document.getElementById('selectionOverlay').style.display = 'none';
    }

    processSelectedArea() {
        // Process watermark removal for selected area
        if (!this.currentImage) return;
        
        const canvas = this.canvas;
        const ctx = this.ctx;
        
        // Get selection area
        const x = Math.min(this.selectionStart.x, this.selectionEnd.x);
        const y = Math.min(this.selectionStart.y, this.selectionEnd.y);
        const width = Math.abs(this.selectionEnd.x - this.selectionStart.x);
        const height = Math.abs(this.selectionEnd.y - this.selectionStart.y);
        
        // Apply repair algorithm
        this.applyInpainting(ctx, x, y, width, height);
        
        // Hide selection box
        this.cancelSelection();
    }

    applyInpainting(ctx, x, y, width, height) {
        // Simple repair algorithm: use average of surrounding pixels
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        const data = imageData.data;
        
        // Get pixels around selection area
        const padding = 10;
        const sampleX = Math.max(0, x - padding);
        const sampleY = Math.max(0, y - padding);
        const sampleWidth = Math.min(ctx.canvas.width - sampleX, width + 2 * padding);
        const sampleHeight = Math.min(ctx.canvas.height - sampleY, height + 2 * padding);
        
        // Calculate average color of surrounding pixels
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let py = sampleY; py < sampleY + sampleHeight; py++) {
            for (let px = sampleX; px < sampleX + sampleWidth; px++) {
                if (px < x || px >= x + width || py < y || py >= y + height) {
                    const index = (py * ctx.canvas.width + px) * 4;
                    r += data[index];
                    g += data[index + 1];
                    b += data[index + 2];
                    count++;
                }
            }
        }
        
        if (count > 0) {
            r = Math.round(r / count);
            g = Math.round(g / count);
            b = Math.round(b / count);
            
            // Fill selection area
            for (let py = y; py < y + height; py++) {
                for (let px = x; px < x + width; px++) {
                    const index = (py * ctx.canvas.width + px) * 4;
                    data[index] = r;
                    data[index + 1] = g;
                    data[index + 2] = b;
                    // data[index + 3] keep original transparency
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    async removeWatermarkFromSingle(imageId) {
        const imageData = this.images.find(img => img.id == imageId);
        if (!imageData) return;

        const processedImage = await this.removeWatermark(imageData);
        if (processedImage) {
            this.processedImages.push(processedImage);
            this.displayResults();
        }
    }

    async removeWatermarkFromAll() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.processedImages = [];
        this.showProgress();
        
        const totalImages = this.images.length;
        let completed = 0;

        for (let i = 0; i < totalImages; i++) {
            const imageData = this.images[i];
            this.updateProgress(completed, totalImages, `Processing: ${imageData.name}`);
            
            try {
                const processedImage = await this.removeWatermark(imageData);
                if (processedImage) {
                    this.processedImages.push(processedImage);
                }
                completed++;
            } catch (error) {
                console.error('Failed to remove watermark:', error);
                completed++;
            }
        }

        this.updateProgress(totalImages, totalImages, 'Processing complete');
        this.isProcessing = false;
        this.displayResults();
    }

    async removeWatermark(imageData) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = imageData.width;
            canvas.height = imageData.height;
            
            // Draw original image
            ctx.drawImage(imageData.img, 0, 0);
            
            // Get watermark removal settings
            const settings = this.getRemovalSettings();
            
            // Apply watermark removal algorithm
            this.applyWatermarkRemoval(ctx, settings, canvas.width, canvas.height);
            
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
            const fileName = `${originalName}_no_watermark.${fileExtension}`;
            
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

    getRemovalSettings() {
        const removalMethod = document.querySelector('input[name="removalMethod"]:checked').value;
        const aiIntensity = parseInt(document.getElementById('aiIntensitySlider').value);
        const watermarkType = document.getElementById('watermarkType').value;
        const repairAlgorithm = document.getElementById('repairAlgorithm').value;
        const sensitivity = parseInt(document.getElementById('sensitivitySlider').value);
        const detectCorners = document.getElementById('detectCorners').checked;
        const detectCenter = document.getElementById('detectCenter').checked;
        const detectEdges = document.getElementById('detectEdges').checked;
        const preserveQuality = document.getElementById('preserveQuality').checked;
        const enhanceDetails = document.getElementById('enhanceDetails').checked;
        const smoothEdges = document.getElementById('smoothEdges').checked;
        const colorMatch = document.getElementById('colorMatch').checked;
        const outputFormat = document.getElementById('outputFormat').value;
        const quality = parseInt(document.getElementById('qualitySlider').value);
        
        return {
            removalMethod,
            aiIntensity,
            watermarkType,
            repairAlgorithm,
            sensitivity,
            detectCorners,
            detectCenter,
            detectEdges,
            preserveQuality,
            enhanceDetails,
            smoothEdges,
            colorMatch,
            outputFormat,
            quality
        };
    }

    applyWatermarkRemoval(ctx, settings, canvasWidth, canvasHeight) {
        const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
        const data = imageData.data;
        
        // Pre-processing: noise reduction and edge enhancement
        this.preprocessImage(data, canvasWidth, canvasHeight);
        
        // Apply different algorithms based on different removal methods
        switch (settings.removalMethod) {
            case 'ai':
                this.applyAIWatermarkRemoval(data, settings, canvasWidth, canvasHeight);
                break;
            case 'manual':
                // Manual selection area processing is done in the editor
                break;
            case 'auto':
                this.applyAutoWatermarkRemoval(data, settings, canvasWidth, canvasHeight);
                break;
        }
        
        // Apply post-processing effects
        if (settings.enhanceDetails) {
            this.enhanceDetails(data, canvasWidth, canvasHeight);
        }
        
        if (settings.smoothEdges) {
            this.smoothEdges(data, canvasWidth, canvasHeight);
        }
        
        if (settings.colorMatch) {
            this.colorMatch(data, canvasWidth, canvasHeight);
        }
        
        // Final processing: edge preservation and noise suppression
        this.postprocessImage(data, canvasWidth, canvasHeight);
        
        ctx.putImageData(imageData, 0, 0);
    }

    applyAIWatermarkRemoval(data, settings, width, height) {
        // AI smart watermark removal algorithm
        const intensity = settings.aiIntensity / 10;
        
        // Advanced watermark detection
        const watermarkRegions = this.detectWatermarkRegionsAdvanced(data, width, height, settings);
        
        // Multiple passes for better results
        for (let pass = 0; pass < 3; pass++) {
            watermarkRegions.forEach(region => {
                this.repairRegionAdvanced(data, width, height, region, intensity, pass);
            });
        }
    }

    applyAutoWatermarkRemoval(data, settings, width, height) {
        // Auto detect watermark algorithm
        const sensitivity = settings.sensitivity / 10;
        
        // Smart watermark detection
        const watermarkRegions = this.detectWatermarkRegionsAdvanced(data, width, height, settings);
        
        // Repair watermark area
        watermarkRegions.forEach(region => {
            this.repairRegionAdvanced(data, width, height, region, sensitivity, 0);
        });
    }

    detectWatermarkRegions(data, width, height, settings) {
        const regions = [];
        
        // Simplified watermark detection algorithm
        // Detect corner areas
        if (settings.detectCorners) {
            regions.push({ x: 0, y: 0, width: width * 0.3, height: height * 0.3 });
            regions.push({ x: width * 0.7, y: 0, width: width * 0.3, height: height * 0.3 });
            regions.push({ x: 0, y: height * 0.7, width: width * 0.3, height: height * 0.3 });
            regions.push({ x: width * 0.7, y: height * 0.7, width: width * 0.3, height: height * 0.3 });
        }
        
        // Detect center area
        if (settings.detectCenter) {
            regions.push({ 
                x: width * 0.25, 
                y: height * 0.25, 
                width: width * 0.5, 
                height: height * 0.5 
            });
        }
        
        // Detect edge areas
        if (settings.detectEdges) {
            regions.push({ x: 0, y: 0, width: width, height: height * 0.1 });
            regions.push({ x: 0, y: height * 0.9, width: width, height: height * 0.1 });
            regions.push({ x: 0, y: 0, width: width * 0.1, height: height });
            regions.push({ x: width * 0.9, y: 0, width: width * 0.1, height: height });
        }
        
        return regions;
    }

    repairRegion(data, width, height, region, intensity) {
        // Repair specified area
        const padding = Math.max(10, Math.min(region.width, region.height) * 0.1);
        
        for (let y = region.y; y < region.y + region.height; y++) {
            for (let x = region.x; x < region.x + region.width; x++) {
                if (x >= 0 && x < width && y >= 0 && y < height) {
                    const index = (y * width + x) * 4;
                    
                    // Get average of surrounding pixels
                    const avgColor = this.getAverageColor(data, width, height, x, y, padding);
                    
                    // Apply repair
                    data[index] = Math.round(data[index] * (1 - intensity) + avgColor.r * intensity);
                    data[index + 1] = Math.round(data[index + 1] * (1 - intensity) + avgColor.g * intensity);
                    data[index + 2] = Math.round(data[index + 2] * (1 - intensity) + avgColor.b * intensity);
                }
            }
        }
    }

    getAverageColor(data, width, height, centerX, centerY, radius) {
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let y = Math.max(0, centerY - radius); y < Math.min(height, centerY + radius); y++) {
            for (let x = Math.max(0, centerX - radius); x < Math.min(width, centerX + radius); x++) {
                const index = (y * width + x) * 4;
                r += data[index];
                g += data[index + 1];
                b += data[index + 2];
                count++;
            }
        }
        
        return {
            r: count > 0 ? Math.round(r / count) : 128,
            g: count > 0 ? Math.round(g / count) : 128,
            b: count > 0 ? Math.round(b / count) : 128
        };
    }

    enhanceDetails(data, width, height) {
        // Adaptive detail enhancement algorithm
        const tempData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const index = (y * width + x) * 4;
                
                // Calculate local contrast
                const localContrast = this.calculateLocalContrast(tempData, width, height, x, y);
                
                // Adjust enhancement strength based on contrast
                const enhanceStrength = Math.min(0.3, localContrast * 0.5);
                
                if (enhanceStrength > 0.05) {
                    // Laplacian operator enhancement
                    const laplacian = this.applyLaplacian(tempData, width, height, x, y);
                    
                    data[index] = Math.max(0, Math.min(255, data[index] + laplacian.r * enhanceStrength));
                    data[index + 1] = Math.max(0, Math.min(255, data[index + 1] + laplacian.g * enhanceStrength));
                    data[index + 2] = Math.max(0, Math.min(255, data[index + 2] + laplacian.b * enhanceStrength));
                }
            }
        }
    }

    calculateLocalContrast(data, width, height, x, y) {
        const radius = 3;
        let min = 255, max = 0;
        
        for (let py = Math.max(0, y - radius); py < Math.min(height, y + radius + 1); py++) {
            for (let px = Math.max(0, x - radius); px < Math.min(width, x + radius + 1); px++) {
                const index = (py * width + px) * 4;
                const gray = (data[index] + data[index + 1] + data[index + 2]) / 3;
                min = Math.min(min, gray);
                max = Math.max(max, gray);
            }
        }
        
        return (max - min) / 255;
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

    smoothEdges(data, width, height) {
        // Edge-preserving smoothing algorithm
        const tempData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const index = (y * width + x) * 4;
                
                // Calculate edge strength
                const edgeStrength = this.calculateEdgeStrength(tempData, width, height, x, y);
                
                // Adjust smoothing level based on edge strength
                const smoothFactor = Math.max(0.1, 1.0 - edgeStrength * 2);
                
                if (smoothFactor > 0.3) {
                    // Low edge strength, apply smoothing
                    const blurred = this.applyGaussianBlur(tempData, width, height, x, y, smoothFactor);
                    
                    data[index] = Math.round(data[index] * (1 - smoothFactor) + blurred.r * smoothFactor);
                    data[index + 1] = Math.round(data[index + 1] * (1 - smoothFactor) + blurred.g * smoothFactor);
                    data[index + 2] = Math.round(data[index + 2] * (1 - smoothFactor) + blurred.b * smoothFactor);
                }
            }
        }
    }

    applyGaussianBlur(data, width, height, x, y, intensity = 1.0) {
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
                    const weight = kernel[ky][kx] * intensity;
                    
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

    colorMatch(data, width, height) {
        // Advanced color matching algorithm
        // Calculate overall color statistics
        const colorStats = this.calculateColorStatistics(data, width, height);
        
        // Apply color correction
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // White balance correction
            const correctedR = Math.min(255, Math.max(0, r * colorStats.whiteBalance.r));
            const correctedG = Math.min(255, Math.max(0, g * colorStats.whiteBalance.g));
            const correctedB = Math.min(255, Math.max(0, b * colorStats.whiteBalance.b));
            
            // Contrast enhancement
            const contrast = 1.1;
            const brightness = 0;
            
            data[i] = Math.min(255, Math.max(0, (correctedR - 128) * contrast + 128 + brightness));
            data[i + 1] = Math.min(255, Math.max(0, (correctedG - 128) * contrast + 128 + brightness));
            data[i + 2] = Math.min(255, Math.max(0, (correctedB - 128) * contrast + 128 + brightness));
        }
    }

    calculateColorStatistics(data, width, height) {
        let rSum = 0, gSum = 0, bSum = 0;
        let rMax = 0, gMax = 0, bMax = 0;
        let rMin = 255, gMin = 255, bMin = 255;
        let count = 0;
        
        // Sampling calculation (sample every 10 pixels for better performance)
        for (let i = 0; i < data.length; i += 40) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            rSum += r;
            gSum += g;
            bSum += b;
            
            rMax = Math.max(rMax, r);
            gMax = Math.max(gMax, g);
            bMax = Math.max(bMax, b);
            
            rMin = Math.min(rMin, r);
            gMin = Math.min(gMin, g);
            bMin = Math.min(bMin, b);
            
            count++;
        }
        
        const rAvg = rSum / count;
        const gAvg = gSum / count;
        const bAvg = bSum / count;
        
        // Calculate white balance coefficient
        const maxAvg = Math.max(rAvg, gAvg, bAvg);
        
        return {
            whiteBalance: {
                r: maxAvg / rAvg,
                g: maxAvg / gAvg,
                b: maxAvg / bAvg
            },
            average: { r: rAvg, g: gAvg, b: bAvg },
            range: {
                r: { min: rMin, max: rMax },
                g: { min: gMin, max: gMax },
                b: { min: bMin, max: bMax }
            }
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
                    <button class="btn btn-success" onclick="watermarkRemover.downloadSingleImage('${imageData.name}')">Download</button>
                </div>
            `;
            resultsGrid.appendChild(resultItem);
        });

        document.getElementById('resultsSection').style.display = 'block';
    }

    async previewRemoval() {
        if (this.images.length === 0) {
            alert('Please select images first');
            return;
        }

        const firstImage = this.images[0];
        const processedImage = await this.removeWatermark(firstImage);
        
        if (processedImage) {
            // Create preview window
            const previewWindow = window.open('', '_blank', 'width=1000,height=600');
            previewWindow.document.write(`
                <html>
                    <head>
                        <title>Watermark Removal Preview</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
                            .preview-container { display: flex; gap: 20px; justify-content: center; }
                            .preview-item { text-align: center; }
                            .preview-item h3 { margin-bottom: 10px; }
                            .preview-item img { max-width: 400px; max-height: 400px; border: 1px solid #ddd; }
                        </style>
                    </head>
                    <body>
                        <h2>Watermark Removal Preview</h2>
                        <div class="preview-container">
                            <div class="preview-item">
                                <h3>Original</h3>
                                <img src="${firstImage.dataUrl}" alt="Original" />
                            </div>
                            <div class="preview-item">
                                <h3>After Removal</h3>
                                <img src="${processedImage.dataUrl}" alt="After Removal" />
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
        // Here is an alternative: download files one by one
        alert('Due to browser limitations, images will be downloaded one by one');
        this.downloadAllImages();
    }

    clearAll() {
        this.images = [];
        this.processedImages = [];
        this.currentImage = null;
        this.selectionStart = null;
        this.selectionEnd = null;
        this.isSelecting = false;
        this.displayImages();
        this.hideSettings();
        document.getElementById('fileInput').value = '';
        document.getElementById('selectionOverlay').style.display = 'none';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // New pre-processing methods
    preprocessImage(data, width, height) {
        // Light noise reduction
        const tempData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const index = (y * width + x) * 4;
                
                // Light Gaussian blur for noise reduction
                const blurred = this.applyGaussianBlur(tempData, width, height, x, y, 0.3);
                
                data[index] = Math.round(data[index] * 0.9 + blurred.r * 0.1);
                data[index + 1] = Math.round(data[index + 1] * 0.9 + blurred.g * 0.1);
                data[index + 2] = Math.round(data[index + 2] * 0.9 + blurred.b * 0.1);
            }
        }
    }

    // New post-processing methods
    postprocessImage(data, width, height) {
        // Edge-preserving smoothing
        const tempData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const index = (y * width + x) * 4;
                
                // Edge detection
                const edgeStrength = this.calculateEdgeStrength(tempData, width, height, x, y);
                
                if (edgeStrength < 0.3) {
                    // Apply light smoothing to non-edge areas
                    const smoothed = this.applyGaussianBlur(tempData, width, height, x, y, 0.2);
                    
                    data[index] = Math.round(data[index] * 0.8 + smoothed.r * 0.2);
                    data[index + 1] = Math.round(data[index + 1] * 0.8 + smoothed.g * 0.2);
                    data[index + 2] = Math.round(data[index + 2] * 0.8 + smoothed.b * 0.2);
                }
            }
        }
    }

    // Advanced watermark detection algorithm
    detectWatermarkRegionsAdvanced(data, width, height, settings) {
        const regions = [];
        
        // Use edge detection and texture analysis
        const edgeMap = this.createEdgeMap(data, width, height);
        const textureMap = this.createTextureMap(data, width, height);
        
        // Detect corner areas
        if (settings.detectCorners) {
            const cornerRegions = this.detectCornerWatermarks(edgeMap, textureMap, width, height);
            regions.push(...cornerRegions);
        }
        
        // Detect center area
        if (settings.detectCenter) {
            const centerRegions = this.detectCenterWatermarks(edgeMap, textureMap, width, height);
            regions.push(...centerRegions);
        }
        
        // Detect edge areas
        if (settings.detectEdges) {
            const edgeRegions = this.detectEdgeWatermarks(edgeMap, textureMap, width, height);
            regions.push(...edgeRegions);
        }
        
        return regions;
    }

    // Create edge map
    createEdgeMap(data, width, height) {
        const edgeMap = new Array(width * height).fill(0);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const index = (y * width + x) * 4;
                
                // Sobel operator edge detection
                const gx = this.calculateGradientX(data, width, height, x, y);
                const gy = this.calculateGradientY(data, width, height, x, y);
                const magnitude = Math.sqrt(gx * gx + gy * gy);
                
                edgeMap[y * width + x] = magnitude;
            }
        }
        
        return edgeMap;
    }

    // Create texture map
    createTextureMap(data, width, height) {
        const textureMap = new Array(width * height).fill(0);
        
        for (let y = 2; y < height - 2; y++) {
            for (let x = 2; x < width - 2; x++) {
                const index = (y * width + x) * 4;
                
                // Calculate local variance as texture strength
                const variance = this.calculateLocalVariance(data, width, height, x, y, 3);
                textureMap[y * width + x] = variance;
            }
        }
        
        return textureMap;
    }

    // Advanced repair algorithm
    repairRegionAdvanced(data, width, height, region, intensity, pass) {
        const padding = Math.max(15, Math.min(region.width, region.height) * 0.15);
        
        for (let y = region.y; y < region.y + region.height; y++) {
            for (let x = region.x; x < region.x + region.width; x++) {
                if (x >= 0 && x < width && y >= 0 && y < height) {
                    const index = (y * width + x) * 4;
                    
                    // Multi-scale repair
                    const scale = 3 + pass * 2;
                    const avgColor = this.getAverageColorAdvanced(data, width, height, x, y, padding, scale);
                    
                    // Adaptive intensity
                    const adaptiveIntensity = intensity * (1 + pass * 0.2);
                    
                    // Apply repair
                    data[index] = Math.round(data[index] * (1 - adaptiveIntensity) + avgColor.r * adaptiveIntensity);
                    data[index + 1] = Math.round(data[index + 1] * (1 - adaptiveIntensity) + avgColor.g * adaptiveIntensity);
                    data[index + 2] = Math.round(data[index + 2] * (1 - adaptiveIntensity) + avgColor.b * adaptiveIntensity);
                }
            }
        }
    }

    // Advanced average color calculation
    getAverageColorAdvanced(data, width, height, centerX, centerY, radius, scale) {
        let r = 0, g = 0, b = 0, count = 0;
        const weights = [];
        
        // Calculate weights
        for (let y = Math.max(0, centerY - radius); y < Math.min(height, centerY + radius); y++) {
            for (let x = Math.max(0, centerX - radius); x < Math.min(width, centerX + radius); x++) {
                const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                const weight = Math.exp(-distance / scale);
                weights.push({ x, y, weight });
            }
        }
        
        // Weighted average
        weights.forEach(({ x, y, weight }) => {
            const index = (y * width + x) * 4;
            r += data[index] * weight;
            g += data[index + 1] * weight;
            b += data[index + 2] * weight;
            count += weight;
        });
        
        return {
            r: count > 0 ? Math.round(r / count) : 128,
            g: count > 0 ? Math.round(g / count) : 128,
            b: count > 0 ? Math.round(b / count) : 128
        };
    }

    // Helper methods
    calculateEdgeStrength(data, width, height, x, y) {
        const gx = this.calculateGradientX(data, width, height, x, y);
        const gy = this.calculateGradientY(data, width, height, x, y);
        return Math.sqrt(gx * gx + gy * gy) / 255;
    }

    calculateGradientX(data, width, height, x, y) {
        const kernel = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
        let sum = 0;
        
        for (let ky = 0; ky < 3; ky++) {
            for (let kx = 0; kx < 3; kx++) {
                const px = x + kx - 1;
                const py = y + ky - 1;
                
                if (px >= 0 && px < width && py >= 0 && py < height) {
                    const index = (py * width + px) * 4;
                    const gray = (data[index] + data[index + 1] + data[index + 2]) / 3;
                    sum += gray * kernel[ky * 3 + kx];
                }
            }
        }
        
        return sum;
    }

    calculateGradientY(data, width, height, x, y) {
        const kernel = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
        let sum = 0;
        
        for (let ky = 0; ky < 3; ky++) {
            for (let kx = 0; kx < 3; kx++) {
                const px = x + kx - 1;
                const py = y + ky - 1;
                
                if (px >= 0 && px < width && py >= 0 && py < height) {
                    const index = (py * width + px) * 4;
                    const gray = (data[index] + data[index + 1] + data[index + 2]) / 3;
                    sum += gray * kernel[ky * 3 + kx];
                }
            }
        }
        
        return sum;
    }

    calculateLocalVariance(data, width, height, x, y, radius) {
        let sum = 0, sumSq = 0, count = 0;
        
        for (let py = y - radius; py <= y + radius; py++) {
            for (let px = x - radius; px <= x + radius; px++) {
                if (px >= 0 && px < width && py >= 0 && py < height) {
                    const index = (py * width + px) * 4;
                    const gray = (data[index] + data[index + 1] + data[index + 2]) / 3;
                    sum += gray;
                    sumSq += gray * gray;
                    count++;
                }
            }
        }
        
        const mean = sum / count;
        return (sumSq / count) - (mean * mean);
    }

    detectCornerWatermarks(edgeMap, textureMap, width, height) {
        const regions = [];
        const cornerSize = Math.min(width, height) * 0.25;
        
        // Four corners
        const corners = [
            { x: 0, y: 0 },
            { x: width - cornerSize, y: 0 },
            { x: 0, y: height - cornerSize },
            { x: width - cornerSize, y: height - cornerSize }
        ];
        
        corners.forEach(corner => {
            const edgeStrength = this.calculateRegionEdgeStrength(edgeMap, width, height, corner.x, corner.y, cornerSize, cornerSize);
            const textureStrength = this.calculateRegionTextureStrength(textureMap, width, height, corner.x, corner.y, cornerSize, cornerSize);
            
            if (edgeStrength > 0.3 || textureStrength > 0.4) {
                regions.push({
                    x: corner.x,
                    y: corner.y,
                    width: cornerSize,
                    height: cornerSize,
                    confidence: (edgeStrength + textureStrength) / 2
                });
            }
        });
        
        return regions;
    }

    detectCenterWatermarks(edgeMap, textureMap, width, height) {
        const regions = [];
        const centerSize = Math.min(width, height) * 0.4;
        const centerX = (width - centerSize) / 2;
        const centerY = (height - centerSize) / 2;
        
        const edgeStrength = this.calculateRegionEdgeStrength(edgeMap, width, height, centerX, centerY, centerSize, centerSize);
        const textureStrength = this.calculateRegionTextureStrength(textureMap, width, height, centerX, centerY, centerSize, centerSize);
        
        if (edgeStrength > 0.2 || textureStrength > 0.3) {
            regions.push({
                x: centerX,
                y: centerY,
                width: centerSize,
                height: centerSize,
                confidence: (edgeStrength + textureStrength) / 2
            });
        }
        
        return regions;
    }

    detectEdgeWatermarks(edgeMap, textureMap, width, height) {
        const regions = [];
        const edgeThickness = Math.min(width, height) * 0.05;
        
        // Top and bottom edges
        for (let x = 0; x < width; x += width * 0.1) {
            const edgeStrength = this.calculateRegionEdgeStrength(edgeMap, width, height, x, 0, width * 0.1, edgeThickness);
            if (edgeStrength > 0.4) {
                regions.push({
                    x: x,
                    y: 0,
                    width: width * 0.1,
                    height: edgeThickness,
                    confidence: edgeStrength
                });
            }
        }
        
        // Left and right edges
        for (let y = 0; y < height; y += height * 0.1) {
            const edgeStrength = this.calculateRegionEdgeStrength(edgeMap, width, height, 0, y, edgeThickness, height * 0.1);
            if (edgeStrength > 0.4) {
                regions.push({
                    x: 0,
                    y: y,
                    width: edgeThickness,
                    height: height * 0.1,
                    confidence: edgeStrength
                });
            }
        }
        
        return regions;
    }

    calculateRegionEdgeStrength(edgeMap, width, height, x, y, w, h) {
        let sum = 0, count = 0;
        
        for (let py = y; py < y + h && py < height; py++) {
            for (let px = x; px < x + w && px < width; px++) {
                sum += edgeMap[py * width + px];
                count++;
            }
        }
        
        return count > 0 ? sum / count / 255 : 0;
    }

    calculateRegionTextureStrength(textureMap, width, height, x, y, w, h) {
        let sum = 0, count = 0;
        
        for (let py = y; py < y + h && py < height; py++) {
            for (let px = x; px < x + w && px < width; px++) {
                sum += textureMap[py * width + px];
                count++;
            }
        }
        
        return count > 0 ? sum / count / 10000 : 0;
    }
}

// Initialize application
let watermarkRemover;
document.addEventListener('DOMContentLoaded', () => {
    watermarkRemover = new WatermarkRemover();
});
