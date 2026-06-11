import type { RevenueChartPoint } from '../services/pricingService';
import { formatPrice } from '../utils/formatPrice';

type RevenueChartProps = {
  points: RevenueChartPoint[];
};

export const RevenueChart = ({ points }: RevenueChartProps): JSX.Element => {
  if (points.length === 0) {
    return <p className="text-secondary mb-0">No revenue data for this period.</p>;
  }

  const maxValue = Math.max(
    ...points.flatMap((point) => [point.revenue, Math.abs(point.profit), point.cost]),
    1,
  );

  return (
    <div className="revenue-chart" role="img" aria-label="Daily revenue and profit chart">
      <div className="revenue-chart__legend mb-3 d-flex flex-wrap gap-3 small">
        <span><span className="revenue-chart__swatch revenue-chart__swatch--revenue" /> Revenue</span>
        <span><span className="revenue-chart__swatch revenue-chart__swatch--cost" /> Cost</span>
        <span><span className="revenue-chart__swatch revenue-chart__swatch--profit" /> Profit</span>
      </div>
      <div className="revenue-chart__bars">
        {points.map((point) => {
          const revenueHeight = Math.max(8, Math.round((point.revenue / maxValue) * 100));
          const costHeight = Math.max(6, Math.round((point.cost / maxValue) * 100));
          const profitHeight = Math.max(6, Math.round((Math.max(point.profit, 0) / maxValue) * 100));
          return (
            <div key={point.date} className="revenue-chart__column">
              <div className="revenue-chart__stack">
                <div
                  className="revenue-chart__bar revenue-chart__bar--revenue"
                  style={{ height: `${revenueHeight}%` }}
                  title={`Revenue ${formatPrice(point.revenue)}`}
                />
                <div
                  className="revenue-chart__bar revenue-chart__bar--cost"
                  style={{ height: `${costHeight}%` }}
                  title={`Cost ${formatPrice(point.cost)}`}
                />
                <div
                  className="revenue-chart__bar revenue-chart__bar--profit"
                  style={{ height: `${profitHeight}%` }}
                  title={`Profit ${formatPrice(point.profit)}`}
                />
              </div>
              <span className="revenue-chart__label">{point.date.slice(5)}</span>
              <span className="revenue-chart__value">{formatPrice(point.profit)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
