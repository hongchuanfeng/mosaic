class ImageJoiner {
    constructor() {
        this.images = [];
        this.canvas = null;
        this.ctx = null;
        this.settings = {
            layoutType: 'horizontal',
            gridCols: 2,
            gridRows: 2,
            sizeMode: 'original',
            customWidth: 400,
            customHeight: 300,
            horizontalSpacing: 0,
            verticalSpacing: 0,
            backgroundType: 'color',
            backgroundColor: '#ffffff',
            outputFormat: 'png',
            imageQuality: 0.9
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
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
        
        // 布局类型切换
        document.querySelectorAll('input[name="layoutType"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handleLayoutTypeChange(e));
        });
        
        // 网格设置
        document.getElementById('gridCols').addEventListener('input', (e) => {
            this.settings.gridCols = parseInt(e.target.value);
            this.updatePreview();
        });
        
        document.getElementById('gridRows').addEventListener('input', (e) => {
            this.settings.gridRows = parseInt(e.target.value);
            this.updatePreview();
        });
        
        // 尺寸模式切换
        document.querySelectorAll('input[name="sizeMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handleSizeModeChange(e));
        });
        
        // 自定义尺寸
        document.getElementById('customWidth').addEventListener('input', (e) => {
            this.settings.customWidth = parseInt(e.target.value);
            this.updatePreview();
        });
        
        document.getElementById('customHeight').addEventListener('input', (e) => {
            this.settings.customHeight = parseInt(e.target.value);
            this.updatePreview();
        });
        
        // 间距设置
        document.getElementById('horizontalSpacing').addEventListener('input', (e) => {
            this.settings.horizontalSpacing = parseInt(e.target.value);
            document.getElementById('horizontalSpacingValue').textContent = e.target.value + 'px';
            this.updatePreview();
        });
        
        document.getElementById('verticalSpacing').addEventListener('input', (e) => {
            this.settings.verticalSpacing = parseInt(e.target.value);
            document.getElementById('verticalSpacingValue').textContent = e.target.value + 'px';
            this.updatePreview();
        });
        
        // 背景设置
        document.querySelectorAll('input[name="backgroundType"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handleBackgroundTypeChange(e));
        });
        
        document.getElementById('backgroundColor').addEventListener('change', (e) => {
            this.settings.backgroundColor = e.target.value;
            document.getElementById('backgroundColorHex').value = e.target.value;
            this.updatePreview();
        });
        
        document.getElementById('backgroundColorHex').addEventListener('input', (e) => {
            if (this.isValidHex(e.target.value)) {
                this.settings.backgroundColor = e.target.value;
                document.getElementById('backgroundColor').value = e.target.value;
                this.updatePreview();
            }
        });
        
        // 输出格式
        document.getElementById('outputFormat').addEventListener('change', (e) => {
            this.settings.outputFormat = e.target.value;
            this.toggleQualityGroup();
        });
        
        document.getElementById('imageQuality').addEventListener('input', (e) => {
            this.settings.imageQuality = parseFloat(e.target.value);
            document.getElementById('imageQualityValue').textContent = Math.round(e.target.value * 100) + '%';
        });
        
        // 按钮事件
        document.getElementById('previewBtn').addEventListener('click', () => this.previewJoin());
        document.getElementById('joinBtn').addEventListener('click', () => this.joinImages());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadImage());
        document.getElementById('downloadPngBtn').addEventListener('click', () => this.downloadImage('png'));
        document.getElementById('downloadJpgBtn').addEventListener('click', () => this.downloadImage('jpeg'));
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

        if (imageFiles.length > 20) {
            alert('最多只能上传20张图片');
            return;
        }

        if (this.images.length + imageFiles.length > 20) {
            alert('图片总数不能超过20张');
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

        this.images.forEach((imageData, index) => {
            const imageItem = document.createElement('div');
            imageItem.className = 'image-item';
            imageItem.innerHTML = `
                <button class="image-remove" onclick="imageJoiner.removeImage('${imageData.id}')">×</button>
                <img src="${imageData.dataUrl}" alt="${imageData.name}" class="image-preview" />
                <div class="image-info">${this.formatFileSize(imageData.size)} | ${imageData.width}×${imageData.height}</div>
                <div class="image-name">${imageData.name}</div>
                <div class="image-actions">
                    <button class="btn btn-primary" onclick="imageJoiner.moveImage('${imageData.id}', 'up')" ${index === 0 ? 'disabled' : ''}>上移</button>
                    <button class="btn btn-secondary" onclick="imageJoiner.moveImage('${imageData.id}', 'down')" ${index === this.images.length - 1 ? 'disabled' : ''}>下移</button>
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

    moveImage(imageId, direction) {
        const index = this.images.findIndex(img => img.id == imageId);
        if (index === -1) return;

        if (direction === 'up' && index > 0) {
            [this.images[index], this.images[index - 1]] = [this.images[index - 1], this.images[index]];
        } else if (direction === 'down' && index < this.images.length - 1) {
            [this.images[index], this.images[index + 1]] = [this.images[index + 1], this.images[index]];
        }

        this.displayImages();
    }

    showSettings() {
        document.getElementById('settingsSection').style.display = 'block';
        document.getElementById('imagesSection').style.display = 'block';
    }

    hideSettings() {
        document.getElementById('settingsSection').style.display = 'none';
        document.getElementById('imagesSection').style.display = 'none';
        document.getElementById('previewSection').style.display = 'none';
    }

    handleLayoutTypeChange(e) {
        this.settings.layoutType = e.target.value;
        
        // 显示/隐藏网格设置
        const gridSettings = document.getElementById('gridSettings');
        if (e.target.value === 'grid') {
            gridSettings.style.display = 'block';
        } else {
            gridSettings.style.display = 'none';
        }
        
        this.updatePreview();
    }

    handleSizeModeChange(e) {
        this.settings.sizeMode = e.target.value;
        
        // 显示/隐藏自定义尺寸输入
        const sizeInputs = document.getElementById('sizeInputs');
        if (e.target.value === 'custom') {
            sizeInputs.style.display = 'flex';
        } else {
            sizeInputs.style.display = 'none';
        }
        
        this.updatePreview();
    }

    handleBackgroundTypeChange(e) {
        this.settings.backgroundType = e.target.value;
        
        // 显示/隐藏背景颜色设置
        const backgroundColorGroup = document.getElementById('backgroundColorGroup');
        if (e.target.value === 'color' || e.target.value === 'gradient') {
            backgroundColorGroup.style.display = 'block';
        } else {
            backgroundColorGroup.style.display = 'none';
        }
        
        this.updatePreview();
    }

    toggleQualityGroup() {
        const qualityGroup = document.getElementById('qualityGroup');
        if (this.settings.outputFormat === 'jpeg') {
            qualityGroup.style.display = 'block';
        } else {
            qualityGroup.style.display = 'none';
        }
    }

    isValidHex(hex) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
    }

    setupCanvas() {
        this.canvas = document.getElementById('previewCanvas');
        this.ctx = this.canvas.getContext('2d');
    }

    calculateCanvasSize() {
        if (this.images.length === 0) return { width: 400, height: 300 };

        const { layoutType, gridCols, gridRows, horizontalSpacing, verticalSpacing } = this.settings;
        
        if (layoutType === 'horizontal') {
            return this.calculateHorizontalSize(horizontalSpacing, verticalSpacing);
        } else if (layoutType === 'vertical') {
            return this.calculateVerticalSize(horizontalSpacing, verticalSpacing);
        } else if (layoutType === 'grid') {
            return this.calculateGridSize(gridCols, gridRows, horizontalSpacing, verticalSpacing);
        }
        
        return { width: 400, height: 300 };
    }

    calculateHorizontalSize(hSpacing, vSpacing) {
        let totalWidth = 0;
        let maxHeight = 0;
        
        this.images.forEach((imageData, index) => {
            const { width, height } = this.getImageSize(imageData);
            totalWidth += width;
            if (index > 0) totalWidth += hSpacing;
            maxHeight = Math.max(maxHeight, height);
        });
        
        return { width: totalWidth, height: maxHeight };
    }

    calculateVerticalSize(hSpacing, vSpacing) {
        let maxWidth = 0;
        let totalHeight = 0;
        
        this.images.forEach((imageData, index) => {
            const { width, height } = this.getImageSize(imageData);
            maxWidth = Math.max(maxWidth, width);
            totalHeight += height;
            if (index > 0) totalHeight += vSpacing;
        });
        
        return { width: maxWidth, height: totalHeight };
    }

    calculateGridSize(cols, rows, hSpacing, vSpacing) {
        const cellWidths = [];
        const cellHeights = [];
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const index = row * cols + col;
                if (index < this.images.length) {
                    const { width, height } = this.getImageSize(this.images[index]);
                    cellWidths[col] = Math.max(cellWidths[col] || 0, width);
                    cellHeights[row] = Math.max(cellHeights[row] || 0, height);
                }
            }
        }
        
        const totalWidth = cellWidths.reduce((sum, width) => sum + width, 0) + (cols - 1) * hSpacing;
        const totalHeight = cellHeights.reduce((sum, height) => sum + height, 0) + (rows - 1) * vSpacing;
        
        return { width: totalWidth, height: totalHeight };
    }

    getImageSize(imageData) {
        const { sizeMode, customWidth, customHeight } = this.settings;
        
        if (sizeMode === 'original') {
            return { width: imageData.width, height: imageData.height };
        } else if (sizeMode === 'uniform') {
            // 计算统一尺寸，保持宽高比
            const maxWidth = 300;
            const maxHeight = 300;
            const ratio = Math.min(maxWidth / imageData.width, maxHeight / imageData.height);
            return {
                width: Math.round(imageData.width * ratio),
                height: Math.round(imageData.height * ratio)
            };
        } else if (sizeMode === 'custom') {
            return { width: customWidth, height: customHeight };
        }
        
        return { width: imageData.width, height: imageData.height };
    }

    drawBackground() {
        const { backgroundType, backgroundColor } = this.settings;
        
        if (backgroundType === 'transparent') {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        } else if (backgroundType === 'color') {
            this.ctx.fillStyle = backgroundColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else if (backgroundType === 'gradient') {
            const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
            gradient.addColorStop(0, backgroundColor);
            gradient.addColorStop(1, this.lightenColor(backgroundColor, 20));
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    drawImages() {
        const { layoutType, gridCols, gridRows, horizontalSpacing, verticalSpacing } = this.settings;
        
        if (layoutType === 'horizontal') {
            this.drawHorizontalLayout(horizontalSpacing, verticalSpacing);
        } else if (layoutType === 'vertical') {
            this.drawVerticalLayout(horizontalSpacing, verticalSpacing);
        } else if (layoutType === 'grid') {
            this.drawGridLayout(gridCols, gridRows, horizontalSpacing, verticalSpacing);
        }
    }

    drawHorizontalLayout(hSpacing, vSpacing) {
        let x = 0;
        
        this.images.forEach((imageData, index) => {
            const { width, height } = this.getImageSize(imageData);
            const y = (this.canvas.height - height) / 2;
            
            this.ctx.drawImage(imageData.img, x, y, width, height);
            x += width + hSpacing;
        });
    }

    drawVerticalLayout(hSpacing, vSpacing) {
        let y = 0;
        
        this.images.forEach((imageData, index) => {
            const { width, height } = this.getImageSize(imageData);
            const x = (this.canvas.width - width) / 2;
            
            this.ctx.drawImage(imageData.img, x, y, width, height);
            y += height + vSpacing;
        });
    }

    drawGridLayout(cols, rows, hSpacing, vSpacing) {
        const cellWidths = [];
        const cellHeights = [];
        
        // 计算每列和每行的最大尺寸
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const index = row * cols + col;
                if (index < this.images.length) {
                    const { width, height } = this.getImageSize(this.images[index]);
                    cellWidths[col] = Math.max(cellWidths[col] || 0, width);
                    cellHeights[row] = Math.max(cellHeights[row] || 0, height);
                }
            }
        }
        
        // 绘制图片
        this.images.forEach((imageData, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            
            if (row < rows) {
                const { width, height } = this.getImageSize(imageData);
                const cellWidth = cellWidths[col];
                const cellHeight = cellHeights[row];
                
                // 计算位置
                let x = 0;
                for (let i = 0; i < col; i++) {
                    x += cellWidths[i] + hSpacing;
                }
                
                let y = 0;
                for (let i = 0; i < row; i++) {
                    y += cellHeights[i] + vSpacing;
                }
                
                // 居中绘制
                const centerX = x + (cellWidth - width) / 2;
                const centerY = y + (cellHeight - height) / 2;
                
                this.ctx.drawImage(imageData.img, centerX, centerY, width, height);
            }
        });
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    updatePreview() {
        if (this.images.length === 0) return;
        
        const canvasSize = this.calculateCanvasSize();
        this.canvas.width = canvasSize.width;
        this.canvas.height = canvasSize.height;
        
        this.drawBackground();
        this.drawImages();
    }

    previewJoin() {
        if (this.images.length === 0) {
            alert('请先上传图片');
            return;
        }

        this.updatePreview();
        document.getElementById('previewSection').style.display = 'block';
        
        // 滚动到预览区域
        document.getElementById('previewSection').scrollIntoView({ 
            behavior: 'smooth' 
        });
    }

    joinImages() {
        if (this.images.length === 0) {
            alert('请先上传图片');
            return;
        }

        this.previewJoin();
    }

    downloadImage(format = null) {
        if (this.images.length === 0) {
            alert('请先生成拼接图片');
            return;
        }

        const outputFormat = format || this.settings.outputFormat;
        const mimeType = outputFormat === 'png' ? 'image/png' : 
                        outputFormat === 'jpeg' ? 'image/jpeg' : 'image/webp';
        const quality = outputFormat === 'jpeg' ? this.settings.imageQuality : undefined;
        
        // 创建下载链接
        const link = document.createElement('a');
        link.download = `joined-image-${Date.now()}.${outputFormat}`;
        link.href = this.canvas.toDataURL(mimeType, quality);
        link.click();
    }

    clearAll() {
        this.images = [];
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

    // 获取当前设置
    getSettings() {
        return { ...this.settings };
    }

    // 设置配置
    setSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.updateUI();
        this.updatePreview();
    }

    updateUI() {
        // 更新UI元素以反映当前设置
        document.querySelector(`input[name="layoutType"][value="${this.settings.layoutType}"]`).checked = true;
        document.getElementById('gridCols').value = this.settings.gridCols;
        document.getElementById('gridRows').value = this.settings.gridRows;
        document.querySelector(`input[name="sizeMode"][value="${this.settings.sizeMode}"]`).checked = true;
        document.getElementById('customWidth').value = this.settings.customWidth;
        document.getElementById('customHeight').value = this.settings.customHeight;
        document.getElementById('horizontalSpacing').value = this.settings.horizontalSpacing;
        document.getElementById('horizontalSpacingValue').textContent = this.settings.horizontalSpacing + 'px';
        document.getElementById('verticalSpacing').value = this.settings.verticalSpacing;
        document.getElementById('verticalSpacingValue').textContent = this.settings.verticalSpacing + 'px';
        document.querySelector(`input[name="backgroundType"][value="${this.settings.backgroundType}"]`).checked = true;
        document.getElementById('backgroundColor').value = this.settings.backgroundColor;
        document.getElementById('backgroundColorHex').value = this.settings.backgroundColor;
        document.getElementById('outputFormat').value = this.settings.outputFormat;
        document.getElementById('imageQuality').value = this.settings.imageQuality;
        document.getElementById('imageQualityValue').textContent = Math.round(this.settings.imageQuality * 100) + '%';
        
        // 触发相关事件
        this.handleLayoutTypeChange({ target: { value: this.settings.layoutType } });
        this.handleSizeModeChange({ target: { value: this.settings.sizeMode } });
        this.handleBackgroundTypeChange({ target: { value: this.settings.backgroundType } });
        this.toggleQualityGroup();
    }

    // 导出为Base64
    exportAsBase64(format = null) {
        const outputFormat = format || this.settings.outputFormat;
        const mimeType = outputFormat === 'png' ? 'image/png' : 
                        outputFormat === 'jpeg' ? 'image/jpeg' : 'image/webp';
        const quality = outputFormat === 'jpeg' ? this.settings.imageQuality : undefined;
        return this.canvas.toDataURL(mimeType, quality);
    }

    // 获取图片Blob
    async getImageBlob(format = null) {
        const outputFormat = format || this.settings.outputFormat;
        const mimeType = outputFormat === 'png' ? 'image/png' : 
                        outputFormat === 'jpeg' ? 'image/jpeg' : 'image/webp';
        const quality = outputFormat === 'jpeg' ? this.settings.imageQuality : undefined;
        
        return new Promise((resolve) => {
            this.canvas.toBlob((blob) => {
                resolve(blob);
            }, mimeType, quality);
        });
    }
}

// 初始化应用
let imageJoiner;
document.addEventListener('DOMContentLoaded', () => {
    imageJoiner = new ImageJoiner();
});
