import {AtomEffect, atomFamily, selectorFamily} from 'recoil';

// Back the display state atom family with local storage.
const localStorageEffect = (key:string): AtomEffect<DisplayState> => ({setSelf, onSet}) => {
  if (typeof window === 'undefined') { return; }
  const savedValue = window.localStorage.getItem(key);
  // console.log('savedValue', JSON.parse(savedValue || '{}'));
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

// DISPLAY STATE TYPES ---------------------------------------------
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

// FILTER TYPES
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

// DEFAULTS ---------------------------------------------------------
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
export const defaultArtistDisplayState: ArtistDisplayState = {
  filters: defaultFiltersDisplayState,
  open: true,
}
export const defaultListingDisaplyState: ListingDisplayState = {
  open: true,
}


// ATOMS/SELECTORS ---------------------------------------------------

// Get a display state for a given seller slug
export const displayStateAtom = atomFamily<DisplayState, string>({
  key: 'displayState',
  default: {
    artists: {},
    listings: {},
    filters: defaultFiltersDisplayState,
  },
  effects: seller => ([
    localStorageEffect('displayState-' + seller)
  ])
})

type DisplaySelectorArtistId = {
  seller: string,
  artist: string,
}
type DisplaySelectorId = {
  seller: string,
  id: number,
}

// Artist display states get just the `artists[artist]` part of
// a given `seller` display state atom.
export const artistDisplayStateSelector = selectorFamily<ArtistDisplayState, DisplaySelectorArtistId>({
  key: 'artistDisplayState',
  get: ({seller, artist}) => ({get}) => {
    if (artist === 'GLOBAL') return defaultArtistDisplayState;
    return get(displayStateAtom(seller))?.artists?.[artist] || defaultArtistDisplayState;
  },
  set: ({seller, artist}) => ({ set }, newState) => {
    if (artist === 'GLOBAL') return;
    set(displayStateAtom(seller), currState => ({
      ...currState,
      artists: {
        ...currState.artists,
        [artist]: newState as ArtistDisplayState,
      },
    }));
  },
});

// ListingDisplay states get just a single listing by id from `listings`
// of a given `seller` display atom.
export const ListingDisplayStateSelector = selectorFamily<ListingDisplayState, DisplaySelectorId>({
  key: 'listingDisaplyState',
  get: ({seller, id}) => ({get}) => {
    return get(displayStateAtom(seller))?.listings?.[id] ?? defaultListingDisaplyState;
  },
  set: ({seller, id}) => ({set}, newState) => {
    set(displayStateAtom(seller), currState => ({
      ...currState,
      listings: {
        ...currState.listings,
        [id]: newState as ListingDisplayState,
      }
    }));
  }
});