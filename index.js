import pdfMerger from 'pdf-merger-js';
import fs from 'fs';
import now from 'performance-now';

// max pages file-3.pdf is 21
const files = [
  {
    filename: 'file-1.pdf',
  },
  {
    filename: 'file-2.pdf',
  },
  {
    filename: 'file-3.pdf',
    pages: '1-5',
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

async function mergePdf(files) {
  const buffers = loadFilesBuffer(files);
  const merger = new pdfMerger();
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
}

function formatBytes(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  if (bytes === 0) return '0 Byte';

  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));

  return Math.round(100 * (bytes / Math.pow(1024, i))) / 100 + ' ' + sizes[i];
}

(async () => {
  const iterations = 100;
  let totalElapsedTime = 0;
  let totalCpuUsageUser = 0;
  let totalCpuUsageSystem = 0;
  let totalMemoryUsageRss = 0;
  let totalMemoryUsageHeapUsed = 0;

  for (let i = 0; i < iterations; i++) {
    const start = now();

    mergePdf(files);

    const end = now();

    // Calculate time taken
    const elapsedSeconds = (end - start) / 1000;
    totalElapsedTime += elapsedSeconds;

    // Accumulate CPU and memory usage
    const cpuUsage = process.cpuUsage();
    totalCpuUsageUser += cpuUsage.user;
    totalCpuUsageSystem += cpuUsage.system;

    const memoryUsage = process.memoryUsage();
    totalMemoryUsageRss += memoryUsage.rss;
    totalMemoryUsageHeapUsed += memoryUsage.heapUsed;
  }

  // Calculate averages
  const avgElapsedTime = totalElapsedTime / iterations;
  const avgCpuUsageUser = totalCpuUsageUser / iterations;
  const avgCpuUsageSystem = totalCpuUsageSystem / iterations;
  const avgMemoryUsageRss = totalMemoryUsageRss / iterations;
  const avgMemoryUsageHeapUsed = totalMemoryUsageHeapUsed / iterations;

  console.log(`Average time taken: ${avgElapsedTime.toFixed(4)} seconds`);
  console.log(
    `Average CPU usage: ${avgCpuUsageUser.toFixed(
      2
    )}us user, ${avgCpuUsageSystem.toFixed(2)}us system`
  );
  console.log(
    `Average Memory usage: ${formatBytes(avgMemoryUsageRss)} RSS, ${formatBytes(
      avgMemoryUsageHeapUsed
    )} heap used`
  );
})();
