import fs from 'fs';
import { tools } from '@constants/tools';
import { globals } from '@constants/globals';

// TODO: Introduce this as a middleware.
export const initDirs = async () => {
  let slugs = await tools.map(({ slug }) => slug.replace(/-/g, ''));
  await slugs.forEach(async slug => {
    let uploadDir = `./${globals.uploadDir}/${slug}`;
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    let downloadDir = `./${globals.downloadDir}/${slug}`;
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }
  });
}
