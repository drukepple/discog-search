import fs from 'fs';
import path from 'path';

const appDir = path.dirname(require.main?.filename ?? '');
console.log('CACHE -----------------------------\nappDir:', appDir);

const removeDir = function (path) {
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
  console.log('*****', fsPath)
  const dirs = fsPath.split(path.sep);
  const check: string[] = [];
  dirs.forEach(dir => {
    check.push(dir);
    const checkpath = check.join(path.sep);
    if (dir !== '.' && dir !== '..' && dir !== '') {
      // console.log('> checkpath:', checkpath)
      if (!fs.existsSync(checkpath)) {
        console.log('> doesn’t exist, making')
        fs.mkdirSync(checkpath);
      }
    }
  })
}


/**
 *
 * @param {string} key unique key
 * @param {number} ttl TTL in MINUTES
 * @param {function} fetchData Function that returns a Promise that returns the data to cache, if the cache doesn't exist or has expired.
 */
export default async function getCached(key, ttl, noCache, fetchData) {
  const now = new Date()//.toISOString();
  const cacheDir = path.join(appDir, 'public', 'cache', key);
  // console.log('> cacheDir:', cacheDir);
  mkdir_p(cacheDir);
  // if (!fs.existsSync(cacheDir)) {
  //   fs.mkdirSync(cacheDir);
  // }
  const filelist = fs.readdirSync(cacheDir).sort();
  // console.log(key, 'cache dir filelist:', filelist);

  if (filelist.length > 0) {
    // console.log('At least one file');
    const latestFile = filelist[filelist.length-1];
    // console.log(latestFile);
    const cacheDate = new Date(latestFile.replace('.json', ''));
    const ttlMs = ttl * 1000
    // console.log('ttlMs:', ttlMs)
    // console.log('now - cacheDate:', now - cacheDate)
    if (now - cacheDate < ttlMs && !noCache) {
      // console.log(key, 'cache good, returning data');
      const latestPath = path.join(cacheDir, latestFile);
      const cachedData = JSON.parse(fs.readFileSync(latestPath).toString());
      return Promise.resolve(cachedData);
    } else {
      // console.log(key, 'cache expired');
      console.log('Do some cleanup in this dir...');
      filelist.forEach(filename => {
        const filepath = path.join(cacheDir, filename);
        // console.log('  > ', cacheDir, filename)
        if (fs.lstatSync(filepath).isDirectory()) {
          // console.log('    - remove dir', filepath);
          removeDir(filepath);
        } else {
          // console.log('    + removing file', filepath)
          fs.rmSync(filepath);
        }
      })
    }
  } else {
    // console.log('Cache does not exist');
  }

  const dataToSave = await fetchData();
  mkdir_p(cacheDir);
  const filename = path.join(cacheDir, now.toISOString() + '.json');
  // console.log(filename);
  // console.log(dataToSave)
  fs.writeFileSync(filename, JSON.stringify(dataToSave, null, 4));
  return Promise.resolve(dataToSave);
}
