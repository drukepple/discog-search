import {log} from 'console-log-colors';
// import * as util from 'disconnect/lib/util';
const util = require('disconnect/lib/util');
import money from 'money';
import client from './client';
import request from './request';
import getCached, { CachedData } from './cache';
import fs from 'fs';
import path from 'path';
import {sendProgressUpdate} from './socket-server';

const appDir = path.dirname(require.main?.filename || '');
console.log('--------------------------\nappDir:', appDir);



async function init() {
  const {data:rates} = await getCached<any>('_exchange-rates.json', 24*60*60*1000, false, async () => {
    const OXR_KEY = '402f86a53c044dd5a35bae913b06bb23';
    const ratesResult = await (request(`https://openexchangerates.org/api/latest.json?app_id=${OXR_KEY}`))
    const rates = JSON.parse(ratesResult as string);
    return rates;
  })
  money.base = rates.base;
  money.rates = rates.rates;
  console.log('Exchange rates retrieved', rates.base, Object.keys(money.rates).length);
}
init();


function normalize(str: string) {
  return str.toLowerCase().replace(/^(a|the)/, '').replace(/[^a-z0-9\s]+/, '')
}
function match(str1: string, str2: string) {
  return normalize(str1) === normalize(str2);
}


const artistSearch = require('./data/artist-search');
const booze = JSON.parse(fs.readFileSync(path.join(appDir, 'src', 'api', 'data', 'booze-vinyl.json')).toString())

let hasPrintedOneListingData = false;

/**
 * Prints the inventory to the console.
 * @param {Object} listingsByArtist
 */
function printListings(listingsByArtist: FilterResults) {
  console.log(listingsByArtist);
  Object.keys(listingsByArtist.artists).forEach(artist => {
    const artistResults = listingsByArtist.artists[artist];
    log.magenta(`${artist} ------------------------------`);
    console.log(artistResults.length + " results");
    console.log("");
    artistResults.forEach(listing => {
      if (!hasPrintedOneListingData) {
        console.log(listing);
        hasPrintedOneListingData = true;
      }
      log.green(`${listing.release.title} (${listing.release.year})`);
      console.log(`${listing.condition} / ${listing.sleeve_condition}`);
      const price = listing.price.value;
      const shipping = listing.shipping_price.value;
      console.log(`$${price} (+${shipping}: ${price + shipping})`);
      log.yellow(`${listing.comments}`);
      log.blue(`${listing.uri}`);
      console.log("");
    })
  });
}


class DiscogsMarketplace {
  abort = false;

  cancel() {
    this.abort = true;
  }

  async getAllListings(seller: string, noCache=false):Promise<SearchResults> {
    const oneDayInMinutes = 24 * 60 * 60;
    // TODO: make getCached typed/generic
    const {data: cached} = await getCached<SearchResults>(`${seller}/catalog-full`, oneDayInMinutes, noCache, () => {
      let allResults: Listing[] = []
      function getOnePage(page: number) {
        const obj = {
          per_page: 100,
          page,
        }
        return getCached(`${seller}/catalog-page${page}`, oneDayInMinutes, noCache, () => {
          return client.get({ url: util.addParams(`/users/${seller}/inventory`, obj), authLevel: 1 })
        })
      }
      return new Promise((resolve, reject) => {
        const getOnePageThen = (cd:CachedData<InventorySearch>):Promise<SearchResults> => {
          const r = cd.data;
          console.log('------------------ then...', r.listings.length)
          allResults = allResults.concat(r.listings);
          const pages = r.pagination
          if (pages.page === pages.pages) {
            resolve({results:allResults, unfinished:false, totalPages:pages.pages});
          } else {
            if (this.abort || pages.pages > 100 || pages.page === 100) {
              console.log('-- Aborted --');
             resolve({results:allResults, unfinished:true, totalPages: pages.pages});
            } else {
              const nextPage  = pages.page + 1;
              console.log(`--- getting page ${nextPage} of ${pages.pages}`);
              sendProgressUpdate(nextPage, pages.pages, 'TODO');
              return getOnePage(nextPage).then(getOnePageThen);
            }
          }
          return Promise.resolve({results:allResults, unfinished:false, totalPages:pages.pages});
        }
        console.log(`--- getting page 1 of ?`)
        getOnePage(1).then(getOnePageThen);
      });
    })
    // console.log('cached ----------------')
    // console.log(cached);
    // console.log('-------------------------')
    return cached;
  }

