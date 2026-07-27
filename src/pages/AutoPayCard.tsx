import React, { useState } from 'react';
import { FormField } from '../components/FormField';
import { useTheme } from '../hooks/useTheme';
import './AutoPayCard.css';

interface AutoPayCardProps {
  onSubmit?: (data: AutoPayData) => void;
  onCancel?: () => void;
}

interface AutoPayData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  billingAddress: string;
  autoPayEnabled: boolean;
}

export const AutoPayCard: React.FC<AutoPayCardProps> = ({
  onSubmit,
  onCancel,
}) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState<AutoPayData>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    billingAddress: '',
    autoPayEnabled: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof AutoPayData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof AutoPayData, boolean>>>({});

  const validateField = (name: keyof AutoPayData, value: string): string => {
    switch (name) {
      case 'cardNumber':
        const cardNumberClean = value.replace(/\s/g, '');
        if (!cardNumberClean) return 'Card number is required';
        if (!/^\d{15,16}$/.test(cardNumberClean)) return 'Card number must be 15-16 digits';
        return '';
      case 'expiryDate':
        if (!value) return 'Expiry date is required';
        if (!/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(value)) return 'Invalid expiry date format (MM/YY)';
        const [month, year] = value.split('/');
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear() % 100;
        const currentMonth = currentDate.getMonth() + 1;
        if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
          return 'Card has expired';
        }
        return '';
      case 'cvv':
        if (!value) return 'CVV is required';
        if (!/^\d{3,4}$/.test(value)) return 'CVV must be 3-4 digits';
        return '';
      case 'cardholderName':
        if (!value.trim()) return 'Cardholder name is required';
        if (!/^[a-zA-Z\s'-]{2,50}$/.test(value.trim())) return 'Invalid name format';
        return '';
      case 'billingAddress':
        if (!value.trim()) return 'Billing address is required';
        if (value.trim().length < 5) return 'Address must be at least 5 characters';
        return '';
      default:
        return '';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AutoPayData, string>> = {};
    let isValid = true;

    (Object.keys(formData) as Array<keyof AutoPayData>).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (name: keyof AutoPayData, value: string) => {
    // Format card number with spaces
    if (name === 'cardNumber') {
      const cleaned = value.replace(/\s/g, '');
      const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
      setFormData((prev) => ({ ...prev, [name]: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (name: keyof AutoPayData) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name]);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit?.(formData);
    }
  };

  // Generate help text IDs for aria-describedby
  const getDescribedBy = (fieldName: keyof AutoPayData): string => {
    const ids: string[] = [];
    const helpId = `${fieldName}-help`;
    const errorId = `${fieldName}-error`;
    const formatId = `${fieldName}-format`;

    if (touched[fieldName]) {
      if (errors[fieldName]) {
        ids.push(errorId);
      }
    }

    // Add help text for specific fields
    if (fieldName === 'cardNumber') {
      ids.push(formatId);
    }
    if (fieldName === 'expiryDate') {
      ids.push(formatId);
    }

    ids.push(helpId);
    return ids.join(' ');
  };

  return (
    <div className={`autopay-card ${theme}`}>
      <div className="autopay-card__header">
        <h2>AutoPay Card Setup</h2>
        <p>Set up automatic payments for your credit card</p>
      </div>

      <form onSubmit={handleSubmit} className="autopay-card__form" noValidate>
        <FormField
          id="cardNumber"
          name="cardNumber"
          label="Card Number"
          type="text"
          value={formData.cardNumber}
          onChange={(value) => handleChange('cardNumber', value)}
          onBlur={() => handleBlur('cardNumber')}
          placeholder="1234 5678 9012 3456"
          error={touched.cardNumber ? errors.cardNumber : ''}
          describedBy={getDescribedBy('cardNumber')}
          helpText="Enter the 15-16 digit card number"
          formatText="Format: XXXX XXXX XXXX XXXX"
          required
          autoComplete="cc-number"
        />

        <div className="autopay-card__row">
          <FormField
            id="expiryDate"
            name="expiryDate"
            label="Expiry Date"
            type="text"
            value={formData.expiryDate}
            onChange={(value) => handleChange('expiryDate', value)}
            onBlur={() => handleBlur('expiryDate')}
            placeholder="MM/YY"
            error={touched.expiryDate ? errors.expiryDate : ''}
            describedBy={getDescribedBy('expiryDate')}
            helpText="Enter the expiration date"
            formatText="Format: MM/YY"
            required
            autoComplete="cc-exp"
          />

          <FormField
            id="cvv"
            name="cvv"
            label="CVV"
            type="password"
            value={formData.cvv}
            onChange={(value) => handleChange('cvv', value)}
            onBlur={() => handleBlur('cvv')}
            placeholder="•••"
            error={touched.cvv ? errors.cvv : ''}
            describedBy={getDescribedBy('cvv')}
            helpText="3-4 digit security code"
            required
            autoComplete="cc-csc"
            maxLength={4}
          />
        </div>

        <FormField
          id="cardholderName"
          name="cardholderName"
          label="Cardholder Name"
          type="text"
          value={formData.cardholderName}
          onChange={(value) => handleChange('cardholderName', value)}
          onBlur={() => handleBlur('cardholderName')}
          placeholder="John Doe"
          error={touched.cardholderName ? errors.cardholderName : ''}
          describedBy={getDescribedBy('cardholderName')}
          helpText="Name as it appears on the card"
          required
          autoComplete="cc-name"
        />

        <FormField
          id="billingAddress"
          name="billingAddress"
          label="Billing Address"
          type="text"
          value={formData.billingAddress}
          onChange={(value) => handleChange('billingAddress', value)}
          onBlur={() => handleBlur('billingAddress')}
          placeholder="123 Main St, City, State, ZIP"
          error={touched.billingAddress ? errors.billingAddress : ''}
          describedBy={getDescribedBy('billingAddress')}
          helpText="Enter your billing address"
          required
          autoComplete="street-address"
        />

        <div className="autopay-card__toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={formData.autoPayEnabled}
              onChange={(e) => setFormData((prev) => ({ ...prev, autoPayEnabled: e.target.checked }))}
              aria-describedby="autopay-help"
            />
            <span>Enable AutoPay</span>
          </label>
          <p id="autopay-help" className="toggle-help">
            Automatically pay your balance each month
          </p>
        </div>

        <div className="autopay-card__actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Set Up AutoPay
          </button>
        </div>
      </form>
    </div>
  );
};
