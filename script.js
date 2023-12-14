// 處理圖片的主要邏輯，這需要根據您的具體需求進一步開發
// import "jszip\\dist\\zip.js"
// 檢查特定高度範圍內的像素是否都接近白色
function check(canvas, ctx, start) {
    const imageData = ctx.getImageData(0, start, canvas.width, 30).data;
    for (let i = 0; i < imageData.length; i += 4) {
        if (imageData[i] < 170 || imageData[i + 1] < 170 || imageData[i + 2] < 170) {
            return 1;
        }
        if (start + Math.floor(i / 4 / canvas.width) >= canvas.height) {
            return 1;
        }
    }
    return start + 15;
}

// 尋找圖片中符合條件的切割點
function findCutPoints(canvas, ctx, leastTall) {
    let tall = canvas.height;
    let tmp = [0];
    let x = leastTall;

    while (x < tall) {
        let flag = check(canvas, ctx, x);
        if (flag !== 1) {
            tmp.push(flag);
            x = flag + leastTall;
        } else {
            x += 20;
        }
    }
    if (tmp.length > 2 && (tall - tmp[tmp.length - 1]) < 1200) {
        tmp.pop();
    }
    return tmp;
}

// 將圖片切割並打包成zip檔案
async function cutAndZipImage(canvas, cutPoints, zipFilename,startpage) {
    const zip = new JSZip();

    for (let i = 1; i < cutPoints.length; i++) {
        const cropCanvas = document.createElement('canvas');
        const cropCtx = cropCanvas.getContext('2d');
        const height = cutPoints[i] - cutPoints[i - 1];
        const width = canvas.width;

        cropCanvas.width = width;
        cropCanvas.height = height;
        cropCtx.drawImage(canvas, 0, cutPoints[i - 1], width, height, 0, 0, width, height);

        const blob = await new Promise(resolve => cropCanvas.toBlob(resolve));
        zip.file(`image_${i+startpage-1}.png`, blob);
    }

    // 生成ZIP檔案並提供下載鏈接
    zip.generateAsync({type: "blob"}).then(function(content) {
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(content);
        downloadLink.download = zipFilename;
        downloadLink.click();
    });
}




// 處理圖片的入口函數
async function processImage(file, leastTall, zipFilename,startpage) {
    const reader = new FileReader();
    reader.onload = async function(event) {
        const img = new Image();
        img.onload = async function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            console.log(canvas.width,canvas.height);
            ctx.drawImage(img, 0, 0);

            // 使用灰度圖像進行切割點檢測
            const grayCanvas = document.createElement('canvas');
            const grayCtx = grayCanvas.getContext('2d');
            grayCanvas.width = img.width;
            grayCanvas.height = img.height;
            grayCtx.drawImage(img, 0, 0);
            grayCtx.globalCompositeOperation = 'color';
            grayCtx.fillStyle = 'white';
            grayCtx.fillRect(0, 0, grayCanvas.width, grayCanvas.height);

            const cutPoints = findCutPoints(grayCanvas, grayCtx, leastTall);
            console.log(cutPoints);
            await cutAndZipImage(canvas, cutPoints, zipFilename,startpage);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}
