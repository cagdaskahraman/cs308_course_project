type LoadingStateProps = {
  label?: string;
};

export const LoadingState = ({ label = 'Loading…' }: LoadingStateProps): JSX.Element => (
  <div className="state-panel" role="status" aria-live="polite">
    <div className="state-panel__spinner" aria-hidden />
    <p className="state-panel__text">{label}</p>
  </div>
);
