type StarRatingProps = {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (value: number) => void;
};

export const StarRating = ({
  value,
  size = 'md',
  interactive = false,
  onChange,
}: StarRatingProps): JSX.Element => (
  <span className={`star-rating star-rating--${size}${interactive ? ' star-rating--interactive' : ''}`}>
    {[1, 2, 3, 4, 5].map((star) => {
      const filled = star <= value;
      if (interactive && onChange) {
        return (
          <button
            key={star}
            type="button"
            className={`star-rating__star${filled ? ' is-filled' : ''}`}
            onClick={() => onChange(star)}
            aria-label={`Rate ${star} stars`}
          >
            ★
          </button>
        );
      }
      return (
        <span key={star} className={`star-rating__star${filled ? ' is-filled' : ''}`} aria-hidden>
          ★
        </span>
      );
    })}
  </span>
);
