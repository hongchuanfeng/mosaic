class BlackWhiteColorizer {
    constructor() {
        this.images = [];
        this.colorizedImages = [];
        this.isProcessing = false;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupPresetButtons();
        this.setupModeToggle();
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
        document.getElementById('intensitySlider').addEventListener('input', (e) => this.updateIntensityValue(e));
        document.getElementById('skinIntensity').addEventListener('input', (e) => this.updateSkinIntensityValue(e));
        document.getElementById('skyIntensity').addEventListener('input', (e) => this.updateSkyIntensityValue(e));
        document.getElementById('plantIntensity').addEventListener('input', (e) => this.updatePlantIntensityValue(e));
        document.getElementById('buildingIntensity').addEventListener('input', (e) => this.updateBuildingIntensityValue(e));
        document.getElementById('qualitySlider').addEventListener('input', (e) => this.updateQualityValue(e));
        
        // Button events
        document.getElementById('colorizeBtn').addEventListener('click', () => this.colorizeAllImages());
        document.getElementById('previewBtn').addEventListener('click', () => this.previewColorization());
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
                    <button class="btn btn-primary" onclick="blackWhiteColorizer.colorizeSingleImage('${imageData.id}')">Colorize</button>
                    <button class="btn btn-outline" onclick="blackWhiteColorizer.removeImage('${imageData.id}')">Remove</button>
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
        // Intensity preset buttons
        document.querySelectorAll('.intensity-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setIntensityPreset(e));
        });
    }

    setupModeToggle() {
        // Colorization mode toggle
        document.querySelectorAll('input[name="colorizationMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handleModeChange(e));
        });
    }

    handleModeChange(e) {
        const manualGroup = document.getElementById('manualColorGroup');
        
        if (e.target.value === 'manual') {
            manualGroup.style.display = 'block';
        } else {
            manualGroup.style.display = 'none';
        }
    }

    setIntensityPreset(e) {
        const value = parseInt(e.target.dataset.value);
        const slider = document.getElementById('intensitySlider');
        const valueDisplay = document.getElementById('intensityValue');
        
        slider.value = value;
        valueDisplay.textContent = value;
        
        // Update button state
        document.querySelectorAll('.intensity-preset-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
    }

    updateIntensityValue(e) {
        document.getElementById('intensityValue').textContent = e.target.value;
    }

    updateSkinIntensityValue(e) {
        document.getElementById('skinIntensityValue').textContent = e.target.value + '%';
    }

    updateSkyIntensityValue(e) {
        document.getElementById('skyIntensityValue').textContent = e.target.value + '%';
    }

    updatePlantIntensityValue(e) {
        document.getElementById('plantIntensityValue').textContent = e.target.value + '%';
    }

    updateBuildingIntensityValue(e) {
        document.getElementById('buildingIntensityValue').textContent = e.target.value + '%';
    }

    updateQualityValue(e) {
        document.getElementById('qualityValue').textContent = e.target.value + '%';
    }

    async colorizeSingleImage(imageId) {
        const imageData = this.images.find(img => img.id == imageId);
        if (!imageData) return;

        try {
            const colorizedImage = await this.colorizeImage(imageData);
            if (colorizedImage) {
                this.colorizedImages.push(colorizedImage);
                this.displayResults();
                alert('Colorization successful!');
            }
        } catch (error) {
            console.error('Single image colorization failed:', error);
            alert('Colorization failed, please check image format and settings');
        }
    }

    async colorizeAllImages() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.colorizedImages = [];
        this.showProgress();
        
        const totalImages = this.images.length;
        let completed = 0;
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < totalImages; i++) {
            const imageData = this.images[i];
            this.updateProgress(completed, totalImages, `Colorizing: ${imageData.name}`);
            
            try {
                const colorizedImage = await this.colorizeImage(imageData);
                if (colorizedImage) {
                    this.colorizedImages.push(colorizedImage);
                    successCount++;
                }
                completed++;
            } catch (error) {
                console.error('Photo colorization failed:', error);
                errorCount++;
                completed++;
            }
        }

        // Display processing results
        let resultMessage = `Colorization completed! Success: ${successCount} image(s)`;
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
        //     alert('Colorization failed, please check image format and settings');
        // }
    }

    async colorizeImage(imageData) {
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
                
                // Get colorization settings
                const settings = this.getColorizationSettings();
                
                // Apply colorization algorithm
                this.applyColorization(ctx, settings, canvas.width, canvas.height);
                
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
                
                if (!dataUrl || dataUrl === 'data:,') {
                    reject(new Error('Unable to generate colorized image'));
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
                const fileName = `${originalName}_colorized.${fileExtension}`;
                
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
                console.error('Colorization processing error:', error);
                reject(error);
            }
        });
    }

    applyColorization(ctx, settings, width, height) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        console.log('Starting colorization processing:', {
            width,
            height,
            mode: settings.colorizationMode,
            intensity: settings.intensity,
            style: settings.colorStyle
        });
        
        // Preprocessing: detect if image is black and white
        const isBW = this.isBlackAndWhiteImage(data);
        console.log('Image type detection:', isBW ? 'Black and white image' : 'Color image');
        
        if (!isBW) {
            // If not black and white, convert to black and white first
            this.convertToBlackAndWhite(data);
            console.log('Converted to black and white image');
        }
        
        // Apply different algorithms based on colorization mode
        switch (settings.colorizationMode) {
            case 'auto':
                console.log('Applying intelligent colorization algorithm');
                this.applyAutoColorization(data, settings, width, height);
                break;
            case 'manual':
                console.log('Applying manual colorization algorithm');
                this.applyManualColorization(data, settings, width, height);
                break;
            case 'style':
                console.log('Applying style colorization algorithm');
                this.applyStyleColorization(data, settings, width, height);
                break;
        }
        
        // Apply post-processing effects
        if (settings.preserveContrast) {
            console.log('Applying contrast preservation');
            this.preserveContrast(data, width, height);
        }
        
        if (settings.enhanceDetails) {
            console.log('Applying detail enhancement');
            this.enhanceDetails(data, width, height);
        }
        
        if (settings.smoothTransitions) {
            console.log('Applying smooth transitions');
            this.smoothTransitions(data, width, height);
        }
        
        if (settings.colorHarmony) {
            console.log('Applying color harmony');
            this.applyColorHarmony(data, width, height);
        }
        
        ctx.putImageData(imageData, 0, 0);
        console.log('Colorization processing completed');
    }

    isBlackAndWhiteImage(data) {
        // Detect if image is black and white
        let colorVariation = 0;
        const sampleSize = Math.min(1000, data.length / 4);
        
        for (let i = 0; i < sampleSize; i++) {
            const index = i * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            
            // Calculate difference between RGB channels
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            colorVariation += (max - min);
        }
        
        const avgVariation = colorVariation / sampleSize;
        return avgVariation < 30; // If average color difference is less than 30, consider it a black and white image
    }

    convertToBlackAndWhite(data) {
        // Convert color image to black and white
        for (let i = 0; i < data.length; i += 4) {
            const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
            data[i] = gray;     // R
            data[i + 1] = gray; // G
            data[i + 2] = gray; // B
            // data[i + 3] keep transparency unchanged
        }
    }

    applyAutoColorization(data, settings, width, height) {
        const intensity = settings.intensity / 10;
        
        for (let i = 0; i < data.length; i += 4) {
            const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
            
            // Intelligent color assignment
            const color = this.getSmartColor(gray, settings);
            
            // Use more natural color blending algorithm
            const newColor = this.blendColors(gray, color, intensity);
            
            // Apply color
            data[i] = Math.round(newColor.r);
            data[i + 1] = Math.round(newColor.g);
            data[i + 2] = Math.round(newColor.b);
        }
    }

    applyManualColorization(data, settings, width, height) {
        const intensity = settings.intensity / 10;
        
        for (let i = 0; i < data.length; i += 4) {
            const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const x = (i / 4) % width;
            const y = Math.floor((i / 4) / width);
            
            // Select color based on position and grayscale value
            const color = this.getManualColor(gray, x, y, width, height, settings);
            
            // Use more natural color blending algorithm
            const newColor = this.blendColors(gray, color, intensity);
            
            // Apply color
            data[i] = Math.round(newColor.r);
            data[i + 1] = Math.round(newColor.g);
            data[i + 2] = Math.round(newColor.b);
        }
    }

    applyStyleColorization(data, settings, width, height) {
        const intensity = settings.intensity / 10;
        
        for (let i = 0; i < data.length; i += 4) {
            const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
            
            // Select color based on style
            const color = this.getStyleColor(gray, settings.colorStyle);
            
            // Use more natural color blending algorithm
            const newColor = this.blendColors(gray, color, intensity);
            
            // Apply color
            data[i] = Math.round(newColor.r);
            data[i + 1] = Math.round(newColor.g);
            data[i + 2] = Math.round(newColor.b);
        }
    }

    getSmartColor(gray, settings) {
        // Intelligent color assignment algorithm - based on grayscale value probability distribution
        const normalizedGray = gray / 255;
        
        // Use more natural color mapping
        if (normalizedGray < 0.2) {
            // Very dark areas - possibly hair, shadows, dark objects
            return { r: 40, g: 25, b: 15 };
        } else if (normalizedGray < 0.35) {
            // Dark areas - possibly skin, dark clothing, tree trunks, etc.
            if (settings.skinDetection) {
                return { r: 220, g: 180, b: 160 }; // Natural skin tone
            }
            return { r: 120, g: 80, b: 60 };
        } else if (normalizedGray < 0.5) {
            // Medium dark - possibly skin, medium-toned objects
            if (settings.skinDetection) {
                return { r: 240, g: 200, b: 180 }; // Lighter skin tone
            }
            return { r: 160, g: 120, b: 100 };
        } else if (normalizedGray < 0.65) {
            // Medium light - possibly sky, plants, light objects
            return { r: 150, g: 200, b: 240 }; // Sky blue
        } else if (normalizedGray < 0.8) {
            // Light areas - possibly clouds, light buildings, light clothing
            return { r: 200, g: 220, b: 240 }; // Light blue
        } else if (normalizedGray < 0.9) {
            // Very bright areas - possibly highlights, white objects
            return { r: 240, g: 240, b: 250 }; // Near white
        } else {
            // Brightest areas - keep white
            return { r: 255, g: 255, b: 255 };
        }
    }

    getManualColor(gray, x, y, width, height, settings) {
        // Manual color assignment - intelligent analysis based on position and grayscale value
        const centerX = width / 2;
        const centerY = height / 2;
        const distanceFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        const maxDistance = Math.sqrt(centerX ** 2 + centerY ** 2);
        const normalizedDistance = distanceFromCenter / maxDistance;
        const normalizedGray = gray / 255;
        
        // Select color based on position and grayscale value
        if (normalizedGray < 0.3) {
            // Dark areas
            if (normalizedDistance < 0.4 && y > height * 0.2 && y < height * 0.8) {
                // Center area - possibly face
                const skinRgb = this.hexToRgb(settings.skinColor);
                const skinIntensity = parseInt(document.getElementById('skinIntensity').value) / 100;
                return {
                    r: Math.round(skinRgb.r * skinIntensity + gray * (1 - skinIntensity)),
                    g: Math.round(skinRgb.g * skinIntensity + gray * (1 - skinIntensity)),
                    b: Math.round(skinRgb.b * skinIntensity + gray * (1 - skinIntensity))
                };
            } else {
                // Edge areas - possibly hair, clothing
                return { r: 50, g: 30, b: 20 };
            }
        } else if (normalizedGray < 0.6) {
            // Medium tones
            if (y < height * 0.4) {
                // Upper part - possibly sky
                const skyRgb = this.hexToRgb(settings.skyColor);
                const skyIntensity = parseInt(document.getElementById('skyIntensity').value) / 100;
                return {
                    r: Math.round(skyRgb.r * skyIntensity + gray * (1 - skyIntensity)),
                    g: Math.round(skyRgb.g * skyIntensity + gray * (1 - skyIntensity)),
                    b: Math.round(skyRgb.b * skyIntensity + gray * (1 - skyIntensity))
                };
            } else if (y > height * 0.6) {
                // Lower part - possibly ground, buildings
                const buildingRgb = this.hexToRgb(settings.buildingColor);
                const buildingIntensity = parseInt(document.getElementById('buildingIntensity').value) / 100;
                return {
                    r: Math.round(buildingRgb.r * buildingIntensity + gray * (1 - buildingIntensity)),
                    g: Math.round(buildingRgb.g * buildingIntensity + gray * (1 - buildingIntensity)),
                    b: Math.round(buildingRgb.b * buildingIntensity + gray * (1 - buildingIntensity))
                };
            } else {
                // Middle part - possibly plants
                const plantRgb = this.hexToRgb(settings.plantColor);
                const plantIntensity = parseInt(document.getElementById('plantIntensity').value) / 100;
                return {
                    r: Math.round(plantRgb.r * plantIntensity + gray * (1 - plantIntensity)),
                    g: Math.round(plantRgb.g * plantIntensity + gray * (1 - plantIntensity)),
                    b: Math.round(plantRgb.b * plantIntensity + gray * (1 - plantIntensity))
                };
            }
        } else {
            // Light areas - keep near white
            return { r: 255, g: 255, b: 255 };
        }
    }

    getStyleColor(gray, colorStyle) {
        // Return color based on style
        switch (colorStyle) {
            case 'natural':
                return this.getNaturalColor(gray);
            case 'vintage':
                return this.getVintageColor(gray);
            case 'vivid':
                return this.getVividColor(gray);
            case 'warm':
                return this.getWarmColor(gray);
            case 'cool':
                return this.getCoolColor(gray);
            default:
                return this.getNaturalColor(gray);
        }
    }

    getNaturalColor(gray) {
        const normalizedGray = gray / 255;
        if (normalizedGray < 0.2) return { r: 40, g: 25, b: 15 };
        if (normalizedGray < 0.4) return { r: 220, g: 180, b: 160 };
        if (normalizedGray < 0.6) return { r: 150, g: 200, b: 240 };
        if (normalizedGray < 0.8) return { r: 200, g: 220, b: 240 };
        return { r: 240, g: 240, b: 250 };
    }

    getVintageColor(gray) {
        const normalizedGray = gray / 255;
        if (normalizedGray < 0.2) return { r: 80, g: 50, b: 30 };
        if (normalizedGray < 0.4) return { r: 200, g: 160, b: 140 };
        if (normalizedGray < 0.6) return { r: 160, g: 180, b: 200 };
        if (normalizedGray < 0.8) return { r: 180, g: 180, b: 180 };
        return { r: 220, g: 220, b: 220 };
    }

    getVividColor(gray) {
        const normalizedGray = gray / 255;
        if (normalizedGray < 0.2) return { r: 30, g: 20, b: 10 };
        if (normalizedGray < 0.4) return { r: 255, g: 200, b: 180 };
        if (normalizedGray < 0.6) return { r: 100, g: 200, b: 255 };
        if (normalizedGray < 0.8) return { r: 220, g: 220, b: 220 };
        return { r: 255, g: 255, b: 255 };
    }

    getWarmColor(gray) {
        const normalizedGray = gray / 255;
        if (normalizedGray < 0.2) return { r: 60, g: 40, b: 20 };
        if (normalizedGray < 0.4) return { r: 255, g: 220, b: 200 };
        if (normalizedGray < 0.6) return { r: 255, g: 180, b: 120 };
        if (normalizedGray < 0.8) return { r: 240, g: 220, b: 200 };
        return { r: 255, g: 250, b: 240 };
    }

    getCoolColor(gray) {
        const normalizedGray = gray / 255;
        if (normalizedGray < 0.2) return { r: 20, g: 30, b: 40 };
        if (normalizedGray < 0.4) return { r: 200, g: 220, b: 255 };
        if (normalizedGray < 0.6) return { r: 120, g: 180, b: 255 };
        if (normalizedGray < 0.8) return { r: 200, g: 220, b: 240 };
        return { r: 240, g: 250, b: 255 };
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 128, g: 128, b: 128 };
    }

    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0; // No color
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        
        return { h: h * 360, s, l };
    }

    hslToRgb(h, s, l) {
        h /= 360;
        
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l; // No color
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    blendColors(gray, color, intensity) {
        // More natural color blending algorithm
        const grayHsl = this.rgbToHsl(gray, gray, gray);
        const colorHsl = this.rgbToHsl(color.r, color.g, color.b);
        
        // Calculate blended HSL values
        const blendedHsl = {
            h: colorHsl.h, // Use target color hue
            s: colorHsl.s * intensity, // Adjust saturation based on intensity
            l: grayHsl.l // Preserve original image brightness
        };
        
        // Convert back to RGB
        const blendedRgb = this.hslToRgb(blendedHsl.h, blendedHsl.s, blendedHsl.l);
        
        // Add some random variation to make colors more natural
        const variation = 0.05; // 5% random variation
        const randomFactor = 1 + (Math.random() - 0.5) * variation;
        
        return {
            r: Math.max(0, Math.min(255, blendedRgb.r * randomFactor)),
            g: Math.max(0, Math.min(255, blendedRgb.g * randomFactor)),
            b: Math.max(0, Math.min(255, blendedRgb.b * randomFactor))
        };
    }

    preserveContrast(data, width, height) {
        // Preserve contrast
        for (let i = 0; i < data.length; i += 4) {
            const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const contrast = 1.2;
            
            data[i] = Math.min(255, Math.max(0, (data[i] - 128) * contrast + 128));
            data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrast + 128));
            data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrast + 128));
        }
    }

    enhanceDetails(data, width, height) {
        // Detail enhancement
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

    smoothTransitions(data, width, height) {
        // Smooth transitions
        const tempData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const index = (y * width + x) * 4;
                
                // Slight Gaussian blur
                const blurred = this.applyGaussianBlur(tempData, width, height, x, y);
                
                data[index] = Math.round(data[index] * 0.8 + blurred.r * 0.2);
                data[index + 1] = Math.round(data[index + 1] * 0.8 + blurred.g * 0.2);
                data[index + 2] = Math.round(data[index + 2] * 0.8 + blurred.b * 0.2);
            }
        }
    }

    applyColorHarmony(data, width, height) {
        // Color harmony
        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        
        // Calculate average color
        for (let i = 0; i < data.length; i += 40) {
            rSum += data[i];
            gSum += data[i + 1];
            bSum += data[i + 2];
            count++;
        }
        
        const avgR = rSum / count;
        const avgG = gSum / count;
        const avgB = bSum / count;
        
        // Adjust color harmony
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, Math.max(0, data[i] * 0.9 + avgR * 0.1));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * 0.9 + avgG * 0.1));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * 0.9 + avgB * 0.1));
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

    getColorizationSettings() {
        const colorizationMode = document.querySelector('input[name="colorizationMode"]:checked').value;
        const intensity = parseInt(document.getElementById('intensitySlider').value);
        const colorStyle = document.querySelector('input[name="colorStyle"]:checked').value;
        const skinColor = document.getElementById('skinColor').value;
        const skyColor = document.getElementById('skyColor').value;
        const plantColor = document.getElementById('plantColor').value;
        const buildingColor = document.getElementById('buildingColor').value;
        const preserveContrast = document.getElementById('preserveContrast').checked;
        const enhanceDetails = document.getElementById('enhanceDetails').checked;
        const smoothTransitions = document.getElementById('smoothTransitions').checked;
        const colorHarmony = document.getElementById('colorHarmony').checked;
        const skinDetection = document.getElementById('skinDetection').checked;
        const objectRecognition = document.getElementById('objectRecognition').checked;
        const outputFormat = document.getElementById('outputFormat').value;
        const quality = parseInt(document.getElementById('qualitySlider').value);
        
        return {
            colorizationMode,
            intensity,
            colorStyle,
            skinColor,
            skyColor,
            plantColor,
            buildingColor,
            preserveContrast,
            enhanceDetails,
            smoothTransitions,
            colorHarmony,
            skinDetection,
            objectRecognition,
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

        this.colorizedImages.forEach(imageData => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.innerHTML = `
                <img src="${imageData.dataUrl}" alt="${imageData.name}" class="result-preview" />
                <div class="result-info">${this.formatFileSize(imageData.size)} | ${imageData.width}×${imageData.height}</div>
                <div class="result-name">${imageData.name}</div>
                <div class="result-actions">
                    <button class="btn btn-success" onclick="blackWhiteColorizer.downloadSingleImage('${imageData.name}')">Download</button>
                </div>
            `;
            resultsGrid.appendChild(resultItem);
        });

        document.getElementById('resultsSection').style.display = 'block';
    }

    async previewColorization() {
        if (this.images.length === 0) {
            alert('Please select an image first');
            return;
        }

        const firstImage = this.images[0];
        const colorizedImage = await this.colorizeImage(firstImage);
        
        if (colorizedImage) {
            // Create preview window
            const previewWindow = window.open('', '_blank', 'width=1200,height=800');
            previewWindow.document.write(`
                <html>
                    <head>
                        <title>Black and White Photo Colorization Preview</title>
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
                        <h2>Black and White Photo Colorization Preview</h2>
                        <div class="preview-container">
                            <div class="preview-item">
                                <h3>Before Colorization</h3>
                                <img src="${firstImage.dataUrl}" alt="Before Colorization" />
                                <div class="preview-info">Dimensions: ${firstImage.width}×${firstImage.height}</div>
                                <div class="preview-info">Size: ${this.formatFileSize(firstImage.size)}</div>
                            </div>
                            <div class="preview-item">
                                <h3>After Colorization</h3>
                                <img src="${colorizedImage.dataUrl}" alt="After Colorization" />
                                <div class="preview-info">Dimensions: ${colorizedImage.width}×${colorizedImage.height}</div>
                                <div class="preview-info">Size: ${this.formatFileSize(colorizedImage.size)}</div>
                            </div>
                        </div>
                    </body>
                </html>
            `);
        }
    }

    downloadSingleImage(imageName) {
        const imageData = this.colorizedImages.find(img => img.name === imageName);
        if (!imageData) return;

        const link = document.createElement('a');
        link.download = imageData.name;
        link.href = imageData.dataUrl;
        link.click();
    }

    downloadAllImages() {
        this.colorizedImages.forEach(imageData => {
            setTimeout(() => {
                this.downloadSingleImage(imageData.name);
            }, 100);
        });
    }

    async downloadAsZip() {
        if (this.colorizedImages.length === 0) {
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
        this.colorizedImages = [];
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

// Initialize application
let blackWhiteColorizer;
document.addEventListener('DOMContentLoaded', () => {
    blackWhiteColorizer = new BlackWhiteColorizer();
});
