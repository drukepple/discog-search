type ListingAddOn = {
  usdPrices: {
    price: string | number;
    shipping: string | number;
    total: string | number;
  }
}
type SearchResults = {
  results: Listing[] | (Listing & ListingAddOn)[] | ScrapeListing[],
  unfinished: boolean;
  totalPages: number;
}
type FilterResults = {
  unfinished: boolean;
  totalPages: number;
  artists: Record<string, Listing[]>;
  originalCurrency: string; // Currency
}

type ScrapeListing = Pick<Listing,
  | 'condition'
  | 'sleeve_condition'
  | "comments"
  | 'uri'
> & ListingAddOn & {
  price: {value: string};
  shipping_price: {value: string};
  release: Pick<Release, 'thumbnail'|'title'|'year'|'format'|'resource_url'>
  originalCurrency: Currency;
  total: string;
};
type PagesResults = {
  listings: ScrapeListing[];
  // listings: {artist: string, listings:ScrapeListing[]}[];
  originalCurrency: Currency;
}