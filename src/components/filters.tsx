import { MouseEvent, useState } from "react"

type FilterKeys = 'mint' | 'nearMint' | 'veryGoodPlus' | 'veryGood' | 'goodPlus' | 'good' | 'fair'
  | 'reissue' | 'comp' | 'single' | 'all';
type FilterNames = 'M' | 'NM' | 'VG+' | 'VG' | 'G+' | 'G' | 'F'
  | 'RE' | 'Comp' | 'Single' | 'All';
type FilterState = {
  name: FilterNames;
  key: FilterKeys;
}

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

export default function Filters() {

  const [filterState, setFilterState] = useState<Record<FilterKeys, boolean>>({
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
  })

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

  const handleClick = (key:string, filter: boolean) => {
    console.log(key, filter);
    const state = {
      ...filterState,
      [key]: filter,
    }
    setFilterState(state);
  }

  return <div id="control-bar" style={styles.filterRow}>
    {nameToKeyMap.map(x => <label key={x.key} style={styles.filterItem}>
      <input type="checkbox" onChange={(e) => handleClick(x.key, e.target.checked)} checked={filterState[x.key]} style={styles.filterLabel} />
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