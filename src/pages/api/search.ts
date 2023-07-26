import DiscogsMarketplace from '@/api/marketplace';
import DiscogsScraper from '@/api/scraper';
import type { NextApiRequest, NextApiResponse } from 'next'
import type { FilterResults } from '@/api/marketplace';
import { getUniqueId } from '@/api/socket-server';

type ListingsWithArtist = {
    artist: string;
    listings: Listing[];
};
export type SearchResults = FilterResults & {
  listings: ListingsWithArtist[];
  // unfinished: boolean;
  // totalPages: number;
  // artists: Record<string, Listing[]>;
  seller: string;
  // originalCurrency: string; // Currency
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SearchResults>
) {
  console.log('=============================')
  console.log(req.query);
  const url = new URL(req.url as string, 'https://www.foo.com');
  // console.log(req.destroyed);
  // console.log(req.);
  const market = new DiscogsMarketplace();
  req.on('end', () => {
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    console.log('END')
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!s')
    market.cancel()
  });
  req.on('data', () => {
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    console.log('DATA')
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!s')
  });
  req.on('error', () => {
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    console.log('ERROR')
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!s')
    market.cancel()
  });
  console.log('=============================')

  const q = req.query;
  let seller = q.seller as string ?? '';
  if (seller.trim() !== '') {
    console.log('Searching', seller);
    const listings = await market.filterAllListings(seller, q.no_cache === 'true');
    // console.log(listings)
    if (listings.totalPages > 100) {
      console.log('Too many pages for API, redirecting to scrape.')
      const scraper = new DiscogsScraper();
      const listings = await scraper.searchAllArtists(seller, null, false);
      // console.log('+++++++++++++++++++++')
      // console.log(listings);
      // console.log('+++++++++++++++++++++')
      const artists: Record<string, Listing[]> = listings.results.reduce((acc, l) => {
        const artist = l.artist;
        if (!acc[artist]) {
          acc[artist] = [];
        } else {
          console.log('ALREADY CREATED!!!!!', artist);
        }
        acc[artist] = acc[artist].concat(l.listings);
        return acc;
      }, {});
      // console.log(artists);
      console.log('++++++++++++++++++++');
      const response = {listings: listings.results, artists, seller};
      console.log(response.listings.find(l => l.artist === 'Neil Young'));
      console.log('++++++++++++++++++++');
      res.status(200).send(response);
      return;
      // const url = new URL(req.url as string, 'https://www.foo.com');
      // console.log(url.search);
      // res.redirect('/scrape' + url.search)
    }
    const arrayed:ListingsWithArtist[] = Object.keys(listings.artists).map(artist => {
      // const lists = listings.artists[artist].map(l => {
      //   return {
      //     ...l,
      //     // total: l.price.value + l.shipping_price.value
      //   }
      // });
      return {
        artist,
        listings: listings.artists[artist],
      }
    });

    // console.log(arrayed);
    res.status(200).send({ listings: arrayed, seller, ...listings })
  } else {
    res.status(204).send({seller, listings: [], artists: {}, originalCurrency: '', totalPages: 0, unfinished: false});
  }
}

async function scrape(req:NextApiRequest, res:NextApiResponse<SearchResults>) {
  const scraper = new DiscogsScraper();
  req.on('close', () => {
    console.log('request aborted');
    scraper.cancel();
  });
  const asHTML = req.query.asHTML === 'true' || false;
  const q = req.query;
  const seller = q.seller as string;
  if (seller && seller.trim() !== '') {
    // Have seller, so get results and render them
    const socketId = getUniqueId();
    const listings = await scraper.searchAllArtists(seller, socketId, asHTML);
    console.log(listings);
    const printListings = listings.map(l => ({
      ...l,
      listings: l.listings.length,
    }))
    return listings;
    // console.log(printListings)
    // res.status(200).send({...listings, seller, unfinished: false, totalPages: 0})
    // res.render(template, { layout: 'main', listings, seller, socketId, ...listings })
  } else {
    res.status(204).send({seller, listings: [], artists: {}, originalCurrency: '', totalPages: 0, unfinished: false});
    // Render empty page
    // res.render('scrape');
  }
}
