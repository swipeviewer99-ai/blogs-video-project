const { BlobServiceClient } = require('@azure/storage-blob');
const fs = require('fs');
const ExcelJS = require('exceljs');   // npm install exceljs

// Replace with your connection string
const AZURE_STORAGE_CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=seovid;AccountKey=A9lkZz7EomrAFf2bVUH8kbnc3jZMM18L6rSffERcrtgoDoK5O9R1lf3L+b/HmUI1sY9E+edUALOP+AStqPOJMQ==;EndpointSuffix=core.windows.net";

// Excel file name
const EXCEL_FILE = "assets/SEOVideos.xlsx";

async function uploadVideo(containerName, filePath, metadata) {
  // Create BlobServiceClient
  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);

  // Get container client
  const containerClient = blobServiceClient.getContainerClient(containerName);

  // Ensure container exists
  await containerClient.createIfNotExists({ access: 'container' });

  // Extract filename as blob name
  const blobName = filePath.split(/[/\\]/).pop();  // works for both / and \
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  // Upload file
  const uploadBlobResponse = await blockBlobClient.uploadFile(filePath);
  console.log(`✅ Upload successful: ${blobName} - RequestId: ${uploadBlobResponse.requestId}`);

  // Blob URL
  const blobUrl = blockBlobClient.url;
  console.log(`🌐 Blob URL: ${blobUrl}`);

  // Save blob URL to Excel
  await saveUrlToExcel(metadata, blobUrl);
}

async function saveUrlToExcel(meta, blobUrl) {
  const workbook = new ExcelJS.Workbook();

  // Load existing Excel file
  if (!fs.existsSync(EXCEL_FILE)) {
    throw new Error(`Excel file ${EXCEL_FILE} not found`);
  }
  await workbook.xlsx.readFile(EXCEL_FILE);

  // Assume data is in first sheet
  const worksheet = workbook.worksheets[0];

  // Generate next Id (assuming Id is numeric, in first column)
  let lastRow = worksheet.lastRow;
  let nextId = 1;
  if (lastRow && lastRow.getCell(1).value) {
    nextId = parseInt(lastRow.getCell(1).value) + 1;
  }

  // Append row
  worksheet.addRow([
    nextId,             // Id
    meta.Title || "",   // Title
    JSON.stringify(meta.Skills) || "",  // Skills
    meta.PreviewImageUrl || "", // PreviewImageUrl
    blobUrl             // BlobUrl
  ]);

  // Save file
  await workbook.xlsx.writeFile(EXCEL_FILE);
  console.log(`📒 Excel updated: ${EXCEL_FILE}`);
}

module.exports = {
  uploadVideo
};

// Example usage
/*
const filePath = `output/final_video_v1.mp4`;
const meta = {
  title: "SEO Tutorial Part 1",
  skills: "SEO, Marketing",
  preview: "https://example.com/preview1.png"
};

uploadVideo("seo-videos", filePath, meta).catch(console.error);
*/

// Example usage
// const filePath = `output/final_video_v${iteration}.mp4`;
// uploadVideo("seo-videos", filePath).catch(console.error);
