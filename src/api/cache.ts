import fs from 'fs';
import path from 'path';

const appDir = path.dirname(require.main?.filename ?? '');

const removeDir = function (path: string) {
  if (fs.existsSync(path)) {
    const files = fs.readdirSync(path)

    if (files.length > 0) {
      files.forEach(function (filename) {
        if (fs.statSync(path + "/" + filename).isDirectory()) {
          removeDir(path + "/" + filename)
        } else {
          fs.unlinkSync(path + "/" + filename)
        }
      })
      fs.rmdirSync(path)
    } else {
      fs.rmdirSync(path)
    }
  } else {
    console.log("Directory path not found.")
  }
}
const mkdir_p = (fsPath:string) => {
  const dirs = fsPath.split(path.sep);
  const check: string[] = [];
  dirs.forEach(dir => {
    check.push(dir);
    const checkpath = check.join(path.sep);
    if (dir !== '.' && dir !== '..' && dir !== '') {
      if (!fs.existsSync(checkpath)) {
        fs.mkdirSync(checkpath);
      }
    }
  })
}

const getCacheDir = (key:string) => {
  return path.join(appDir, 'public', 'cache', key);
}

export type CachedData<T=any> = {
  data: T;
  fromCache: boolean;
}
/**
 *
 * @param {string} key unique key
 * @param {number} ttl TTL in MINUTES
 * @param {function} fetchData Function that returns a Promise that returns the data to cache, if the cache doesn't exist or has expired.
 */
export default async function getCached<T=any>(key:string, ttl:number, noCache:boolean, fetchData:() => unknown):Promise<CachedData<T>> {
  const now = new Date();
  const cacheDir = getCacheDir(key);
  mkdir_p(cacheDir);
  const filelist = fs.readdirSync(cacheDir).sort();

  if (filelist.length > 0) {
    const latestFile = filelist[filelist.length-1];
    const cacheDate = new Date(latestFile.replace('.json', ''));
    const ttlMs = ttl * 1000
    if (now.getTime() - cacheDate.getTime() < ttlMs && !noCache) {
      const latestPath = path.join(cacheDir, latestFile);
      const cachedData = JSON.parse(fs.readFileSync(latestPath).toString());
      return Promise.resolve({data: cachedData, fromCache: true});
    } else {
      filelist.forEach(filename => {
        const filepath = path.join(cacheDir, filename);
        if (fs.lstatSync(filepath).isDirectory()) {
          removeDir(filepath);
        } else {
          fs.rmSync(filepath);
        }
      })
    }
  } else {
  }

  const dataToSave = await fetchData();
  mkdir_p(cacheDir);
  const filename = path.join(cacheDir, now.toISOString() + '.json');
  fs.writeFileSync(filename, JSON.stringify(dataToSave, null, 4));
  return Promise.resolve({data: dataToSave as string, fromCache: false});
}

export async function clearCacheKey(key:string) {
  removeDir(getCacheDir(key));
}