  async filterAllListings(seller: string, noCache=false):Promise<FilterResults> {
    const listingsByArtist:FilterResults = {
      unfinished: false,
      artists: {},
      originalCurrency: '',
      totalPages: 0,
    };
    // Used for post-processing, easier to loop over, and not returned.
    let listingsFlatList:Listing[] = [];

    try {
      const allListings = await this.getAllListings(seller, noCache);
      // return this.getAllListings(seller, noCache).then(result => {
      listingsByArtist.unfinished = allListings.unfinished;
      listingsByArtist.totalPages = allListings.totalPages;

      // Filter out results that aren't vinyl.
      const vinyl = allListings.results.filter(r => {
        const f = r.release.format
        // console.log(f);
        return f.indexOf('Vinyl') > -1 || f.indexOf('LP') > -1 || f.indexOf('7"') > -1
      });
      console.log('All results:  ', allListings.results.length);
      console.log('Vinyl results:', vinyl.length);

      // Booze and vinyl
      booze.forEach((entry:{master:number, artist: string|string[], album: string}) => {
        if (!entry) {
          console.log('Found null!');
          return;
        }
        const artists = typeof entry.artist === 'string' ? [entry.artist] : entry.artist
        const artistKey = artists[0];
        artists.forEach((artist:string) => {
          // console.log(artist);
          const artistFilter = vinyl.filter(r => {
            return match(r.release.artist, artist) && match(r.release.title, entry.album);
          })
          if (artistFilter.length > 0) {
            if (!listingsByArtist.artists[artistKey]) {
              listingsByArtist.artists[artistKey] = [];
            }
            listingsByArtist.artists[artistKey] = listingsByArtist.artists[artistKey].concat(artistFilter);
            listingsFlatList = listingsFlatList.concat(artistFilter);
          }
        })
      });
      // console.log(listingsByArtist.artists['The Jimi Hendrix Experience'])

      // General artist interest
      artistSearch.forEach((artist:string) => {
        // console.log(artist);
        const artistFilter = vinyl.filter(r => r.release.artist.toLowerCase() === artist.toLowerCase()).sort((a,b) => {
          const albumA = a.release.title.toLowerCase().replace(/^(a|the) /, '');
          const albumB = b.release.title.toLowerCase().replace(/^(a|the) /, '');
          if (albumA < albumB) { return -1; }
          if (albumA > albumB) { return 1; }
          return 0;
        });
        if (artistFilter.length > 0) {
          if (!listingsByArtist.artists[artist]) {
            listingsByArtist.artists[artist] = [];
          }
          listingsByArtist.artists[artist] = listingsByArtist.artists[artist].concat(artistFilter);
          listingsFlatList = listingsFlatList.concat(artistFilter);
        }
      });

      // Keeping a flat list of every listing makes it easier to post-process.
      // This is not returned.
      listingsFlatList.forEach(l => {
        const listing = l as Listing & ListingAddOn;
        // Fix URLs
        listing.release.resource_url = listing.release.resource_url
          .replace('api.discogs', 'www.discogs')
          .replace('/releases/', '/release/');

        // Try to make reprints more obvious
        listing.release.format = listing.release.format
          .replace(/\bRE\b/, '<span class="reissue">RE</span>')
          .replace(/\bRP\b/, '<span class="reissue">RP</span>')
          .replace(/\b2nd\b/, '<span class="reissue">RP</span>');

        // Convert prices to USD
        listing.usdPrices = {
          price: 0,
          shipping: 0,
          total: 0,
        };
        if (listing.original_price.converted) {
          listing.usdPrices.price = listing.original_price.converted.value;
        } else {
          listing.usdPrices.price = money.convert(listing.price.value, {from: listing.price.currency, to: 'USD'});
        }
        if (listing.original_shipping_price.converted) {
          listing.usdPrices.shipping = listing.original_shipping_price.converted.value;
        } else {
          listing.usdPrices.shipping = money.convert(listing.shipping_price.value || 0, {from: listing.shipping_price.currency || listing.price.currency, to: 'USD'});
        }
        // listing.usdPrices = {
        //   price: money.convert(listing.price.value, {from: listing.price.currency, to: 'USD'}),
        //   shipping: money.convert(listing.shipping_price.value, {from: listing.shipping_price.currency || listing.price.currency, to: 'USD'}),
        // }
        try {
          listing.usdPrices.total = (listing.usdPrices.price + listing.usdPrices.shipping).toFixed(2);
          // console.log(listing.usdPrices);
          listing.usdPrices.price = listing.usdPrices.price.toFixed(2);
          listing.usdPrices.shipping = listing.usdPrices.shipping.toFixed(2);
        } catch(err) {
          console.log(err);
        }
      });
      listingsByArtist.originalCurrency = listingsFlatList[0]?.price.currency ?? 'unknown';
      console.log('===================')
      console.log(listingsByArtist);
      console.log('===================')

      return listingsByArtist;
    } catch(err) {
      console.error('--------------------------------');
      console.error('ERROR GETTING LISTINGS:');
      console.error(err);
      console.error('--------------------------------');
      return listingsByArtist;
    }
  }
}

