// EXIF信息查看工具主脚本
(function() {
    'use strict';

    // DOM元素引用
    const fileInput = document.getElementById('fileInput');
    const exifSection = document.getElementById('exifSection');
    const uploadSection = document.querySelector('.upload-section');
    const previewImage = document.getElementById('previewImage');
    const exifDataEl = document.getElementById('exifData');
    const rawExifPre = document.getElementById('rawExif');
    const exifSummaryEl = document.getElementById('exifSummary');

    // 当前上传文件信息（name/type/size）
    let currentFileInfo = null;

    // 初始化函数
    function init() {
        setupEventListeners();
    }

    // 设置事件监听器
    function setupEventListeners() {
        // 文件上传
        fileInput.addEventListener('change', handleFileUpload);

        // 拖拽上传
        setupDragAndDrop();
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
            showError('请上传图片文件！');
            return;
        }

        // 清理之前显示的状态，允许重复上传同一文件
        if (previewImage && previewImage.dataset && previewImage.dataset.objectUrl) {
            try { URL.revokeObjectURL(previewImage.dataset.objectUrl); } catch(e) {}
            previewImage.dataset.objectUrl = '';
        }
        if (previewImage) previewImage.src = '';
        if (exifDataEl) exifDataEl.innerHTML = '';
        if (rawExifPre) rawExifPre.textContent = '';
        if (exifSummaryEl) exifSummaryEl.innerHTML = '';

        // 保存当前文件信息，供摘要显示使用
        currentFileInfo = {
            name: file.name || '',
            type: file.type || '',
            size: file.size || 0
        };

        // 显示加载状态
        uploadSection.classList.add('loading');

        const reader = new FileReader();
        reader.onload = function(e) {
            processImage(e.target.result);
        };
        reader.readAsArrayBuffer(file);
    }

    // 处理图片并提取EXIF信息
    async function processImage(arrayBuffer) {
        try {
            // 创建图片预览
            const blob = new Blob([arrayBuffer]);
            const imageUrl = URL.createObjectURL(blob);
            previewImage.src = imageUrl;
            // 保存 objectUrl 以便清理
            previewImage.dataset.objectUrl = imageUrl;

            // 等待图片加载完成
            await new Promise((resolve) => {
                previewImage.onload = resolve;
            });

            // 尝试提取EXIF信息（任何错误都不应该阻塞图片显示）
            let parsedExif = {};
            try {
                parsedExif = extractEXIF(arrayBuffer) || {};
            } catch (ex) {
                console.warn('EXIF 解析失败：', ex);
                parsedExif = {};
            }

            // 如果EXIF中没有像素信息，补充使用图片自然尺寸（保证摘要能显示尺寸）
            if (!parsedExif.PixelXDimension || !parsedExif.PixelYDimension) {
                parsedExif.PixelXDimension = previewImage.naturalWidth || parsedExif.PixelXDimension;
                parsedExif.PixelYDimension = previewImage.naturalHeight || parsedExif.PixelYDimension;
            }

            // 显示EXIF信息和摘要（即使解析失败也继续显示预览与文件信息）
            displaySummary(parsedExif, currentFileInfo, previewImage);
            displayEXIFInfo(parsedExif);
            displayRawEXIF(parsedExif);

            // 显示EXIF区域，隐藏上传区域
            uploadSection.style.display = 'none';
            exifSection.style.display = 'block';

            // 移除加载状态
            uploadSection.classList.remove('loading');

        } catch (error) {
            console.error('处理图片时出错:', error);
            // 更友好的错误提示：若是 EXIF 解析错误则提示可能无 EXIF 或文件不支持
            const msg = /JPEG|Exif|parse/i.test(String(error)) ?
                '图片已加载，但无法解析 EXIF 数据（可能该图片不包含 EXIF 或已被移除）。' :
                '处理图片时出现错误，请尝试使用其他图片或刷新页面。';
            showError(msg);
            // 确保上传区的 loading 状态移除（但保留预览如果已经加载）
            uploadSection.classList.remove('loading');
        }
    }

    // 提取EXIF信息
    function extractEXIF(arrayBuffer) {
        const dataView = new DataView(arrayBuffer);
        let offset = 0;

        try {
            // 检查是否是JPEG文件（若不是则直接返回空，不抛出）
            if (dataView.byteLength < 2 || dataView.getUint16(0) !== 0xFFD8) {
                return {};
            }

            // 查找EXIF数据（APP1 标记 0xFFE1）
            while (offset < dataView.byteLength - 4) {
                const marker = dataView.getUint16(offset);
                if (marker === 0xFFE1) {
                    // APP1 长度字段在 marker 之后两字节
                    const exifOffset = offset + 4; // 跳过APP1标记和长度字段
                    try {
                        return parseEXIFData(dataView, exifOffset);
                    } catch (e) {
                        console.warn('parseEXIFData failed', e);
                        return {};
                    }
                }
                offset += 2;
            }
        } catch (e) {
            console.warn('extractEXIF error', e);
            return {};
        }

        // 如果没有找到EXIF数据，返回空对象
        return {};
    }

    // 解析EXIF数据
    function parseEXIFData(dataView, offset) {
        const exifData = {};

        try {
            // 检查EXIF头
            const exifHeader = String.fromCharCode(
                dataView.getUint8(offset),
                dataView.getUint8(offset + 1),
                dataView.getUint8(offset + 2),
                dataView.getUint8(offset + 3),
                dataView.getUint8(offset + 4),
                dataView.getUint8(offset + 5)
            );

            if (exifHeader !== 'Exif\x00\x00') {
                return exifData;
            }

            const tiffOffset = offset + 6;

            // 检查字节顺序
            const isLittleEndian = dataView.getUint16(tiffOffset) === 0x4949;

            // 查找IFD0
            const ifd0Offset = dataView.getUint32(tiffOffset + 4, isLittleEndian);

            // 解析IFD0
            parseIFD(dataView, tiffOffset + ifd0Offset, isLittleEndian, exifData);

            // 查找EXIF子IFD
            if (exifData.ExifIFDPointer) {
                parseIFD(dataView, tiffOffset + exifData.ExifIFDPointer, isLittleEndian, exifData, 'exif');
            }

            // 查找GPS IFD
            if (exifData.GPSInfoIFDPointer) {
                parseIFD(dataView, tiffOffset + exifData.GPSInfoIFDPointer, isLittleEndian, exifData, 'gps');
            }

        } catch (error) {
            console.error('解析EXIF数据时出错:', error);
        }

        return exifData;
    }

    // 解析IFD (Image File Directory)
    function parseIFD(dataView, offset, isLittleEndian, exifData, section = '') {
        // 安全检查：确保偏移在范围内
        if (offset + 2 > dataView.byteLength) return;
        const numEntries = dataView.getUint16(offset, isLittleEndian);
        offset += 2;

        for (let i = 0; i < numEntries; i++) {
            // 每一条目占 12 字节，安全检查
            if (offset + 12 > dataView.byteLength) break;
            const tag = dataView.getUint16(offset, isLittleEndian);
            const type = dataView.getUint16(offset + 2, isLittleEndian);
            const count = dataView.getUint32(offset + 4, isLittleEndian);
            const valueOffset = dataView.getUint32(offset + 8, isLittleEndian);

            // 计算实际值位置（如果数据超出则跳过）
            let value = null;
            try {
                value = getTagValue(dataView, offset + 8, type, count, isLittleEndian);
            } catch (e) {
                console.warn('getTagValue error for tag', tag, e);
                value = null;
            }
            const tagName = getTagName(tag, section);

            if (tagName && value !== null) {
                exifData[tagName] = value;
            }

            offset += 12;
        }
    }

    // 获取标签值
    function getTagValue(dataView, offset, type, count, isLittleEndian) {
        switch (type) {
            case 1: // BYTE
            case 3: // SHORT
            case 4: // LONG
                if (count === 1) {
                    return dataView.getUint32(offset, isLittleEndian);
                }
                break;
            case 2: // ASCII
                let str = '';
                for (let i = 0; i < count - 1; i++) {
                    str += String.fromCharCode(dataView.getUint8(offset + i));
                }
                return str;
            case 5: // RATIONAL
                if (count === 1) {
                    const numerator = dataView.getUint32(offset, isLittleEndian);
                    const denominator = dataView.getUint32(offset + 4, isLittleEndian);
                    return numerator / denominator;
                }
                break;
            case 10: // SRATIONAL
                if (count === 1) {
                    const numerator = dataView.getInt32(offset, isLittleEndian);
                    const denominator = dataView.getUint32(offset + 4, isLittleEndian);
                    return numerator / denominator;
                }
                break;
        }
        return null;
    }

    // 获取标签名称
    function getTagName(tag, section = '') {
        const tagNames = {
            // IFD0 主图像标签
            0x010E: 'ImageDescription',
            0x010F: 'Make',              // 制造商
            0x0110: 'Model',             // 型号
            0x0112: 'Orientation',       // 方向
            0x011A: 'XResolution',       // X分辨率
            0x011B: 'YResolution',       // Y分辨率
            0x0128: 'ResolutionUnit',    // 分辨率单位
            0x0131: 'Software',          // 软件
            0x0132: 'DateTime',          // 修改时间
            0x013B: 'Artist',            // 作者
            0x0213: 'YCbCrPositioning',
            0x8769: 'ExifIFDPointer',    // EXIF子IFD指针
            0x8825: 'GPSInfoIFDPointer', // GPS IFD指针

            // EXIF子IFD标签
            exif: {
                0x829A: 'ExposureTime',     // 曝光时间
                0x829D: 'FNumber',          // 光圈值
                0x8822: 'ExposureProgram',  // 曝光程序
                0x8824: 'SpectralSensitivity',
                0x8827: 'ISOSpeedRatings',  // ISO感光度
                0x8828: 'OECF',
                0x8830: 'SensitivityType',
                0x8831: 'StandardOutputSensitivity',
                0x8832: 'RecommendedExposureIndex',
                0x8833: 'ISOSpeed',
                0x8834: 'ISOSpeedLatitudeyyy',
                0x8835: 'ISOSpeedLatitudezzz',
                0x9000: 'ExifVersion',      // EXIF版本
                0x9003: 'DateTimeOriginal', // 原始拍摄时间
                0x9004: 'DateTimeDigitized', // 数字化时间
                0x9101: 'ComponentsConfiguration',
                0x9102: 'CompressedBitsPerPixel',
                0x9201: 'ShutterSpeedValue', // 快门速度
                0x9202: 'ApertureValue',    // 光圈值
                0x9203: 'BrightnessValue',  // 亮度值
                0x9204: 'ExposureBiasValue', // 曝光补偿
                0x9205: 'MaxApertureValue', // 最大光圈
                0x9206: 'SubjectDistance',  // 对焦距离
                0x9207: 'MeteringMode',     // 测光模式
                0x9208: 'LightSource',      // 光源
                0x9209: 'Flash',            // 闪光灯
                0x920A: 'FocalLength',      // 焦距
                0x9214: 'SubjectArea',
                0x927C: 'MakerNote',
                0x9286: 'UserComment',
                0x9290: 'SubSecTime',       // 子秒时间
                0x9291: 'SubSecTimeOriginal',
                0x9292: 'SubSecTimeDigitized',
                0xA000: 'FlashpixVersion',
                0xA001: 'ColorSpace',       // 色彩空间
                0xA002: 'PixelXDimension',  // 像素X维度
                0xA003: 'PixelYDimension',  // 像素Y维度
                0xA004: 'RelatedSoundFile',
                0xA005: 'InteroperabilityIFDPointer',
                0xA20B: 'FlashEnergy',
                0xA20C: 'SpatialFrequencyResponse',
                0xA20E: 'FocalPlaneXResolution',
                0xA20F: 'FocalPlaneYResolution',
                0xA210: 'FocalPlaneResolutionUnit',
                0xA214: 'SubjectLocation',
                0xA215: 'ExposureIndex',
                0xA217: 'SensingMethod',
                0xA300: 'FileSource',
                0xA301: 'SceneType',
                0xA302: 'CFAPattern',
                0xA401: 'CustomRendered',
                0xA402: 'ExposureMode',
                0xA403: 'WhiteBalance',     // 白平衡
                0xA404: 'DigitalZoomRatio',
                0xA405: 'FocalLengthIn35mmFilm',
                0xA406: 'SceneCaptureType',
                0xA407: 'GainControl',
                0xA408: 'Contrast',         // 对比度
                0xA409: 'Saturation',       // 饱和度
                0xA40A: 'Sharpness',        // 锐度
                0xA40B: 'DeviceSettingDescription',
                0xA40C: 'SubjectDistanceRange',
                0xA420: 'ImageUniqueID'
            },

            // GPS标签
            gps: {
                0x0000: 'GPSVersionID',
                0x0001: 'GPSLatitudeRef',       // 纬度参考
                0x0002: 'GPSLatitude',          // 纬度
                0x0003: 'GPSLongitudeRef',      // 经度参考
                0x0004: 'GPSLongitude',         // 经度
                0x0005: 'GPSAltitudeRef',       // 海拔参考
                0x0006: 'GPSAltitude',          // 海拔
                0x0007: 'GPSTimeStamp',         // GPS时间戳
                0x0008: 'GPSSatellites',        // GPS卫星
                0x0009: 'GPSStatus',            // GPS状态
                0x000A: 'GPSMeasureMode',       // GPS测量模式
                0x000B: 'GPSDOP',               // GPS精度
                0x000C: 'GPSSpeedRef',          // GPS速度参考
                0x000D: 'GPSSpeed',             // GPS速度
                0x000E: 'GPSTrackRef',          // GPS跟踪参考
                0x000F: 'GPSTrack',             // GPS跟踪
                0x0010: 'GPSImgDirectionRef',   // GPS图像方向参考
                0x0011: 'GPSImgDirection',      // GPS图像方向
                0x0012: 'GPSMapDatum',          // GPS地图基准
                0x0013: 'GPSDestLatitudeRef',
                0x0014: 'GPSDestLatitude',
                0x0015: 'GPSDestLongitudeRef',
                0x0016: 'GPSDestLongitude',
                0x0017: 'GPSDestBearingRef',
                0x0018: 'GPSDestBearing',
                0x0019: 'GPSDestDistanceRef',
                0x001A: 'GPSDestDistance',
                0x001B: 'GPSProcessingMethod',
                0x001C: 'GPSAreaInformation',
                0x001D: 'GPSDateStamp',         // GPS日期戳
                0x001E: 'GPSDifferential'
            }
        };

        if (section && tagNames[section] && tagNames[section][tag]) {
            return tagNames[section][tag];
        } else if (!section && tagNames[tag]) {
            return tagNames[tag];
        }

        return null;
    }

    // 显示EXIF信息
    function displayEXIFInfo(data) {
        if (!exifDataEl) return;
        exifDataEl.innerHTML = '';

        // 如果没有EXIF数据
        if (Object.keys(data).length === 0) {
            exifData.innerHTML = `
                <div class="no-exif">
                    <div class="no-exif-icon">📷</div>
                    <h4>未找到EXIF信息</h4>
                    <p>这张图片可能没有包含EXIF元数据，或者EXIF数据已被移除。</p>
                </div>
            `;
            return;
        }

        // 定义信息分组和显示顺序
        const infoGroups = [
            {
                title: '📷 拍摄信息',
                fields: [
                    'Make', 'Model', 'Software', 'DateTimeOriginal', 'DateTimeDigitized',
                    'ExposureTime', 'FNumber', 'ISOSpeedRatings', 'FocalLength',
                    'ExposureProgram', 'MeteringMode', 'Flash', 'WhiteBalance'
                ]
            },
            {
                title: '🎨 图像属性',
                fields: [
                    'PixelXDimension', 'PixelYDimension', 'ColorSpace', 'Orientation',
                    'XResolution', 'YResolution', 'ResolutionUnit'
                ]
            },
            {
                title: '📍 GPS信息',
                fields: [
                    'GPSLatitude', 'GPSLongitude', 'GPSAltitude', 'GPSDateStamp', 'GPSTimeStamp'
                ]
            },
            {
                title: '📝 其他信息',
                fields: [
                    'Artist', 'ImageDescription', 'Copyright', 'ImageUniqueID'
                ]
            }
        ];

        // 为每个组创建内容
        infoGroups.forEach(group => {
            const groupFields = group.fields.filter(field => data[field] !== undefined);

            if (groupFields.length > 0) {
                const groupDiv = document.createElement('div');
                groupDiv.className = 'exif-group';
                groupDiv.innerHTML = `<h4>${group.title}</h4>`;

                groupFields.forEach(field => {
                    const value = formatEXIFValue(field, data[field]);
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'exif-item';
                    itemDiv.innerHTML = `
                        <div class="exif-label">${getFieldDisplayName(field)}</div>
                        <div class="exif-value">${value}</div>
                    `;
                    groupDiv.appendChild(itemDiv);
                });

                exifDataEl.appendChild(groupDiv);
            }
        });
    }

    // 显示摘要信息（顶部）
    function displaySummary(data, fileInfo, imgElement) {
        if (!exifSummaryEl) return;

        // 简要字段
        const device = (data.Make || '') + (data.Model ? (' ' + data.Model) : '');
        const exposure = `快门:${data.ExposureTime || '未知'} / 光圈:${data.FNumber || '未知'} / 感光度:${data.ISOSpeedRatings || '未知'} / 焦距:${data.FocalLength || '未知'}`;
        const modeFlash = `${getFieldDisplayName('ExposureProgram')}: ${formatEXIFValue('ExposureProgram', data.ExposureProgram)} / 闪光灯: ${formatEXIFValue('Flash', data.Flash)}`;
        const shotTime = data.DateTimeOriginal || data.DateTimeDigitized || data.DateTime || '未知';

        // 使用图片自然尺寸优先
        const px = data.PixelXDimension || (imgElement && imgElement.naturalWidth) || '?';
        const py = data.PixelYDimension || (imgElement && imgElement.naturalHeight) || '?';
        const dimensions = (px && py) ? `${px} x ${py} 像素` : '未知';

        // 计算百万像素数
        let megapixels = '未知';
        if (px && py && px !== '?' && py !== '?') {
            const mp = (px * py) / 1000000;
            megapixels = `${Math.round(mp * 10) / 10} 万像素`;
        }

        const resolution = (data.XResolution && data.YResolution) ? `${data.XResolution} × ${data.YResolution}` : megapixels;
        const orientation = getOrientationText(data.Orientation);

        // 其他参数
        const otherParams = `白平衡: ${formatEXIFValue('WhiteBalance', data.WhiteBalance)} / 曝光补偿: ${data.ExposureBiasValue || '未知'} / 色彩空间: ${formatEXIFValue('ColorSpace', data.ColorSpace)}`;

        // 文件信息
        const fileLine = fileInfo ? `${fileInfo.name || ''}, 类型:${fileInfo.type || ''}, 文件大小:${formatFileSize(fileInfo.size || 0)}` : '';

        exifSummaryEl.innerHTML = `
            <div class="summary-title">照片信息摘要</div>
            <div class="summary-row"><div class="summary-label">设备：</div><div class="summary-value">${device || '<span class="muted">未知</span>'}</div></div>
            <div class="summary-row"><div class="summary-label">曝光参数：</div><div class="summary-value">${exposure || '<span class="muted">未知</span>'}</div></div>
            <div class="summary-row"><div class="summary-label">拍摄模式/闪光：</div><div class="summary-value">${modeFlash || '<span class="muted">未知</span>'}</div></div>
            <div class="summary-row"><div class="summary-label">其他参数：</div><div class="summary-value">${otherParams || '<span class="muted">未知</span>'}</div></div>
            <div class="summary-row"><div class="summary-label">拍摄时间：</div><div class="summary-value">${shotTime || '<span class="muted">未知</span>'}</div></div>
            <div class="summary-row"><div class="summary-label">文件名：</div><div class="summary-value">${fileLine || '<span class="muted">未知</span>'}</div></div>
            <div class="summary-row"><div class="summary-label">尺寸宽x高：</div><div class="summary-value">${dimensions || '<span class="muted">未知</span>'}</div></div>
            <div class="summary-row"><div class="summary-label">分辨率/像素：</div><div class="summary-value">${resolution || '<span class="muted">未知</span>'}</div></div>
            <div class="summary-row"><div class="summary-label">方向：</div><div class="summary-value">${orientation || '<span class="muted">未知</span>'}</div></div>
        `;
    }

    // 显示原始EXIF JSON
    function displayRawEXIF(data) {
        if (!rawExifPre) return;
        rawExifPre.textContent = JSON.stringify(data, null, 2);
    }

    // 格式化文件大小
    function formatFileSize(bytes) {
        if (!bytes) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        let i = 0;
        let v = bytes;
        while (v >= 1024 && i < units.length - 1) {
            v /= 1024;
            i++;
        }
        return `${Math.round(v * 10) / 10} ${units[i]}`;
    }

    // 格式化EXIF值
    function formatEXIFValue(field, value) {
        if (value === null || value === undefined) return '未知';

        switch (field) {
            case 'ExposureTime':
                return `1/${Math.round(1 / value)} 秒`;
            case 'FNumber':
                return `f/${value}`;
            case 'FocalLength':
                return `${value} mm`;
            case 'GPSLatitude':
            case 'GPSLongitude':
                return formatGPSCoordinate(value);
            case 'GPSAltitude':
                return `${value} m`;
            case 'DateTimeOriginal':
            case 'DateTimeDigitized':
            case 'DateTime':
            case 'GPSDateStamp':
                return formatDateTime(value);
            case 'Orientation':
                return getOrientationText(value);
            case 'ColorSpace':
                return value === 1 ? 'sRGB' : value === 2 ? 'Adobe RGB' : value.toString();
            case 'Flash':
                return getFlashText(value);
            case 'WhiteBalance':
                return value === 0 ? '自动' : '手动';
            case 'ExposureProgram':
                return getExposureProgramText(value);
            case 'MeteringMode':
                return getMeteringModeText(value);
            default:
                return value.toString();
        }
    }

    // 获取字段显示名称
    function getFieldDisplayName(field) {
        const names = {
            'Make': '制造商',
            'Model': '型号',
            'Software': '软件',
            'DateTimeOriginal': '拍摄时间',
            'DateTimeDigitized': '数字化时间',
            'DateTime': '修改时间',
            'ExposureTime': '曝光时间',
            'FNumber': '光圈',
            'ISOSpeedRatings': 'ISO',
            'FocalLength': '焦距',
            'ExposureProgram': '曝光程序',
            'MeteringMode': '测光模式',
            'Flash': '闪光灯',
            'WhiteBalance': '白平衡',
            'PixelXDimension': '宽度',
            'PixelYDimension': '高度',
            'ColorSpace': '色彩空间',
            'Orientation': '方向',
            'XResolution': 'X分辨率',
            'YResolution': 'Y分辨率',
            'ResolutionUnit': '分辨率单位',
            'GPSLatitude': '纬度',
            'GPSLongitude': '经度',
            'GPSAltitude': '海拔',
            'GPSDateStamp': 'GPS日期',
            'GPSTimeStamp': 'GPS时间',
            'Artist': '作者',
            'ImageDescription': '图像描述',
            'Copyright': '版权',
            'ImageUniqueID': '图像ID'
        };

        return names[field] || field;
    }

    // 格式化GPS坐标
    function formatGPSCoordinate(value) {
        if (!Array.isArray(value) || value.length !== 3) return '未知';

        const degrees = value[0];
        const minutes = value[1];
        const seconds = value[2];

        return `${degrees}° ${minutes}' ${seconds}"`;
    }

    // 格式化日期时间
    function formatDateTime(value) {
        if (typeof value !== 'string') return value;

        // EXIF日期时间格式: "YYYY:MM:DD HH:MM:SS"
        const match = value.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
        if (match) {
            const [, year, month, day, hour, minute, second] = match;
            return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
        }

        return value;
    }

    // 获取方向文本
    function getOrientationText(value) {
        const orientations = {
            1: '正常',
            2: '水平翻转',
            3: '旋转180°',
            4: '垂直翻转',
            5: '顺时针90° + 水平翻转',
            6: '顺时针90°',
            7: '顺时针90° + 垂直翻转',
            8: '逆时针90°'
        };
        return orientations[value] || value.toString();
    }

    // 获取闪光灯文本
    function getFlashText(value) {
        const flashModes = {
            0: '未闪光',
            1: '闪光',
            5: '闪光，但未检测到',
            7: '闪光，强制模式',
            9: '闪光，自动模式',
            13: '闪光，自动模式，红眼消除',
            15: '闪光，自动模式，红眼消除，强制模式',
            16: '未闪光，强制模式',
            24: '未闪光，自动模式',
            25: '闪光，自动模式',
            29: '闪光，自动模式，红眼消除',
            31: '闪光，强制模式，红眼消除',
            32: '未闪光',
            65: '闪光，红眼消除',
            69: '闪光，自动模式，红眼消除',
            71: '闪光，自动模式，红眼消除，强制模式',
            73: '闪光，强制模式，红眼消除',
            77: '闪光，强制模式',
            79: '闪光，强制模式，红眼消除',
            89: '闪光，自动模式',
            93: '闪光，自动模式，红眼消除，强制模式',
            95: '闪光，强制模式，红眼消除'
        };
        return flashModes[value] || value.toString();
    }

    // 获取曝光程序文本
    function getExposureProgramText(value) {
        const programs = {
            0: '未定义',
            1: '手动',
            2: '正常程序',
            3: '光圈优先',
            4: '快门优先',
            5: '创意程序',
            6: '动作程序',
            7: '肖像模式',
            8: '风景模式'
        };
        return programs[value] || value.toString();
    }

    // 获取测光模式文本
    function getMeteringModeText(value) {
        const modes = {
            0: '未知',
            1: '平均测光',
            2: '中央重点平均测光',
            3: '点测光',
            4: '多点测光',
            5: '评估测光',
            6: '局部测光',
            255: '其他'
        };
        return modes[value] || value.toString();
    }

    // 显示错误信息
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <h4>❌ 处理失败</h4>
            <p>${message}</p>
        `;

        // 移除之前的错误信息
        const existingError = uploadSection.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        uploadSection.appendChild(errorDiv);
        uploadSection.classList.remove('loading');
    }

    // 重置到上传界面，允许再次上传同一张图片
    function resetToUpload() {
        // 清理预览资源
        if (previewImage && previewImage.dataset && previewImage.dataset.objectUrl) {
            try { URL.revokeObjectURL(previewImage.dataset.objectUrl); } catch(e) {}
            previewImage.dataset.objectUrl = '';
        }
        if (previewImage) previewImage.src = '';
        if (exifDataEl) exifDataEl.innerHTML = '';
        if (rawExifPre) rawExifPre.textContent = '';
        if (exifSummaryEl) exifSummaryEl.innerHTML = '';

        // 清空文件输入
        if (fileInput) fileInput.value = '';

        // 显示上传区域，隐藏EXIF区域
        if (uploadSection) uploadSection.style.display = 'block';
        if (exifSection) exifSection.style.display = 'none';
    }

    // 绑定上传新图按钮事件（在页面DOMContentLoaded期间 init 会被调用）
    document.addEventListener('DOMContentLoaded', function() {
        const uploadNewBtn = document.getElementById('uploadNewBtn');
        if (uploadNewBtn) uploadNewBtn.addEventListener('click', resetToUpload);
    });

    // 页面加载完成后初始化
    document.addEventListener('DOMContentLoaded', init);

})();
