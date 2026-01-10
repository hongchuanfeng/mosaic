// 图片旋转工具主脚本
(function() {
    'use strict';

    // 全局变量
    let originalImage = null;
    let currentRotation = 0; // 当前旋转角度（度）
    let isFlippedHorizontal = false; // 是否水平翻转
    let isFlippedVertical = false; // 是否垂直翻转
    let canvas = null;
    let ctx = null;
    let previewCtx = null;
    let imageLoaded = false;

    // DOM元素引用
    const fileInput = document.getElementById('fileInput');
    const editorSection = document.getElementById('editorSection');
    const uploadSection = document.querySelector('.upload-section');
    const rotationCanvas = document.getElementById('rotationCanvas');
    const previewCanvas = document.getElementById('previewCanvas');
    const currentAngleSpan = document.getElementById('currentAngle');
    const imageSizeSpan = document.getElementById('imageSize');
    const rotationStatusSpan = document.getElementById('rotationStatus');

    // 按钮引用
    const uploadNewBtn = document.getElementById('uploadNewBtn');
    const rotateLeftBtn = document.getElementById('rotateLeftBtn');
    const rotateRightBtn = document.getElementById('rotateRightBtn');
    const flipHorizontalBtn = document.getElementById('flipHorizontalBtn');
    const flipVerticalBtn = document.getElementById('flipVerticalBtn');
    const resetBtn = document.getElementById('resetBtn');
    const applyAngleBtn = document.getElementById('applyAngleBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const angleInput = document.getElementById('angleInput');

    // 初始化函数
    function init() {
        setupEventListeners();
        updateUI();
    }

    // 设置事件监听器
    function setupEventListeners() {
        // 文件上传
        fileInput.addEventListener('change', handleFileUpload);

        // 拖拽上传
        setupDragAndDrop();

        // 上传新图片按钮
        uploadNewBtn.addEventListener('click', resetToUpload);

        // 旋转按钮
        rotateLeftBtn.addEventListener('click', () => rotateBy(-90));
        rotateRightBtn.addEventListener('click', () => rotateBy(90));
        flipHorizontalBtn.addEventListener('click', flipHorizontal);
        flipVerticalBtn.addEventListener('click', flipVertical);
        resetBtn.addEventListener('click', resetRotation);
        applyAngleBtn.addEventListener('click', applyCustomAngle);
        downloadBtn.addEventListener('click', downloadImage);

        // 角度输入验证
        angleInput.addEventListener('input', validateAngleInput);
        angleInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                applyCustomAngle();
            }
        });
    }

    // 设置拖拽上传
    function setupDragAndDrop() {
        const uploadArea = document.querySelector('.upload-area');

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, unhighlight, false);
        });

        function highlight() {
            uploadArea.classList.add('dragover');
        }

        function unhighlight() {
            uploadArea.classList.remove('dragover');
        }

        uploadArea.addEventListener('drop', handleDrop, false);

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;

            if (files.length > 0) {
                handleFiles(files);
            }
        }
    }

    // 处理文件上传
    function handleFileUpload(e) {
        const files = e.target.files;
        handleFiles(files);
    }

    // 处理文件
    function handleFiles(files) {
        const file = files[0];

        if (!file) return;

        // 验证文件类型
        if (!file.type.match('image.*')) {
            alert('请上传图片文件！');
            return;
        }

        // 验证文件大小（限制为10MB）
        if (file.size > 10 * 1024 * 1024) {
            alert('文件大小不能超过10MB！');
            return;
        }

        // 重置之前的图片状态
        originalImage = null;
        currentRotation = 0;
        isFlippedHorizontal = false;
        isFlippedVertical = false;
        imageLoaded = false;

        // 显示加载状态
        uploadSection.classList.add('loading');

        const reader = new FileReader();
        reader.onload = function(e) {
            loadImage(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    // 加载图片
    function loadImage(src) {
        const img = new Image();
        img.onload = function() {
            originalImage = img;
            imageLoaded = true;

            // 初始化Canvas
            initializeCanvas();

            // 显示编辑器
            uploadSection.style.display = 'none';
            editorSection.style.display = 'block';

            // 移除加载状态
            uploadSection.classList.remove('loading');

            // 更新UI
            updateUI();
            drawImage();
            drawPreview();
        };

        img.onerror = function() {
            alert('图片加载失败，请重试！');
            uploadSection.classList.remove('loading');
        };

        img.src = src;
    }

    // 初始化Canvas
    function initializeCanvas() {
        if (!originalImage) return;

        canvas = rotationCanvas;
        ctx = canvas.getContext('2d');

        // 初始化预览Canvas
        previewCtx = previewCanvas.getContext('2d');

        // 设置主Canvas尺寸 - 需要足够大以容纳旋转后的图片
        const maxWidth = 800;
        const maxHeight = 600;

        // 计算旋转后图片所需的尺寸
        const rotatedSize = calculateRotatedSize(originalImage.width, originalImage.height, 0);

        let { width, height } = calculateCanvasSize(rotatedSize.width, rotatedSize.height, maxWidth, maxHeight);

        canvas.width = width;
        canvas.height = height;

        // 设置Canvas在页面中的显示尺寸
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        // 设置预览Canvas尺寸为旋转后图片的完整尺寸
        const previewMaxSize = 300; // 预览区域最大尺寸
        let { width: previewWidth, height: previewHeight } = calculateCanvasSize(
            rotatedSize.width, rotatedSize.height, previewMaxSize, previewMaxSize
        );

        previewCanvas.width = previewWidth;
        previewCanvas.height = previewHeight;
        previewCanvas.style.width = previewWidth + 'px';
        previewCanvas.style.height = previewHeight + 'px';
    }

    // 计算旋转后图片所需的Canvas尺寸
    function calculateRotatedSize(imgWidth, imgHeight, angle) {
        const radian = (angle * Math.PI) / 180;
        const cos = Math.abs(Math.cos(radian));
        const sin = Math.abs(Math.sin(radian));

        // 计算旋转后图片的边界框尺寸
        const rotatedWidth = imgWidth * cos + imgHeight * sin;
        const rotatedHeight = imgWidth * sin + imgHeight * cos;

        return {
            width: Math.ceil(rotatedWidth),
            height: Math.ceil(rotatedHeight)
        };
    }

    // 计算Canvas合适尺寸
    function calculateCanvasSize(imgWidth, imgHeight, maxWidth, maxHeight) {
        let width = imgWidth;
        let height = imgHeight;

        // 如果图片太大，进行缩放
        if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
        }

        if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
        }

        return { width: Math.round(width), height: Math.round(height) };
    }

    // 绘制主显示图片
    function drawImage() {
        if (!ctx || !originalImage || !imageLoaded) return;

        // 重新计算Canvas尺寸以适应旋转
        const rotatedSize = calculateRotatedSize(originalImage.width, originalImage.height, currentRotation);
        const maxWidth = 800;
        const maxHeight = 600;
        const { width: newWidth, height: newHeight } = calculateCanvasSize(rotatedSize.width, rotatedSize.height, maxWidth, maxHeight);

        // 如果Canvas尺寸需要改变
        if (canvas.width !== newWidth || canvas.height !== newHeight) {
            canvas.width = newWidth;
            canvas.height = newHeight;
            canvas.style.width = newWidth + 'px';
            canvas.style.height = newHeight + 'px';
        }

        // 清空Canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 保存当前上下文
        ctx.save();

        // 移动到Canvas中心
        ctx.translate(canvas.width / 2, canvas.height / 2);

        // 应用旋转
        ctx.rotate((currentRotation * Math.PI) / 180);

        // 应用翻转
        ctx.scale(isFlippedHorizontal ? -1 : 1, isFlippedVertical ? -1 : 1);

        // 计算图片绘制尺寸，保持宽高比
        const scaleX = canvas.width / originalImage.width;
        const scaleY = canvas.height / originalImage.height;
        const scale = Math.min(scaleX, scaleY);

        const drawWidth = originalImage.width * scale;
        const drawHeight = originalImage.height * scale;

        // 绘制图片（中心对齐）
        ctx.drawImage(
            originalImage,
            -drawWidth / 2,
            -drawHeight / 2,
            drawWidth,
            drawHeight
        );

        // 恢复上下文
        ctx.restore();
    }

    // 绘制预览图片（1:1比例）
    function drawPreview() {
        if (!previewCtx || !originalImage || !imageLoaded) return;

        // 重新计算预览Canvas尺寸以适应旋转
        const rotatedSize = calculateRotatedSize(originalImage.width, originalImage.height, currentRotation);
        const previewMaxSize = 300;
        const { width: newWidth, height: newHeight } = calculateCanvasSize(rotatedSize.width, rotatedSize.height, previewMaxSize, previewMaxSize);

        // 如果预览Canvas尺寸需要改变
        if (previewCanvas.width !== newWidth || previewCanvas.height !== newHeight) {
            previewCanvas.width = newWidth;
            previewCanvas.height = newHeight;
            previewCanvas.style.width = newWidth + 'px';
            previewCanvas.style.height = newHeight + 'px';
        }

        // 清空预览Canvas
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

        // 保存当前上下文
        previewCtx.save();

        // 移动到预览Canvas中心
        previewCtx.translate(previewCanvas.width / 2, previewCanvas.height / 2);

        // 应用旋转
        previewCtx.rotate((currentRotation * Math.PI) / 180);

        // 应用翻转
        previewCtx.scale(isFlippedHorizontal ? -1 : 1, isFlippedVertical ? -1 : 1);

        // 计算图片绘制尺寸，保持宽高比，适应预览Canvas尺寸
        const scaleX = previewCanvas.width / originalImage.width;
        const scaleY = previewCanvas.height / originalImage.height;
        const scale = Math.min(scaleX, scaleY);

        const drawWidth = originalImage.width * scale;
        const drawHeight = originalImage.height * scale;

        // 绘制图片（中心对齐）
        previewCtx.drawImage(
            originalImage,
            -drawWidth / 2,
            -drawHeight / 2,
            drawWidth,
            drawHeight
        );

        // 恢复上下文
        previewCtx.restore();
    }

    // 旋转指定角度
    function rotateBy(angle) {
        if (!imageLoaded) return;

        currentRotation = (currentRotation + angle) % 360;
        updateUI();
        drawImage();
        drawPreview();
    }

    // 水平翻转
    function flipHorizontal() {
        if (!imageLoaded) return;

        isFlippedHorizontal = !isFlippedHorizontal;
        updateUI();
        drawImage();
        drawPreview();
    }

    // 垂直翻转
    function flipVertical() {
        if (!imageLoaded) return;

        isFlippedVertical = !isFlippedVertical;
        updateUI();
        drawImage();
        drawPreview();
    }

    // 重置旋转
    function resetRotation() {
        if (!imageLoaded) return;

        currentRotation = 0;
        isFlippedHorizontal = false;
        isFlippedVertical = false;
        updateUI();
        drawImage();
        drawPreview();
    }

    // 重置到上传状态
    function resetToUpload() {
        // 重置所有变量
        originalImage = null;
        currentRotation = 0;
        isFlippedHorizontal = false;
        isFlippedVertical = false;
        imageLoaded = false;

        // 清空Canvas
        if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        if (previewCtx && previewCanvas) {
            previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        }

        // 清空文件输入
        if (fileInput) {
            fileInput.value = '';
        }

        // 隐藏编辑器，显示上传区域
        editorSection.style.display = 'none';
        uploadSection.style.display = 'block';

        // 更新UI
        updateUI();
    }

    // 应用自定义角度
    function applyCustomAngle() {
        if (!imageLoaded) return;

        const angle = parseFloat(angleInput.value);
        if (isNaN(angle)) {
            alert('请输入有效的角度值！');
            return;
        }

        currentRotation = angle % 360;
        updateUI();
        drawImage();
        drawPreview();
    }

    // 验证角度输入
    function validateAngleInput() {
        const value = angleInput.value;
        const angle = parseFloat(value);

        if (isNaN(angle) || angle < -360 || angle > 360) {
            angleInput.setCustomValidity('请输入-360到360之间的有效数字');
        } else {
            angleInput.setCustomValidity('');
        }
    }

    // 更新UI状态
    function updateUI() {
        // 更新角度显示
        currentAngleSpan.textContent = currentRotation + '°';

        // 更新图片尺寸显示
        if (originalImage) {
            imageSizeSpan.textContent = originalImage.width + ' × ' + originalImage.height;
        }

        // 更新旋转状态
        let status = '未旋转';
        if (currentRotation !== 0) {
            status = '已旋转 ' + currentRotation + '°';
        }
        if (isFlippedHorizontal || isFlippedVertical) {
            status += (status !== '未旋转' ? '，' : '') +
                     (isFlippedHorizontal ? '水平翻转' : '') +
                     (isFlippedHorizontal && isFlippedVertical ? '，' : '') +
                     (isFlippedVertical ? '垂直翻转' : '');
        }

        rotationStatusSpan.textContent = status;
        rotationStatusSpan.className = status !== '未旋转' ? 'rotation-status-active' : 'rotation-status-inactive';

        // 更新角度输入框
        angleInput.value = currentRotation;

        // 启用/禁用按钮
        const buttons = [rotateLeftBtn, rotateRightBtn, flipHorizontalBtn, flipVerticalBtn, resetBtn, applyAngleBtn, downloadBtn];
        buttons.forEach(btn => {
            btn.disabled = !imageLoaded;
        });
    }

    // 下载图片
    function downloadImage() {
        if (!originalImage || !imageLoaded) {
            alert('请先上传图片！');
            return;
        }

        // 创建临时Canvas来生成完整的旋转图片
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        // 计算旋转后图片的完整尺寸
        const rotatedSize = calculateRotatedSize(originalImage.width, originalImage.height, currentRotation);

        tempCanvas.width = rotatedSize.width;
        tempCanvas.height = rotatedSize.height;

        // 清空临时Canvas
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

        // 保存上下文
        tempCtx.save();

        // 移动到Canvas中心
        tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);

        // 应用旋转
        tempCtx.rotate((currentRotation * Math.PI) / 180);

        // 应用翻转
        tempCtx.scale(isFlippedHorizontal ? -1 : 1, isFlippedVertical ? -1 : 1);

        // 绘制原始尺寸的图片（中心对齐）
        tempCtx.drawImage(
            originalImage,
            -originalImage.width / 2,
            -originalImage.height / 2,
            originalImage.width,
            originalImage.height
        );

        // 恢复上下文
        tempCtx.restore();

        // 创建下载链接
        const link = document.createElement('a');
        link.download = 'rotated_image_' + Date.now() + '.png';
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
    }

    // 工具函数：角度标准化
    function normalizeAngle(angle) {
        while (angle < 0) angle += 360;
        return angle % 360;
    }

    // 页面加载完成后初始化
    document.addEventListener('DOMContentLoaded', init);

    // 暴露一些方法供外部调用（可选）
    window.RotateTool = {
        reset: resetRotation,
        rotateBy: rotateBy,
        flipHorizontal: flipHorizontal,
        flipVertical: flipVertical
    };

})();