export default DiscogsMarketplace;



// If called like `node src/marketplace.js cli some-seller, run as a cli command.
if (process.argv[2] === 'cli') {
  console.log('Getting inventory for ' + process.argv[3]);
  console.log(process.argv);
  const marketplace = new DiscogsMarketplace();
  marketplace.filterAllListings(process.argv[3]).then(result => {
    printListings(result);
  })
}


/* LISTING DATA:
{
  id: 1545721921,
  resource_url: 'https://api.discogs.com/marketplace/listings/1545721921',
  uri: 'https://www.discogs.com/sell/item/1545721921',
  status: 'For Sale',
  condition: 'Mint (M)',
  sleeve_condition: 'Mint (M)',
  comments: 'Still sealed.  Free shipping in continental US.',
  ships_from: 'United States',
  posted: '2021-12-02T09:33:53-08:00',
  allow_offers: true,
  audio: false,
  price: { value: 149.5, currency: 'USD' },
  original_price: { curr_abbr: 'USD', curr_id: 1, formatted: '$149.50', value: 149.5 },
  shipping_price: { value: 0, currency: 'USD' },
  original_shipping_price: { curr_abbr: 'USD', curr_id: 1, formatted: '$0.00', value: 0 },
  seller: {
    id: 1891957,
    username: 'drtone',
    avatar_url: 'https://i.discogs.com/AGUFkEUHt0BThewKZZ08uHPK6ruL8PodEXokJon-g8E/rs:fill/g:sm/q:40/h:500/w:500/czM6Ly9kaXNjb2dz/LXVzZXItYXZhdGFy/cy9VLTE4OTE5NTct/MTYyODI2OTUwNi5q/cGVn.jpeg',
    stats: { rating: '100.0', stars: 5, total: 64 },
    min_order_total: 0,
    html_url: 'https://www.discogs.com/user/drtone',
    uid: 1891957,
    url: 'https://api.discogs.com/users/drtone',
    payment: 'PayPal Commerce',
    shipping: 'Please allow  up to 24 hours for shipping rate and invoice.  Items ship within 1 business day of payment received.  Free shipping within continental US on orders over $149.00.\r\n' +
      '\r\n' +
      'Standard - USPS Media Mail: 5 - 8 Business Days\r\n' +
      '1 to 220 grams: $4.00\r\n' +
      '221 to 452 grams: $4.75\r\n' +
      '453 to 907 grams: $5.25\r\n' +
      '908 to 1369 grams: $6.00\r\n' +
      '1370 to 1814 grams: $6.25\r\n' +
      '1815 to 2268 grams: $7.00\r\n' +
      '2269 to 2722 grams: $7.25\r\n' +
      '2723 to 3175 grams: $7.50\r\n' +
      '3176 to 3629 grams: $8.00\r\n' +
      '3630 to 4062 grams: $8.25\r\n' +
      '4063 grams and up: $0.30 per each additional 220 grams',
    resource_url: 'https://api.discogs.com/users/drtone'
  },
  release: {
    thumbnail: 'https://i.discogs.com/uq_vlW1iEBgMAkM6KR7RYlcOTlF_0oGYheBYlJ_Ugq0/rs:fit/g:sm/q:40/h:150/w:150/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9SLTE3NDMy/NDIyLTE2MTM0MjA0/MTktNDgzNC5qcGVn.jpeg',
    description: 'Black Sabbath - Paranoid Super Deluxe (LP, Album, RE, RM, Gat + LP, Album, RE, Gat + 3xLP)',
    images: [
      [Object], [Object], [Object], [Object],
      [Object], [Object], [Object], [Object],
      [Object], [Object], [Object], [Object],
      [Object], [Object], [Object], [Object],
      [Object], [Object], [Object], [Object],
      [Object], [Object], [Object], [Object],
      [Object], [Object], [Object], [Object],
      [Object], [Object], [Object], [Object],
      [Object], [Object], [Object]
    ],
    artist: 'Black Sabbath',
    format: 'LP, Album, RE, RM, Gat + LP, Album, RE, Gat + 3xLP',
    resource_url: 'https://api.discogs.com/releases/17432422',
    title: 'Paranoid Super Deluxe',
    year: 2020,
    id: 17432422,
    catalog_number: '603497846443, R1 556692',
    stats: { community: [Object], user: [Object] }
  },
  in_cart: false
}
*/