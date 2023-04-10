import { sidebarAtom } from '@/state/listings';
import styles from '@/styles/Sidebar.module.css';
import { useRecoilValue, useSetRecoilState } from 'recoil';

// type SidebarProps = {
//   open: boolean,
//   src?: string,
// }
export default function Sidebar() {
  const {open, src} = useRecoilValue(sidebarAtom);
  const setSidebarState = useSetRecoilState(sidebarAtom);
  const onCloseClick = () => {
    setSidebarState({
      src,
      open: false,
    })
  }
  return <div className={styles.sidebar + (open ? ' ' + styles.sidebarOpen : '')}>
    {src &&
    <iframe id="sidebar-iframe" src={`/api/proxy?src=${src}`}></iframe>
    }
    <button className={styles.closeButton} onClick={onCloseClick}></button>
  </div>
}