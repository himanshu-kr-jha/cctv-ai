import { getSeverityClass } from '../utils/helpers';

export default function AlertBadge({ severity }) {
  return (
    <span className={getSeverityClass(severity)}>
      {severity}
    </span>
  );
}
