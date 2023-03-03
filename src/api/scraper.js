const getRequest = require('./request');
const cheerio = require('cheerio');
const artistSearch = require('../data/artist-search');
const fs = require('fs');
const path = require('path');
const getCached = require('./cache');
const { sendProgressUpdate } = require('./socket-server');
const appDir = path.dirname(require.main.filename);
const money = require('money');


const oneDayInMinutes = 24 * 60 * 60;

class DiscogsScraper {

  abort = false;

  constructor() {
    this.abort = false;
  }

  cancel() {
    this.abort = true;
  }

  async searchAllPages(seller, artists, album=null, progressUpdate, asHTML=true) {
    if (!Array.isArray(artists)) {
      artists = [artists];
    }

    for (const artist of artists) {
      try {
        if (artist.trim() === '' && (album ? album.trim() === '': true)) {
          return Promise.resolve([]);
        }
      } catch (err) {
        console.log('Error with this input:', artist, album);
        console.log('Returning empty array for now');
        return Promise.resolve([]);
      }
      const results = [];
      const searchTerm = (album ? `${artist} ${album}` : artist).replace(/\s+/g, '+')
      // console.log('Search Term:', searchTerm)

      let page = 1;
      let nextLink = null
      // const log = artist == 'Beck';

      // Get the HTML page, searching on the search term (artist or artist + album)
      // incrementing the page while there's a "next page" link.
      // Once page is loaded as a DOM, check each <tr> for a title that matches the actual query term since the
      // on-site discogs search is pretty loose.
      if (this.abort) {
        return 'cancelled';
      }
      progressUpdate();
      do {
        // console.log(artist);
        const artistKey = artist.replace(/\s+/g, '-');
        const albumKey = album ? '-' + album.replace(/\s+/g, '-') : '';
        const key = `${seller}/${artistKey}${albumKey}-${page}`
        const html = await getCached(key, oneDayInMinutes, false, async () => {
          const url = `https://www.discogs.com/seller/${seller}/profile?sort=artist%2Casc&format=Vinyl&q=${searchTerm}&page=${page}`;
          const html = await getRequest(url);
          return html;
        });

        const $ = cheerio.load(html);
        // Just search on the title. We'll get more info after we match. Get all title elements by classname
        const resultRows = $('tbody tr .item_description_title');
        // console.log(resultRows.text())
        const regex = album ? new RegExp(`^${artist}.* - ${album}`, 'i') : new RegExp(`^${artist}.* - `, 'i');
        for (let row of resultRows) {
          const linkText = row.children[0].data;
          // if (log) console.log(linkText, regex, linkText.match(regex))
          if (linkText?.match(regex)) {
            // console.log(row.attribs.href);
            // console.log(row.children[0].data)
            // console.log('---------------')
            // Three parents up from the title is the <tr>.
            // if (log) { console.log(cheerio.load(row.parentNode.parentNode.parentNode).html())}
            results.push(row.parentNode.parentNode.parentNode);
          }
        }
        nextLink = $('.pagination_next');
        page++;
      } while (nextLink.length > 0)

      // `results` is not an array of <tr> elements that match our query for this artist (and album).
      // Some of this might be moveable to the asHTML block?
      results.forEach(row => {
        const $ = cheerio.load(row);
        const img = $('img')[0];
        if (img) {
          // console.log(img.attribs);
          img.attribs.src = img.attribs['data-src']
        }
        const links = $('a');
        for (let link of links) {
          link.attribs.href = 'https://www.discogs.com' + link.attribs.href;
        }
        const title = $($('.item_description_title')[0]);
        title.html(title.text().replace(/\bRE\b/g, '<span class="reissue">RE</span>,')
                              .replace(/\bRP\b/g, '<span class="reissue">RE</span>,')
                              .replace(/\b2nd\b/g, '<span class="reissue">RE</span>,')
                              .replace(/\bClub\b/gi, '<span class="club">RE</span>,')
        );
        const strong = title.parent();
        const headingDiv = $('<div>')
        headingDiv.addClass('listing-title');
        headingDiv.append(strong);
        const desc = $($('.item_description')[0])
        desc.prepend(headingDiv);
        // title.attribs['href']
      })

      const extractCondition = cheer => {
        const match = cheer.text().match(/\(([A-Z or\-\+]+)\)/);
        return match ? match[1] : '-'
      }
      const extractPrice = cheer => {
        // console.log('extractPrice');
        const re = /(.)(\d*,?\d+\.\d\d)/;
        const str = (typeof cheer === 'string') ? cheer : cheer.text();
        // console.log(str);
        const match = str.match(re);
        // console.log(match[1])
        if (!match) {
          console.error("Problem matching price on", cheer);
          return '-';
        }
        return [match[1], match[2]];
      };
      const currencyMap = {
        '€': 'EUR',
        '£': 'GBP',
      };
      const convertToUsd = (curr, amount) => {
        if (curr === '$') {
          return amount;
        } else {
          return money.convert(
            amount, {from: currencyMap[curr], to: 'USD'}
          ).toFixed(2);
        }
      };
      let originalCurrency;

      // Manipulate the actual HTML and return that.
      if (asHTML) {
        return results.map(row => cheerio.load(row).html()
                  .replace('<html><head></head><body>', '')
                  .replace('</body></html>', '')
                  // .replace(/src="\//g, 'src="https://www.discogs.com')
                  // .replace(/href="\//g, 'href="https://www.discogs.com')
                  ).sort((a, b) => {
                    const A = cheerio.load(a);
                    const aText = A(A('.item_description_title')[0]).text();
                    const B = cheerio.load(b);
                    const bText = B(B('.item_description_title')[0]).text();
                    // console.log(aText, bText);
                    if (aText < bText) { return -1 }
                    if (aText > bText) { return 1 }
                    return 0;
                  });
      } else {
        const mappedResults = results.map(row => {
          const $ = cheerio.load(row)
          const qs = selector => $($(selector)[0])
          // console.log($.html());
          // console.log($);
          // const image = $($('.marketplace_image'))[0];
          const image = qs('.marketplace_image')[0];
          const title = qs('.item_description_title');
          // The bulk of the RE matches the last set of parentheses, which has the format in it.
          // If there's a parentheses in the title, the first capture group will keep it, and
          // just the second capture group (from `\(` on)) wil have the format.
          const titleMatch = title.text().match(/(.+)\(([^\)]+)\)[^\(]*$/);
          const condition = qs('.item_condition');
          const desc =$(condition.next()).text().trim();
          const shipping = qs('.item_shipping').contents().get(0).nodeValue;
          const releaseUri = qs('.item_release_link')[0].attribs.href

          const [priceCurr, price] = extractPrice(qs('.price'));
          const [shipCurr, shipping_price] =  extractPrice(shipping);
          const [totalCurr, total] = extractPrice(qs('.converted_price'));
          originalCurrency = currencyMap[priceCurr];
          if (!originalCurrency) {
            console.log('-----------------------')
            console.log(qs('.price').text());
            console.log('price:', priceCurr, price);
            console.log('ship:', shipCurr, shipping_price);
            console.log('total:', totalCurr, total);
            console.log(extractPrice(qs('.price')))
            throw new Error(`Currency not mapped: "${priceCurr}"`);
          }
          const usdPrices = {
            price: convertToUsd(priceCurr, price),
            shipping: convertToUsd(shipCurr, shipping_price),
            total: convertToUsd(totalCurr, total),
          };

          return {
            release: {
              thumbnail: image ? image.attribs['data-src'] : '',
              title: titleMatch[1],
              year: '-',
              format: titleMatch[2],
              resource_url: releaseUri,
            },
            condition: extractCondition(condition),
            sleeve_condition:  extractCondition(qs('.item_sleeve_condition')),
            comments: desc,
            uri: title[0].attribs.href,
            price: { value: price, },
            shipping_price: { value: shipping_price, },
            total: total,
            originalCurrency: currencyMap[priceCurr],
            usdPrices,
          }
        }).sort((a, b) => {
          if (a.release.title < b.release.title) return -1;
          if (a.release.title > b.release.title) return 1;
          return 0;
        });
        return {
          listings: mappedResults,
          originalCurrency,
        };
      }
    }

    return results;
  }

