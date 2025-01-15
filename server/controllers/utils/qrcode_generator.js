const {
    Worker, isMainThread, parentPort, workerData,
} = require('node:worker_threads');
const Campaign = require('../../models/Campaign');
const QRCode = require('qrcode');
const { jsPDF } = require('jspdf');
  
if (isMainThread) {
    module.exports = function generateQRCodes(campaignId, jwt_tokens) {
        return new Promise((resolve, reject) => {
            const worker = new Worker(__filename, {
                workerData: {
                    campaignId: campaignId,
                    jwt_tokens: jwt_tokens,
                },
            });
            worker.on('message', resolve);
            worker.on('error', reject);
            worker.on('exit', (code) => {
                if (code !== 0)
                    reject(new Error(`Worker stopped with exit code ${code}`));
            });
        });
    };
} else {
    const { campaignId, jwt_tokens } = workerData;
    console.log(campaignId);

    const generationWorker = async (campaignId, jwt_tokens) => {
        const pdf = new jsPDF();
        const qrCodeData = [];
        const qrCodeTexts = [];

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const qrSize = 100; // Size of each QR code
        const x = (pageWidth - qrSize) / 2;
        const y = (pageHeight - qrSize) / 2;        

        try {
            console.log("tokens length: ", jwt_tokens.length);
            for (const token of jwt_tokens) {
                // Generate QR code as data URL using the qrcode library
                const url = process.env.FRONTEND_URL + "redeem/" + token.token;
                const imageData = await QRCode.toDataURL(url);
                qrCodeData.push(imageData);
                qrCodeTexts.push(url);
            }

            qrCodeData.forEach((image, index) => {
				pdf.addImage(image, "JPEG", x, y, qrSize, qrSize);
            
                // Add text below the QR code
                pdf.setFontSize(12); // Optional: Set font size
                pdf.text(qrCodeTexts[index], x, y + qrSize + 10); // Adjust Y to place text below the image

				if (index != qrCodeData.length - 1){
					pdf.addPage();
                }
            });
            
            // qrCodeData.forEach((image, index) => {
            //     // Add the QR code image
            //     pdf.addImage(image, "JPEG", x, y, qrSize, qrSize);
            
            //     // Add text below the QR code
            //     pdf.setFontSize(12); // Optional: Set font size
            //     pdf.text(QR Code ${index + 1}, x, y + qrSize + 10); // Adjust Y to place text below the image
            
            //     // Add a new page if not the last QR code
            //     if (index !== qrCodeData.length - 1) {
            //         pdf.addPage();
            //     }
            // });

            const fileName = String(campaignId) + '_qr_codes.pdf';
            pdf.save("qr_codes/" + fileName);
            console.log("PDF file saved as:", fileName);
            parentPort.postMessage(fileName);
        } catch (error) {
            console.error("Error generating QR codes or PDF:", error);
            parentPort.postMessage(null);
        }
    }

    generationWorker(campaignId, jwt_tokens);
} 