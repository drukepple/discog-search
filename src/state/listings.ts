import { SearchResults } from '@/pages/api/search';
import { atom } from 'recoil';

// The search results from the current search.
export const listingsAtom = atom<SearchResults>({
  key: 'listings',
  default: {
    artists: {},
    listings: [],
    originalCurrency: '',
    seller: '',
    totalPages: 0,
    unfinished: false,
  }
})

export const sidebarAtom = atom({
  key: 'sidebar',
  default: {
    open: false,
    src: '',
  }
})