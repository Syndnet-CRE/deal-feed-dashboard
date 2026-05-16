import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDeals } from '../contexts/DealsContext';
import BuyBoxConfigurator from '../components/BuyBoxConfigurator/BuyBoxConfigurator';
import { BuyBoxRightRail } from '../components/BuyBoxRightRail';
import { api } from '../lib/api';
import '../styles/buy-box-configurator.css';

export default function BuyBoxPage({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buy_boxes } = useDeals();
  const [form, setForm] = useState(null);
  const [matchCount, setMatchCount] = useState(null);
  const [loading, setLoading] = useState(mode === 'edit');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (mode === 'new') {
      setForm({});
      return;
    }

    if (mode === 'edit') {
      if (buy_boxes && buy_boxes.length > 0) {
        const box = buy_boxes.find(b => String(b.id) === id);
        if (box) {
          setForm(box);
          setLoading(false);
        } else {
          setError('Buy box not found');
          setLoading(false);
        }
      } else {
        setError('Failed to load buy box');
        setLoading(false);
      }
    }
  }, [mode, id, buy_boxes]);

  if (loading) {
    return (
      <div className="buy-box-page">
        <div className="buy-box-loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="buy-box-page">
        <div className="buy-box-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="buy-box-page">
      <div className="buy-box-main">
        <div className="buy-box-steps">
          <BuyBoxConfigurator
            form={form}
            onChange={setForm}
            mode={mode}
            boxId={id}
            onMatchCount={setMatchCount}
          />
        </div>
        <div className="buy-box-rail">
          <BuyBoxRightRail matchCount={matchCount} form={form || {}} />
        </div>
      </div>
    </div>
  );
}
