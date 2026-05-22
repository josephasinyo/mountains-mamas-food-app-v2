import { FoodItem } from '@/lib/types';
import styles from './FoodCard.module.css';
import Link from 'next/link';
import Image from 'next/image';
import { useCompany } from '@/components/context/CompanyProvider';

interface FoodCardProps {
  item: FoodItem;
}

export default function FoodCard({ item }: FoodCardProps) {
  const { config } = useCompany();

  return (
    <Link href={`/product/${item.id}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        <Image 
          src={item.image_url || '/placeholder.png'} 
          alt={item.name} 
          fill
          className={styles.image}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <h3 className={styles.name}>{item.name}</h3>
      {config?.show_prices && item.price !== undefined && item.price > 0 && (
        <span className={styles.price}>${item.price.toFixed(2)}</span>
      )}
      {item.description && <p className={styles.description}>{item.description}</p>}
    </Link>
  );
}
