import { FoodItem } from '@/lib/types';
import styles from './FoodCard.module.css';
import Link from 'next/link';
import AllergenBadges from '@/components/allergens/AllergenBadges';
import FormattedText from '@/components/ui/FormattedText';
import { useCompany } from '@/components/context/CompanyProvider';

interface FoodCardProps {
  item: FoodItem;
}

export default function FoodCard({ item }: FoodCardProps) {
  const { config } = useCompany();

  return (
    <Link href={`/product/${item.id}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={item.image_url || '/placeholder.png'} 
          alt={item.name} 
          className={styles.image} 
          loading="lazy"
        />
      </div>
      <h3 className={styles.name}>{item.name}</h3>
      <AllergenBadges allergens={item.allergens} size="xs" showLabels={true} className="mt-1 mb-1.5" />
      {config?.show_prices && item.price !== undefined && item.price > 0 && (
        <span className={styles.price}>${item.price.toFixed(2)}</span>
      )}
      {item.description && (
        <p className={styles.description}>
          <FormattedText text={item.description} />
        </p>
      )}
    </Link>
  );
}