  async searchAllArtists(seller, socketId, asHTML=true) {
    // const artistSearch = require('../data/artist-search');
    const booze = JSON.parse(fs.readFileSync(path.join(appDir, 'data', 'booze-vinyl.json')).toString())
    const results = [];

    const totalPages = booze.length + artistSearch.length;
    let currentPage = 0;
    const progressUpdate = () => {
      // console.log('progressUpdate', currentPage, totalPages);
      sendProgressUpdate(currentPage, totalPages, socketId)
      currentPage++;
    }

    // Search specific albums.
    for (let {artist, album} of booze) {
    // booze.forEach(async rel => {
      if (this.abort) { console.log('Aborted'); return [{listings:[]}]; }
      const {listings} = await this.searchAllPages(seller, artist, album, progressUpdate, asHTML);
      if (listings.length > 0) {
        const albumListings = {
          artist,
          album,
          listings,
        }
        results.push(albumListings);
      }
      // })
    }

    let ogCurr;
    // Search on artists in general.
    for (let artist of artistSearch) {
      if (this.abort) { console.log('Aborted'); return [{listings:[]}]; }
      const {listings, originalCurrency} = await this.searchAllPages(seller, artist, null, progressUpdate, asHTML);
      if (listings.length > 0) {
        const artistListings = {
          artist,
          listings
        }
        ogCurr = originalCurrency;
        results.push(artistListings)
      }
    }
    results.originalCurrency = ogCurr;
    return results;

  }
}

async function run() {
  const scraper = new DiscogsScraper();
  const results = await scraper.searchAllPages('SmashingIha', 'The Wu Tang Clan', null, () => {}, true);
  console.log(results[0])
  console.log('...')
  results.forEach(row => {
    // console.log(row.name, row.attribs);
    console.log(row)
    console.log('----')
  });
}
if (process.argv[2] === 'dev') {
  run();
}

module.exports = DiscogsScraper;