import { useParams, useNavigate } from 'react-router-dom';
import { useDeals } from '../contexts/DealsContext';
import { BuyBoxWizard } from '../components/BuyBoxWizard';

export default function BuyBoxPage({ mode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { buy_boxes } = useDeals();

  const initialData = mode === 'edit' && id
    ? (buy_boxes || []).find(b => String(b.id) === id)
    : null;

  return (
    <BuyBoxWizard
      mode={mode === 'edit' ? 'edit' : 'new'}
      initialData={initialData || null}
      onSuccess={() => navigate('/buy-boxes')}
      onCancel={() => navigate(-1)}
    />
  );
}
