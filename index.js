import pdfMerger from 'pdf-merger-js';
import fs from 'fs';

const merger = new pdfMerger();
const files = [
  {
    filename: 'file-1.pdf',
  },
  {
    filename: 'file-2.pdf',
  },
  {
    filename: 'file-3.pdf',
    pages: 1,
  },
];

/**
 * @param {Array} files
 */
function loadFilesBuffer(files) {
  return files.map((file) => {
    return {
      buffer: Buffer.from(fs.readFileSync(file.filename), 'base64'),
      pages: file.pages,
    };
  });
}

(async () => {
  const buffers = loadFilesBuffer(files);
  await Promise.all(
    buffers.map(async (buffer) => {
      buffer.pages
        ? await merger.add(buffer.buffer, buffer.pages)
        : await merger.add(buffer.buffer);
    })
  );

  // buffer can be saved as a file or upload to s3
  const buffer = await merger.saveAsBuffer();
  fs.writeFileSync('./merged-buffer.pdf', buffer);
})();
