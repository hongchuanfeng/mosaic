class IconGenerator {
    constructor() {
        this.sourceImage = null;
        this.generatedIcons = [];
        this.isGenerating = false;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupCustomSizeToggle();
        this.setupBackgroundToggle();
        this.setupBorderRadiusToggle();
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
        
        // 自定义尺寸切换
        document.getElementById('customSizeEnabled').addEventListener('change', (e) => this.toggleCustomSize(e));
        
        // 背景颜色切换
        document.querySelectorAll('input[name="background"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handleBackgroundChange(e));
        });
        
        // 圆角控制
        document.getElementById('addBorderRadius').addEventListener('change', (e) => this.toggleBorderRadius(e));
        document.getElementById('borderRadiusSlider').addEventListener('input', (e) => this.updateBorderRadiusValue(e));
        
        // 圆角预设按钮
        document.querySelectorAll('.radius-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setBorderRadiusPreset(e));
        });
        
        // 按钮事件
        document.getElementById('generateIconsBtn').addEventListener('click', () => this.generateIcons());
        document.getElementById('previewBtn').addEventListener('click', () => this.previewIcons());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('downloadAllBtn').addEventListener('click', () => this.downloadAllIcons());
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
        if (files.length > 0) {
            this.loadImage(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.loadImage(file);
        }
    }

    loadImage(file) {
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.sourceImage = img;
                this.showSettings();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    showSettings() {
        document.getElementById('settingsSection').style.display = 'block';
    }

    setupCustomSizeToggle() {
        const customSizeEnabled = document.getElementById('customSizeEnabled');
        const customSizeInput = document.getElementById('customSizeInput');
        
        customSizeEnabled.addEventListener('change', (e) => {
            customSizeInput.style.display = e.target.checked ? 'flex' : 'none';
        });
    }

    setupBackgroundToggle() {
        const customColorInput = document.getElementById('customColor');
        const customRadio = document.querySelector('input[name="background"][value="custom"]');
        
        customRadio.addEventListener('change', (e) => {
            customColorInput.style.display = e.target.checked ? 'block' : 'none';
        });
    }

    setupBorderRadiusToggle() {
        const borderRadiusCheckbox = document.getElementById('addBorderRadius');
        const borderRadiusControl = document.getElementById('borderRadiusControl');
        
        borderRadiusCheckbox.addEventListener('change', (e) => {
            borderRadiusControl.style.display = e.target.checked ? 'block' : 'none';
        });
    }

    toggleBorderRadius(e) {
        const borderRadiusControl = document.getElementById('borderRadiusControl');
        borderRadiusControl.style.display = e.target.checked ? 'block' : 'none';
    }

    updateBorderRadiusValue(e) {
        const slider = e.target;
        const value = parseInt(slider.value);
        const valueDisplay = document.getElementById('borderRadiusValue');
        
        // Clear circle marker if user manually adjusts slider
        if (slider.getAttribute('data-is-circle') === 'true') {
            slider.removeAttribute('data-is-circle');
            // Clear active state from circle button
            document.querySelectorAll('.radius-preset-btn').forEach(btn => {
                if (btn.dataset.value === 'circle') {
                    btn.classList.remove('active');
                }
            });
        }
        
        valueDisplay.textContent = value + 'px';
    }

    setBorderRadiusPreset(e) {
        const value = e.target.dataset.value;
        const slider = document.getElementById('borderRadiusSlider');
        const valueDisplay = document.getElementById('borderRadiusValue');
        
        if (value === 'circle') {
            // For circle, set a special value that will be handled in generateIcon
            slider.value = 999; // Use a large value as marker
            slider.setAttribute('data-is-circle', 'true');
            valueDisplay.textContent = 'Circle';
        } else {
            const numValue = parseInt(value);
            slider.value = numValue;
            slider.removeAttribute('data-is-circle');
            valueDisplay.textContent = numValue + 'px';
        }
        
        // 更新按钮状态
        document.querySelectorAll('.radius-preset-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
    }

    handleBackgroundChange(e) {
        const customColorInput = document.getElementById('customColor');
        customColorInput.style.display = e.target.value === 'custom' ? 'block' : 'none';
    }

    getSelectedSizes() {
        const sizes = [];
        
        // 获取预设尺寸
        const presetSizes = [16, 32, 48, 64, 128, 256, 512];
        presetSizes.forEach(size => {
            const checkbox = document.getElementById(`size${size}`);
            if (checkbox && checkbox.checked) {
                sizes.push(size);
            }
        });
        
        // 获取自定义尺寸
        if (document.getElementById('customSizeEnabled').checked) {
            const width = parseInt(document.getElementById('customSizeValue').value);
            const height = parseInt(document.getElementById('customSizeValue2').value);
            if (width && height && width >= 16 && height >= 16) {
                sizes.push({ width, height });
            }
        }
        
        return sizes;
    }

    async generateIcons() {
        if (!this.sourceImage) {
            alert('请先选择图片');
            return;
        }

        const sizes = this.getSelectedSizes();
        if (sizes.length === 0) {
            alert('请选择至少一个尺寸');
            return;
        }

        this.isGenerating = true;
        this.generatedIcons = [];
        
        const outputFormat = document.getElementById('outputFormat').value;
        const cropToSquare = document.getElementById('cropToSquare').checked;
        const addPadding = document.getElementById('addPadding').checked;
        const addBorderRadius = document.getElementById('addBorderRadius').checked;
        const borderRadiusSlider = document.getElementById('borderRadiusSlider');
        const isCircle = borderRadiusSlider.getAttribute('data-is-circle') === 'true';
        const borderRadius = isCircle ? 'circle' : parseInt(borderRadiusSlider.value);
        const optimizeForWeb = document.getElementById('optimizeForWeb').checked;
        const backgroundType = document.querySelector('input[name="background"]:checked').value;
        const customColor = document.getElementById('customColor').value;

        for (const size of sizes) {
            try {
                const icon = await this.generateIcon(size, outputFormat, {
                    cropToSquare,
                    addPadding,
                    addBorderRadius,
                    borderRadius,
                    optimizeForWeb,
                    backgroundType,
                    customColor
                });
                
                if (icon) {
                    this.generatedIcons.push(icon);
                }
            } catch (error) {
                console.error('生成图标失败:', error);
            }
        }

        this.isGenerating = false;
        this.displayResults();
    }

    async generateIcon(size, format, options) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 确定输出尺寸
            let outputWidth, outputHeight;
            if (typeof size === 'number') {
                outputWidth = outputHeight = size;
            } else {
                outputWidth = size.width;
                outputHeight = size.height;
            }
            
            canvas.width = outputWidth;
            canvas.height = outputHeight;
            
            // 计算实际的圆角半径
            let actualRadius = 0;
            if (options.addBorderRadius) {
                if (options.borderRadius === 'circle') {
                    // For circle, use half of the minimum dimension
                    actualRadius = Math.min(outputWidth, outputHeight) / 2;
                } else {
                    // Clamp radius to maximum possible (half of minimum dimension)
                    const maxRadius = Math.min(outputWidth, outputHeight) / 2;
                    actualRadius = Math.min(options.borderRadius, maxRadius);
                }
            }
            
            // 设置背景
            if (options.backgroundType === 'white') {
                ctx.fillStyle = '#ffffff';
                this.fillRoundedRect(ctx, 0, 0, outputWidth, outputHeight, actualRadius);
            } else if (options.backgroundType === 'custom') {
                ctx.fillStyle = options.customColor;
                this.fillRoundedRect(ctx, 0, 0, outputWidth, outputHeight, actualRadius);
            }
            
            // 计算图片绘制区域
            let drawX = 0, drawY = 0, drawWidth = outputWidth, drawHeight = outputHeight;
            
            if (options.cropToSquare) {
                // 裁剪为正方形
                const minDimension = Math.min(this.sourceImage.width, this.sourceImage.height);
                const sourceX = (this.sourceImage.width - minDimension) / 2;
                const sourceY = (this.sourceImage.height - minDimension) / 2;
                
                if (options.addPadding) {
                    // 添加内边距
                    const padding = Math.min(outputWidth, outputHeight) * 0.1;
                    drawX = padding;
                    drawY = padding;
                    drawWidth = outputWidth - padding * 2;
                    drawHeight = outputHeight - padding * 2;
                }
                
                if (options.addBorderRadius) {
                    this.drawRoundedImage(ctx, this.sourceImage, sourceX, sourceY, minDimension, minDimension, drawX, drawY, drawWidth, drawHeight, actualRadius);
                } else {
                    ctx.drawImage(
                        this.sourceImage,
                        sourceX, sourceY, minDimension, minDimension,
                        drawX, drawY, drawWidth, drawHeight
                    );
                }
            } else {
                // 保持原始比例
                if (options.addPadding) {
                    const padding = Math.min(outputWidth, outputHeight) * 0.1;
                    drawX = padding;
                    drawY = padding;
                    drawWidth = outputWidth - padding * 2;
                    drawHeight = outputHeight - padding * 2;
                }
                
                if (options.addBorderRadius) {
                    this.drawRoundedImage(ctx, this.sourceImage, 0, 0, this.sourceImage.width, this.sourceImage.height, drawX, drawY, drawWidth, drawHeight, actualRadius);
                } else {
                    ctx.drawImage(this.sourceImage, drawX, drawY, drawWidth, drawHeight);
                }
            }
            
            // 生成数据URL
            let mimeType = 'image/png';
            let fileExtension = 'png';
            
            switch (format) {
                case 'ico':
                    mimeType = 'image/x-icon';
                    fileExtension = 'ico';
                    break;
                case 'svg':
                    // SVG需要特殊处理
                    const svgData = this.generateSVG(outputWidth, outputHeight, canvas.toDataURL('image/png'));
                    const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
                    const svgName = `icon-${outputWidth}x${outputHeight}.svg`;
                    
                    resolve({
                        name: svgName,
                        size: svgBlob.size,
                        width: outputWidth,
                        height: outputHeight,
                        dataUrl: `data:image/svg+xml;base64,${btoa(svgData)}`,
                        blob: svgBlob,
                        mimeType: 'image/svg+xml'
                    });
                    return;
                default:
                    mimeType = 'image/png';
                    fileExtension = 'png';
            }
            
            // 优化质量
            let quality = 1;
            if (options.optimizeForWeb) {
                quality = 0.9;
            }
            
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
            const sizeStr = typeof size === 'number' ? `${size}x${size}` : `${size.width}x${size.height}`;
            const fileName = `icon-${sizeStr}.${fileExtension}`;
            
            resolve({
                name: fileName,
                size: blob.size,
                width: outputWidth,
                height: outputHeight,
                dataUrl: dataUrl,
                blob: blob,
                mimeType: mimeType
            });
        });
    }

    generateSVG(width, height, imageDataUrl) {
        return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <image href="${imageDataUrl}" width="${width}" height="${height}"/>
        </svg>`;
    }

    // 绘制圆角矩形
    fillRoundedRect(ctx, x, y, width, height, radius) {
        if (radius === 0) {
            ctx.fillRect(x, y, width, height);
            return;
        }
        
        // If radius is half of minimum dimension, draw a circle/ellipse
        const minDim = Math.min(width, height);
        if (radius >= minDim / 2) {
            ctx.beginPath();
            const centerX = x + width / 2;
            const centerY = y + height / 2;
            const radiusX = width / 2;
            const radiusY = height / 2;
            ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.fill();
            return;
        }
        
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    }

    // 绘制圆角图片
    drawRoundedImage(ctx, img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight, radius) {
        if (radius === 0) {
            ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
            return;
        }
        
        ctx.save();
        
        // If radius is half of minimum dimension, draw a circle/ellipse
        const minDim = Math.min(dWidth, dHeight);
        if (radius >= minDim / 2) {
            ctx.beginPath();
            const centerX = dx + dWidth / 2;
            const centerY = dy + dHeight / 2;
            const radiusX = dWidth / 2;
            const radiusY = dHeight / 2;
            ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.clip();
        } else {
            ctx.beginPath();
            ctx.moveTo(dx + radius, dy);
            ctx.lineTo(dx + dWidth - radius, dy);
            ctx.quadraticCurveTo(dx + dWidth, dy, dx + dWidth, dy + radius);
            ctx.lineTo(dx + dWidth, dy + dHeight - radius);
            ctx.quadraticCurveTo(dx + dWidth, dy + dHeight, dx + dWidth - radius, dy + dHeight);
            ctx.lineTo(dx + radius, dy + dHeight);
            ctx.quadraticCurveTo(dx, dy + dHeight, dx, dy + dHeight - radius);
            ctx.lineTo(dx, dy + radius);
            ctx.quadraticCurveTo(dx, dy, dx + radius, dy);
            ctx.closePath();
            ctx.clip();
        }
        
        ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
        ctx.restore();
    }

    previewIcons() {
        if (!this.sourceImage) {
            alert('请先选择图片');
            return;
        }

        const sizes = this.getSelectedSizes();
        if (sizes.length === 0) {
            alert('请选择至少一个尺寸');
            return;
        }

        this.displayPreview(sizes);
    }

    async displayPreview(sizes) {
        const previewGrid = document.getElementById('previewGrid');
        previewGrid.innerHTML = '';

        for (const size of sizes) {
            const outputWidth = typeof size === 'number' ? size : size.width;
            const outputHeight = typeof size === 'number' ? size : size.height;
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = outputWidth;
            canvas.height = outputHeight;
            
            // 简单的预览 - 直接缩放
            ctx.drawImage(this.sourceImage, 0, 0, outputWidth, outputHeight);
            
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.innerHTML = `
                <img src="${canvas.toDataURL()}" alt="预览" class="preview-icon" />
                <div class="preview-info">预览</div>
                <div class="preview-size">${outputWidth}×${outputHeight}</div>
            `;
            previewGrid.appendChild(previewItem);
        }

        document.getElementById('previewSection').style.display = 'block';
    }

    displayResults() {
        const resultsGrid = document.getElementById('resultsGrid');
        resultsGrid.innerHTML = '';

        this.generatedIcons.forEach(icon => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.innerHTML = `
                <img src="${icon.dataUrl}" alt="${icon.name}" class="result-icon" />
                <div class="result-info">${this.formatFileSize(icon.size)}</div>
                <div class="result-name">${icon.name}</div>
                <div class="result-actions">
                    <button class="btn btn-success" onclick="iconGenerator.downloadSingleIcon('${icon.name}')">下载</button>
                </div>
            `;
            resultsGrid.appendChild(resultItem);
        });

        document.getElementById('resultsSection').style.display = 'block';
    }

    downloadSingleIcon(iconName) {
        const icon = this.generatedIcons.find(i => i.name === iconName);
        if (!icon) return;

        const link = document.createElement('a');
        link.download = icon.name;
        link.href = icon.dataUrl;
        link.click();
    }

    downloadAllIcons() {
        this.generatedIcons.forEach(icon => {
            setTimeout(() => {
                this.downloadSingleIcon(icon.name);
            }, 100);
        });
    }

    async downloadAsZip() {
        if (this.generatedIcons.length === 0) {
            alert('没有可下载的图标');
            return;
        }

        // 由于浏览器限制，我们无法直接创建ZIP文件
        // 这里提供一个替代方案：逐个下载
        alert('由于浏览器限制，将逐个下载图标文件');
        this.downloadAllIcons();
    }

    clearAll() {
        this.sourceImage = null;
        this.generatedIcons = [];
        document.getElementById('fileInput').value = '';
        document.getElementById('settingsSection').style.display = 'none';
        document.getElementById('previewSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'none';
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
let iconGenerator;
document.addEventListener('DOMContentLoaded', () => {
    iconGenerator = new IconGenerator();
});
