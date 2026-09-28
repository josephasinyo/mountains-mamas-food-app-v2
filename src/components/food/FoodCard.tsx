import { FoodItem } from '@/lib/types';
import styles from './FoodCard.module.css';
import Link from 'next/link';
import AllergenBadges from '@/components/allergens/AllergenBadges';
import FormattedText from '@/components/ui/FormattedText';
import { useCompany } from '@/components/context/CompanyProvider';

interface FoodCardProps {
  item: FoodItem;
}

function cleanCardDescription(desc?: string | null): string {
  if (!desc) return '';
  return desc
    // Strip <mark>...</mark> highlighted text
    .replace(/<mark[\s\S]*?>[\s\S]*?<\/mark>/gi, '')
    // Strip ==...== markdown highlights
    .replace(/==[\s\S]*?==/gi, '')
    // Strip any "Remember..." reminder sentence/paragraph
    .replace(/(?:<br\s*\/?>|\n)*\s*(?:\*|_)*Remember[\s\S]*$/i, '')
    .replace(/Remember\.\.\.[\s\S]*?(?:\.|$)/gi, '')
    .trim();
}

export default function FoodCard({ item }: FoodCardProps) {
  const { config } = useCompany();
  const cardDescription = cleanCardDescription(item.description);

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
      {cardDescription && (
        <p className={styles.description}>
          <FormattedText text={cardDescription} />
        </p>
      )}
    </Link>
  );
}
