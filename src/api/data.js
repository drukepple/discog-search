const fs = require('fs');
const client = require('./client');
const db = client.database();
// db.getRelease(176126, function (err, data) {
//   console.log(data);
// });

async function identifyReleases(textFile) {
  const promises = [];
  const output = [];
  albums = fs.readFileSync(textFile).toString();
  albums.split('\n').forEach(async line => {
    if (line.match(/^\s*$/)) { return; }
    const match = line.match(/^(.+) – (.+) \(\d{4}\)/)
    if (!match) {
      console.log('Could not parse this line:');
      console.log(line);
    }
    let artist = match[1];
    const album = match[2];
    const theMatch = artist.match(/(.+), (.+)/)
    if (theMatch) {
      artist = theMatch[2] + ' ' + theMatch[1]
    }
    promises.push(searchForMaster(artist, album));
  });
  // console.log(promises);
  Promise.all(promises).then(results => {
    console.log(results);
    fs.writeFileSync(textFile.replace('.txt', '.json'), JSON.stringify(results, null, 4))
  })
}

async function searchForMaster(artist, album) {
  try {
    const query = {
      release_title: album,
    }
    if (artist !== 'Multiple Artists') {
      query.artist = artist;
    }
    // const query = artist === 'Multiple Artists' ? album : artist + ' ' + album
    const search = await db.search(query);
    // console.log(Object.keys(search))
    const master = search.results.filter(x => x.type === 'master')[0];
    if (master) {
      // console.log('have a master');
      return {
        master: master.master_id,
        artist,
        album,
      };
      // console.log(master);
    } else {
      console.log(`============ Problem finding: ${artist} ${album} ============`)
    }
  } catch (err) {
    console.log(err);
  }
}

module.exports = identifyReleases;