import { Icon, type IconName } from '../ui/Icon'
import styles from './ModeChooser.module.css'

export type HomeMode = 'dream' | 'describe'

interface Props {
  onChoose: (mode: HomeMode) => void
}

const OPTIONS: {
  mode: HomeMode
  icon: IconName
  title: string
  desc: string
  hint: string
}[] = [
  {
    mode: 'dream',
    icon: 'sparkles',
    title: 'Dreaming a trip',
    desc: "Not sure where to go? Answer a few quick questions and get matched with destinations that fit you.",
    hint: 'Answer 10 questions',
  },
  {
    mode: 'describe',
    icon: 'map',
    title: 'Describe your trip',
    desc: 'Already know the place? Describe it in your own words and get an editable day-by-day itinerary.',
    hint: 'Free-form input',
  },
]

export function ModeChooser({ onChoose }: Props) {
  return (
    <div className={styles.grid}>
      {OPTIONS.map((o) => (
        <button key={o.mode} type="button" className={styles.card} onClick={() => onChoose(o.mode)}>
          <span className={styles.icon}>
            <Icon name={o.icon} size={24} />
          </span>
          <span className={styles.body}>
            <span className={styles.title}>{o.title}</span>
            <span className={styles.desc}>{o.desc}</span>
          </span>
          <span className={styles.footer}>
            <span className={styles.hint}>{o.hint}</span>
            <span className={styles.go} aria-hidden="true">
              <Icon name="chevron" size={18} />
            </span>
          </span>
        </button>
      ))}
    </div>
  )
}
