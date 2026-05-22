import { FoodItem } from '@/lib/types';
import FoodCard from './FoodCard';
import styles from './FoodList.module.css';

interface FoodListProps {
  items: FoodItem[];
}

export default function FoodList({ items }: FoodListProps) {
  return (
    <div className={styles.list}>
      {items.map((item) => (
        <FoodCard key={item.id} item={item} />
      ))}
    </div>
  );
}
