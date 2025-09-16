class ImageCropper {
    constructor() {
        this.sourceImage = null;
        this.cropBox = null;
        this.cropOverlay = null;
        this.imageWrapper = null;
        this.previewCanvas = null;
        this.isDragging = false;
        this.isResizing = false;
        this.dragStart = { x: 0, y: 0 };
        this.cropStart = { x: 0, y: 0, width: 0, height: 0 };
        this.resizeHandle = null;
        this.currentMode = 'crop';
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupCropBox();
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
        
        // 工具栏按钮
        document.getElementById('cropBtn').addEventListener('click', () => this.setMode('crop'));
        document.getElementById('moveBtn').addEventListener('click', () => this.setMode('move'));
        document.getElementById('resetBtn').addEventListener('click', () => this.resetCrop());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadCroppedImage());
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
        
        const files = e.dataTransfer.files;
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
                this.displayImage();
                this.showEditor();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    displayImage() {
        const imgElement = document.getElementById('sourceImage');
        imgElement.src = this.sourceImage.src;
        
        // 计算显示尺寸
        const maxWidth = 600;
        const maxHeight = 500;
        let { width, height } = this.getDisplaySize(this.sourceImage.width, this.sourceImage.height, maxWidth, maxHeight);
        
        imgElement.style.width = width + 'px';
        imgElement.style.height = height + 'px';
        
        // 设置图片容器的实际尺寸
        this.imageWrapper = document.getElementById('imageWrapper');
        this.imageWrapper.style.width = width + 'px';
        this.imageWrapper.style.height = height + 'px';
        
        this.setupCropBox();
    }

    getDisplaySize(originalWidth, originalHeight, maxWidth, maxHeight) {
        const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
        return {
            width: Math.floor(originalWidth * ratio),
            height: Math.floor(originalHeight * ratio)
        };
    }

    showEditor() {
        document.getElementById('editorSection').style.display = 'block';
        document.querySelector('.upload-section').style.display = 'none';
    }

    setupCropBox() {
        this.cropBox = document.getElementById('cropBox');
        this.cropOverlay = document.getElementById('cropOverlay');
        this.previewCanvas = document.getElementById('previewCanvas');
        
        if (!this.sourceImage) return;
        
        // 初始化裁剪框位置和大小
        const wrapper = this.imageWrapper;
        const wrapperRect = wrapper.getBoundingClientRect();
        const imgRect = document.getElementById('sourceImage').getBoundingClientRect();
        
        const boxSize = Math.min(imgRect.width, imgRect.height) * 0.6;
        const left = (imgRect.width - boxSize) / 2;
        const top = (imgRect.height - boxSize) / 2;
        
        this.cropBox.style.left = left + 'px';
        this.cropBox.style.top = top + 'px';
        this.cropBox.style.width = boxSize + 'px';
        this.cropBox.style.height = boxSize + 'px';
        
        this.bindCropEvents();
        this.updatePreview();
    }

    bindCropEvents() {
        // 裁剪框拖拽
        this.cropBox.addEventListener('mousedown', (e) => this.startDrag(e));
        
        // 调整大小手柄
        const handles = this.cropBox.querySelectorAll('.crop-handle');
        handles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => this.startResize(e));
        });
        
        // 遮罩点击创建新裁剪框
        this.cropOverlay.addEventListener('mousedown', (e) => this.startNewCrop(e));
        
        // 全局鼠标事件
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    }

    startDrag(e) {
        if (this.currentMode !== 'move') return;
        
        e.preventDefault();
        this.isDragging = true;
        this.dragStart = {
            x: e.clientX - this.cropBox.offsetLeft,
            y: e.clientY - this.cropBox.offsetTop
        };
    }

    startResize(e) {
        e.preventDefault();
        e.stopPropagation();
        this.isResizing = true;
        this.resizeHandle = e.target.classList[1]; // 获取方向类名
        this.cropStart = {
            x: this.cropBox.offsetLeft,
            y: this.cropBox.offsetTop,
            width: this.cropBox.offsetWidth,
            height: this.cropBox.offsetHeight
        };
        this.dragStart = { x: e.clientX, y: e.clientY };
    }

    startNewCrop(e) {
        if (this.currentMode !== 'crop' || this.isDragging || this.isResizing) return;
        
        e.preventDefault();
        const rect = this.imageWrapper.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.cropBox.style.left = x + 'px';
        this.cropBox.style.top = y + 'px';
        this.cropBox.style.width = '0px';
        this.cropBox.style.height = '0px';
        
        this.isDragging = true;
        this.dragStart = { x, y };
    }

    handleMouseMove(e) {
        if (this.isDragging && this.currentMode === 'move') {
            this.updateCropPosition(e);
        } else if (this.isResizing) {
            this.updateCropSize(e);
        } else if (this.isDragging && this.currentMode === 'crop') {
            this.updateNewCrop(e);
        }
    }

    updateCropPosition(e) {
        const rect = this.imageWrapper.getBoundingClientRect();
        const x = e.clientX - rect.left - this.dragStart.x;
        const y = e.clientY - rect.top - this.dragStart.y;
        
        const maxX = this.imageWrapper.offsetWidth - this.cropBox.offsetWidth;
        const maxY = this.imageWrapper.offsetHeight - this.cropBox.offsetHeight;
        
        this.cropBox.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
        this.cropBox.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
        
        this.updatePreview();
    }

    updateCropSize(e) {
        const rect = this.imageWrapper.getBoundingClientRect();
        const deltaX = e.clientX - this.dragStart.x;
        const deltaY = e.clientY - this.dragStart.y;
        
        let newLeft = this.cropStart.x;
        let newTop = this.cropStart.y;
        let newWidth = this.cropStart.width;
        let newHeight = this.cropStart.height;
        
        switch (this.resizeHandle) {
            case 'nw':
                newLeft += deltaX;
                newTop += deltaY;
                newWidth -= deltaX;
                newHeight -= deltaY;
                break;
            case 'ne':
                newTop += deltaY;
                newWidth += deltaX;
                newHeight -= deltaY;
                break;
            case 'sw':
                newLeft += deltaX;
                newWidth -= deltaX;
                newHeight += deltaY;
                break;
            case 'se':
                newWidth += deltaX;
                newHeight += deltaY;
                break;
            case 'n':
                newTop += deltaY;
                newHeight -= deltaY;
                break;
            case 's':
                newHeight += deltaY;
                break;
            case 'w':
                newLeft += deltaX;
                newWidth -= deltaX;
                break;
            case 'e':
                newWidth += deltaX;
                break;
        }
        
        // 限制最小尺寸
        newWidth = Math.max(20, newWidth);
        newHeight = Math.max(20, newHeight);
        
        // 限制在图片范围内
        const maxX = this.imageWrapper.offsetWidth - newWidth;
        const maxY = this.imageWrapper.offsetHeight - newHeight;
        
        newLeft = Math.max(0, Math.min(newLeft, maxX));
        newTop = Math.max(0, Math.min(newTop, maxY));
        
        this.cropBox.style.left = newLeft + 'px';
        this.cropBox.style.top = newTop + 'px';
        this.cropBox.style.width = newWidth + 'px';
        this.cropBox.style.height = newHeight + 'px';
        
        this.updatePreview();
    }

    updateNewCrop(e) {
        const rect = this.imageWrapper.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const left = Math.min(this.dragStart.x, x);
        const top = Math.min(this.dragStart.y, y);
        const width = Math.abs(x - this.dragStart.x);
        const height = Math.abs(y - this.dragStart.y);
        
        this.cropBox.style.left = left + 'px';
        this.cropBox.style.top = top + 'px';
        this.cropBox.style.width = width + 'px';
        this.cropBox.style.height = height + 'px';
        
        this.updatePreview();
    }

    handleMouseUp(e) {
        this.isDragging = false;
        this.isResizing = false;
        this.resizeHandle = null;
    }

    setMode(mode) {
        this.currentMode = mode;
        
        // 更新按钮状态
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(mode + 'Btn').classList.add('active');
        
        // 更新遮罩状态
        if (mode === 'crop') {
            this.cropOverlay.classList.add('active');
        } else {
            this.cropOverlay.classList.remove('active');
        }
    }

    resetCrop() {
        if (!this.sourceImage) return;
        
        const imgRect = document.getElementById('sourceImage').getBoundingClientRect();
        const boxSize = Math.min(imgRect.width, imgRect.height) * 0.6;
        const left = (imgRect.width - boxSize) / 2;
        const top = (imgRect.height - boxSize) / 2;
        
        this.cropBox.style.left = left + 'px';
        this.cropBox.style.top = top + 'px';
        this.cropBox.style.width = boxSize + 'px';
        this.cropBox.style.height = boxSize + 'px';
        
        this.updatePreview();
    }

    updatePreview() {
        if (!this.sourceImage || !this.cropBox) return;
        
        const cropRect = this.cropBox.getBoundingClientRect();
        const imgRect = document.getElementById('sourceImage').getBoundingClientRect();
        const wrapperRect = this.imageWrapper.getBoundingClientRect();
        
        // 计算裁剪区域相对于图片的位置
        const scaleX = this.sourceImage.naturalWidth / imgRect.width;
        const scaleY = this.sourceImage.naturalHeight / imgRect.height;
        
        const cropX = (cropRect.left - imgRect.left) * scaleX;
        const cropY = (cropRect.top - imgRect.top) * scaleY;
        const cropWidth = cropRect.width * scaleX;
        const cropHeight = cropRect.height * scaleY;
        
        // 更新预览画布
        const canvas = this.previewCanvas;
        const ctx = canvas.getContext('2d');
        
        canvas.width = Math.min(200, cropWidth);
        canvas.height = Math.min(200, cropHeight);
        
        ctx.drawImage(
            this.sourceImage,
            cropX, cropY, cropWidth, cropHeight,
            0, 0, canvas.width, canvas.height
        );
        
        // 更新信息显示
        document.getElementById('cropSize').textContent = `尺寸: ${Math.round(cropWidth)} x ${Math.round(cropHeight)}`;
        const ratio = cropWidth / cropHeight;
        document.getElementById('cropRatio').textContent = `比例: ${ratio.toFixed(2)}:1`;
    }

    downloadCroppedImage() {
        if (!this.sourceImage || !this.cropBox) {
            alert('请先选择图片并设置裁剪区域');
            return;
        }
        
        const cropRect = this.cropBox.getBoundingClientRect();
        const imgRect = document.getElementById('sourceImage').getBoundingClientRect();
        
        // 计算裁剪区域相对于原图的位置
        const scaleX = this.sourceImage.naturalWidth / imgRect.width;
        const scaleY = this.sourceImage.naturalHeight / imgRect.height;
        
        const cropX = (cropRect.left - imgRect.left) * scaleX;
        const cropY = (cropRect.top - imgRect.top) * scaleY;
        const cropWidth = cropRect.width * scaleX;
        const cropHeight = cropRect.height * scaleY;
        
        // 创建裁剪后的画布
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        
        ctx.drawImage(
            this.sourceImage,
            cropX, cropY, cropWidth, cropHeight,
            0, 0, cropWidth, cropHeight
        );
        
        // 下载图片
        const link = document.createElement('a');
        link.download = 'cropped-image.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new ImageCropper();
});
