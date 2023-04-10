import DiscogsMarketplace from '@/api/marketplace';
import type { NextApiRequest, NextApiResponse } from 'next'
import type { FilterResults } from '@/api/marketplace';

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
  console.log(url.search);
  const market = new DiscogsMarketplace();
  req.on('close', () => market.cancel());
  console.log('=============================')

  const q = req.query;
  let seller = q.seller as string ?? '';
  if (seller.trim() !== '') {
    console.log('Searching', seller);
    const listings = await market.filterAllListings(seller, q.no_cache === 'true');
    // console.log(listings)
    if (listings.totalPages > 100) {
      console.log('Too many pages for API, redirecting to scrape.')
      const url = new URL(req.url as string, 'https://www.foo.com');
      console.log(url.search);
      res.redirect('/scrape' + url.search)
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
    // res.render('index', { layout: 'main', listings: arrayed, seller, ...listings });
  } else {
    res.status(204).send({seller, listings: [], artists: {}, originalCurrency: '', totalPages: 0, unfinished: false});
    // res.render('index', {layout: 'main'})
  }
}
