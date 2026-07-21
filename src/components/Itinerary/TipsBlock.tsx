import { Icon } from '../ui/Icon'
import styles from './Blocks.module.css'

interface Props {
  tips: string[]
}

export function TipsBlock({ tips }: Props) {
  if (tips.length === 0) return null
  return (
    <section className={styles.panel} aria-label="Travel tips">
      <div className={styles.panelHead}>
        <span className={styles.panelIcon}>
          <Icon name="bulb" size={18} />
        </span>
        <h3>Good to know</h3>
      </div>
      <ul className={styles.tips}>
        {tips.map((tip, i) => (
          <li className={styles.tipRow} key={i}>
            <Icon name="check" size={15} />
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
