type Price = {
  value: number;
  currency: string; // Currency
}
type OriginalPrice = {
  curr_abbr: string; // Currency
  curr_id: number;
  formatted: string;
  value: number;
  converted?: Price;
}
type Stats = {
  rating: string;
  stars: number;
  total: number;
}
type Seller = {
  id: number,
  username: string,
  avatar_url: string,
  stats: Stats,
  min_order_total: number,
  html_url: string,
  uid: number,
  url: string,
  payment: string,
  shipping: string,
  resource_url: string,
}
type Image = {
  type: string;
  uri: string;
  resource_url: string;
  uri150: string;
  width: number;
  height: number;
}
type Release = {
  thumbnail: string,
  description: string,
  images: Image[];
  artist: string;
  format: string;
  resource_url: string;
  title: string;
  year: number,
  id: number,
  catalog_number: string,
  stats: {
    community: Stats;
    user: Stats;
  }
}
type Listing = {
  id: number,
  resource_url: string,
  uri: string,
  status: string,
  condition: string, // COndition
  sleeve_condition: string, // COndition
  comments: string,
  ships_from: string,
  posted: string, // Date
  allow_offers: boolean,
  audio: boolean,
  price: Price,
  original_price: OriginalPrice,
  shipping_price: Price,
  original_shipping_price: OriginalPrice,
  in_cart: boolean;
  seller: Seller;
  release: Release;
}

type Pagination = {
  page: number;
  pages: number;
  per_page: number;
  items: number;
  urls: unknown;
}
type InventorySearch = {
  pagination: Pagination;
  listings: Listing[];
}