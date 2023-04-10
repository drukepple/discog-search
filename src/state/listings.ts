import { SearchResults } from '@/pages/api/search';
import {atom, selector, selectorFamily} from 'recoil';

const localStorageEffect = (key:string) => ({setSelf, onSet}) => {
  const savedValue = localStorage.getItem(key);
  if (savedValue !== null) {
    setSelf(JSON.parse(savedValue));
  }
  onSet((newValue:any, _:any, isReset:boolean) => {
    if (isReset) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(newValue));
    }
  });
}

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

export type DisplayState = {
  artists: Record<string, ArtistDisplayState>;
  listings: Record<string, ListingDisplayState>;
  filters: FiltersState;
}

export type ArtistDisplayState = {
  filters: FiltersState;
  open: boolean;
}

export type ListingDisplayState = {
  open: boolean;
}

export type ConditionFilterKeys = 'mint'
 | 'nearMint'
 | 'veryGoodPlus'
 | 'veryGood'
 | 'goodPlus'
 | 'good'
 | 'fair';

export type FilterKeys = ConditionFilterKeys
  | 'reissue' | 'comp' | 'single' | 'all';
export type FilterNames = 'M' | 'NM' | 'VG+' | 'VG' | 'G+' | 'G' | 'F'
  | 'RE' | 'Comp' | 'Single' | 'All';
export type FilterState = {
  name: FilterNames;
  key: FilterKeys;
}
export type FiltersState = Record<FilterKeys, boolean>;

export const defaultFiltersDisplayState = {
  mint: true,
  nearMint: true,
  veryGoodPlus: true,
  veryGood: true,
  goodPlus: true,
  good: true,
  fair: false,
  reissue: true,
  comp: false,
  single: false,
  all: true,
}
export const defaultArtistDisplayState = {
  filters: defaultFiltersDisplayState,
  open: true,
}




export const displayStateAtom = atom<DisplayState>({
  key: 'displayState',
  default: {
    artists: {},
    listings: {},
    filters: defaultFiltersDisplayState,
  }
})

export const artistDisplayStateSelector = selectorFamily<ArtistDisplayState, string>({
  key: 'artistDisplayState',
  get: (artist:string) => ({get}) => {
    if (artist === 'GLOBAL') return defaultArtistDisplayState;
    return get(displayStateAtom).artists[artist];
  },
  set: (artist: string) => ({ set }, newState) => {
    if (artist === 'GLOBAL') return;
    set(displayStateAtom, currState => ({
      ...currState,
      artists: {
        ...currState.artists,
        [artist]: newState as ArtistDisplayState,
      },
    }));
  },
});

export const ListingDisplayStateSelector = selectorFamily<ListingDisplayState, number>({
  key: 'listingDisaplyState',
  get: (id: number) => ({get}) => {
    return get(displayStateAtom).listings[id];
  },
  set: (id: number) => ({set}, newState) => {
    set(displayStateAtom, currState => ({
      ...currState,
      listings: {
        ...currState.listings,
        [id]: newState as ListingDisplayState,
      }
    }));
  }
});

// export const FilterDisplayStateSelector = atom({
//   key: 'globalFilterDisplayState',
//   default:
// })


export const sidebarAtom = atom({
  key: 'sidebar',
  default: {
    open: false,
    src: '',
  }
})