import { artistDisplayStateSelector, displayStateAtom, FilterState, FilterKeys } from "@/state/display-state";
import { useSearchState } from "@/state/use-search-state";
import { ChangeEvent } from "react"
import { useRecoilState } from "recoil";


const styles = {
  filterRow: {
    display: 'flex',
    alignItems: 'center',
  },
  filterItem: {
    marginRight: 10,
    fontSize: 14,
    fontWeight: 'normal',
    display: 'inline-flex',
    alignItems: 'center',
  },
  filterLabel: {
    marginRight: 3,
  },
}

export const filterNameToKeyMap: Record<string, FilterKeys> = {
  'Mint (M)': 'mint',
  'Near Mint (NM or M-)': 'nearMint',
  'Very Good Plus (VG+)': 'veryGoodPlus',
  'Very Good (VG)': 'veryGood',
}

type FiltersProps = {
  // onChange: (filters: FiltersState) => void;
  artist?: string,
}
export default function Filters({artist='GLOBAL'}:FiltersProps) {

  const {sellerSlug:seller} = useSearchState();
  const [displayState, setDisplayState] = useRecoilState(displayStateAtom(seller));
  const [artistDisplay, setArtistDisplay] = useRecoilState(artistDisplayStateSelector({seller, artist}))
  const stateInUse = artist === 'GLOBAL' ? displayState : artistDisplay;
  // const [filterState, setFilterState] = useState<FiltersState>({
  //   mint: true,
  //   nearMint: true,
  //   veryGoodPlus: true,
  //   veryGood: true,
  //   goodPlus: true,
  //   good: true,
  //   fair: false,
  //   reissue: true,
  //   comp: false,
  //   single: false,
  //   all: true,
  // })

  const nameToKeyMap:FilterState[] = [
    {name: 'M', key: 'mint'},
    {name: 'NM', key: 'nearMint'},
    {name: 'VG+', key: 'veryGoodPlus'},
    {name: 'VG', key: 'veryGood'},
    {name: 'G+', key: 'goodPlus'},
    {name: 'G', key: 'good'},
    {name: 'F', key: 'fair'},
    {name: 'RE', key: 'reissue'},
    {name: 'Comp', key: 'comp'},
    {name: 'Single', key: 'single'},
    {name: 'All', key: 'all'},
  ]

  const handleClick = (event:ChangeEvent<HTMLInputElement>, key:string, filter: boolean) => {
    console.log(key, filter);
    if (artist === 'GLOBAL') {
      console.log('GLOBAL')
      const state = {
        ...displayState,
        filters: {
          ...displayState.filters,
          [key]: filter,
        }
      }
      console.log(state);
      setDisplayState(state);
    } else {
      console.log('ARTIST:', artist);
      setArtistDisplay({
        ...artistDisplay,
        filters: {
          ...artistDisplay.filters,
          [key]: filter,
        }
      })
    }
    // onChange(state);
    // event.stopPropagation();
    // event.preventDefault();
  }

  return <div id="control-bar" style={styles.filterRow}>
    {/* <pre>{JSON.stringify(stateInUse.filters, null, 4)}</pre> */}
    {nameToKeyMap.map(x => <label key={x.key} style={styles.filterItem}>
      <input type="checkbox"
             onChange={(e) => handleClick(e, x.key, e.target.checked)}
             checked={stateInUse.filters[x.key]}
             style={styles.filterLabel} />
      {x.name}
    </label>)}
    {/*                 <button class="hide-reissues">Hide RE</button>
                <button class="hide-club">Hide Club</button>
                <button class="collapse-all">Collapse All</button>
                <button class="expand-all">Expand All</button>
 */}
    {/* <label><input type="checkbox" class="media-condition" data-rank="M,Mint (M)" checked="" />Mint</label>
    <label><input type="checkbox" class="media-condition" data-rank="NM or M-,Near Mint (NM or M-)" checked="" />NM</label>
    <label><input type="checkbox" class="media-condition" data-rank="VG+,Very Good Plus (VG+)" checked="" />VG+</label>
    <label><input type="checkbox" class="media-condition" data-rank="VG" checked="" />VG</label>
    <label><input type="checkbox" class="media-condition" data-rank="G+" checked="" />G+</label>
    <label><input type="checkbox" class="media-condition" data-rank="G" checked="" />G</label>
    <label><input type="checkbox" class="media-condition" data-rank="F" checked="" />F</label> */}
  </div>

}