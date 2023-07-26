import request from './request';
// const cheerio = require('cheerio');
import {log} from 'console-log-colors';
import cheerio, {AnyNode, Cheerio, load as loadCheerio} from 'cheerio';
import fs from 'fs';
import path from 'path';
import getCached, {clearCacheKey} from './cache';
import { sendProgressUpdate } from './socket-server';
import money from 'money';

const artistSearch = require('./data/artist-search');
const appDir = path.dirname(require.main?.filename || '');
console.log(appDir);


const oneDayInMinutes = 24 * 60 * 60;

const EMPTY_RESPONSE: SearchResults = {results:[], totalPages: 0, unfinished: true};
const EMPTY_LISTINGS: PagesResults = {listings: [], originalCurrency: 'USD'};

const wait = (seconds:number):Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, seconds * 1000);
  })
}

export default class DiscogsScraper {

  abort = false;

  constructor() {
    this.abort = false;
  }

  cancel() {
    this.abort = true;
  }

  async searchAllPages(seller: string, artists: string | string[], album:string|undefined=undefined, progressUpdate=() => {}, asHTML=true):Promise<PagesResults> {
    if (!Array.isArray(artists)) {
      artists = [artists];
    }

    const listingsGroupedByArtist:Record<string, {
      artist:string, listings:ScrapeListing[]
    }> = {};
    for (const artist of artists) {
      const debug = (...args:unknown[]) => {
        if (artist !== 'Neil YoungXX') { return; }
        log.magentaBG(...args)
      }
      try {
        if (artist.trim() === '' && (album ? album.trim() === '': true)) {
          return Promise.resolve(EMPTY_LISTINGS);
        }
      } catch (err) {
        console.log('Error with this input:', artist, album);
        console.log('Returning empty array for now');
        return Promise.resolve(EMPTY_LISTINGS);
      }
      const results = [];
      const searchTerm = (album ? `${artist} ${album}` : artist);//.replace(/\s+/g, '+')
      // debug('---------- Search Term:', album ? `${artist} ${album}` : artist)

      let page = 1;
      let nextLink = null
      let waitSec = 1;
      let resultRows;
      let wasCached = false;
      // const log = artist == 'Beck';

      // Get the HTML page, searching on the search term (artist or artist + album)
      // incrementing the page while there's a "next page" link.
      // Once page is loaded as a DOM, check each <tr> for a title that matches the actual query term since the
      // on-site discogs search is pretty loose.
      if (this.abort) {
        return EMPTY_LISTINGS;
      }
      progressUpdate();

      //////////////////////////////////////////////////////
      // GET PAGES
      //////////////////////////////////////////////////////
      do {
        debug(artist);
        const artistKey = artist.replace(/\s+/g, '-');
        const albumKey = album ? '-' + album.replace(/\s+/g, '-') : '';
        const key = `${seller}/${artistKey}${albumKey}-${page}`
        log.green(`requesting ${key}`);
        const query = new URLSearchParams({
          sort: 'artist,asc',
          limit: '250',
          format: 'Vinyl',
          q: searchTerm,
          page: page.toString(),
        })
        const url = `https://www.discogs.com/seller/${seller}/profile?${query.toString()}`;
        const {data:html, fromCache} = await getCached<string>(key, oneDayInMinutes, false, async () => {
          const html = await request(url);
          return html;
        });
        wasCached = fromCache;
        // debug(html);

        const $ = loadCheerio(html);
        // Get all trs.  Store it,
        resultRows = $('tbody tr .item_description_title');
        // Just search on the title. We'll get more info after we match. Get all title elements by classname
        const regex = album ? new RegExp(`^${artist}.* - ${album}`, 'i') : new RegExp(`^${artist}.* - `, 'i');
        log.yellow('Rows:', resultRows.length);
        for (let row of resultRows.toArray()) {
          // @ts-ignore data doesn't show on type but seems to exist.
          const linkText = row.children[0].data;
          // debug(row.children[0].data)
          if (artist === 'Neil Young') {
            if (!!linkText.match(regex)) {
              log.yellow(linkText);
            // } else {
              // log.red(linkText);
            }
            // log.yellow(regex);
            // log.yellow(linkText.match(regex));
          }
          // if (log) console.log(linkText, regex, linkText.match(regex))
          if (linkText?.match(regex)) {
            // console.log(row.attribs.href);
            // console.log(row.children[0].data)
            // console.log('---------------')
            // Three parents up from the title is the <tr>.
            // if (log) { console.log(loadCheerio(row.parentNode.parentNode.parentNode).html())}
            results.push(row.parentNode?.parentNode?.parentNode);
          }
        }
        nextLink = $('.pagination_next');
        if (nextLink.length > 0) {
          // console.log('Next page...');
        } else {
          // console.log('No more pages.');
        }
        const emptyResults = $('.no_marketplace_results');
        const anyResults = $('.table_block');
        console.log(emptyResults.contents().length, anyResults.contents().length);
        if (!emptyResults.contents().length && !anyResults.contents().length) {
          waitSec++;
          nextLink = ['foo'];
          clearCacheKey(key);
          log.red('No content for ', url, 'Waiting', waitSec);
          log.red(emptyResults.contents().length)
          log.red(anyResults.contents().length)
          page--;
        } else {
          waitSec = Math.max(1, waitSec--);
        }
        page++;
        if (!wasCached) {
          await wait(waitSec);
        }
      } while (nextLink.length > 0)

      ////////////////////////////////////////////////////////
      // PARSE
      ////////////////////////////////////////////////////////

      // `results` is now an array of <tr> elements that match our query for this artist (and album).
      // Some of this might be moveable to the asHTML block?
      results.forEach(row => {
        const $ = loadCheerio(row as AnyNode);
        const img = $('img')[0];
        if (img) {
          // console.log(img.attribs);
          img.attribs.src = img.attribs['data-src']
        }
        const links = $('a');
        for (let link of links.toArray()) {
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

      const extractCondition = (cheer:Cheerio<AnyNode>) => {
        const match = cheer.text().match(/\(([A-Z or\-\+]+)\)/);
        return match ? match[1] : '-'
      }
      const extractPrice = (cheer:Cheerio<AnyNode>) => {
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
      const currencyMap: Record<string, Currency> = {
        '$': 'USD',
        '€': 'EUR',
        '£': 'GBP',
      };
      const convertToUsd = (curr: string, amountStr: string) => {
        const amount = parseFloat(amountStr);
        if (curr === '$') {
          return amount;
        } else {
          return money.convert(
            amount, {from: currencyMap[curr], to: 'USD'}
          ).toFixed(2);
        }
      };

      // Manipulate the actual HTML and return that.
      if (asHTML) {
        return results.map(row => loadCheerio(row as AnyNode).html()
                  .replace('<html><head></head><body>', '')
                  .replace('</body></html>', '')
                  // .replace(/src="\//g, 'src="https://www.discogs.com')
                  // .replace(/href="\//g, 'href="https://www.discogs.com')
                  ).sort((a, b) => {
                    const A = loadCheerio(a);
                    const aText = A(A('.item_description_title')[0]).text();
                    const B = loadCheerio(b);
                    const bText = B(B('.item_description_title')[0]).text();
                    // console.log(aText, bText);
                    if (aText < bText) { return -1 }
                    if (aText > bText) { return 1 }
                    return 0;
                  });
      } else {
        let originalCurrency:Currency | undefined;
        const mappedResults: ScrapeListing[] = results.map(row => {
          // debug(row);
          const $ = loadCheerio(row as AnyNode)
          const qs = (selector: string) => $($(selector)[0])
          // console.log($.html());
          // console.log($);
          // const image = $($('.marketplace_image'))[0];
          const image = qs('.marketplace_image')[0];
          const title = qs('.item_description_title');
          // debug(title)
          // The bulk of the RE matches the last set of parentheses, which has the format in it.
          // If there's a parentheses in the title, the first capture group will keep it, and
          // just the second capture group (from `\(` on)) wil have the format.
          const titleMatch = title.text().match(/(.+)\(([^\)]+)\)[^\(]*$/);
          if (!titleMatch) {
            throw new Error(`Could not match title text: ${title.text()}`);
          }
          const condition = qs('.item_condition');
          const desc = $(condition.next()).text().trim();
          const shipping = qs('.item_shipping').contents().get(0)?.nodeValue;
          const releaseUri = qs('.item_release_link')[0].attribs.href
          // console.log('releasueUri', releaseUri);

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
          const uri = title[0].attribs.href
          return {
            release: {
              thumbnail: image ? (image as unknown as Element).attribs['data-src'] : '',
              title: titleMatch[1],
              year: '-' as unknown as number,
              format: titleMatch[2],
              resource_url: releaseUri,
            },
            id: uri.replace(/^.+\/(\d+)$/, '$1'),
            condition: extractCondition(condition),
            sleeve_condition: extractCondition(qs('.item_sleeve_condition')),
            comments: desc,
            uri,
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

        // if (!listingsGroupedByArtist[artist]) {
        //   listingsGroupedByArtist[artist] = {artist, listings:[]};
        // }
        // listingsGroupedByArtist[artist].listings = listingsGroupedByArtist[artist].listings.concat(mappedResults)
        // console.log('-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-');
        // console.log(mappedResults)
        // console.log('originalCurrency:', originalCurrency);
        // console.log('-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-');
        return {
          listings:mappedResults,
          // listings: Object.values(listingsGroupedByArtist),
          originalCurrency: originalCurrency as Currency,
        };
      }
    }

    return EMPTY_LISTINGS;
  }

  async searchAllArtists(seller: string, socketId: string, asHTML=true):Promise<SearchResults> {
    // const artistSearch = require('../data/artist-search');
    const booze = JSON.parse(fs.readFileSync(path.join(appDir, 'src', 'api', 'data', 'booze-vinyl.json')).toString())
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
      if (this.abort) { console.log('Aborted'); return EMPTY_RESPONSE; }
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
      if (this.abort) { console.log('Aborted'); return EMPTY_RESPONSE; }
      const {listings, originalCurrency} = await this.searchAllPages(seller, artist, null, progressUpdate, asHTML);
      if (listings.length > 0) {
        const artistListings = {
          artist,
          listings
        }
        if (!ogCurr) ogCurr = originalCurrency;
        results.push(artistListings)
      }
    }
    // results.originalCurrency = ogCurr;
    // console.log(results);
    const searchResults:SearchResults = {
      originalCurrency: ogCurr,
      results,
    }
    console.log(results);
    return searchResults;

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
console.log('--------------', process.argv)
if (process.argv[2] === 'dev') {
  // run();
}

module.exports = DiscogsScraper;