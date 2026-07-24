import { Link } from 'react-router-dom';
import { formatCurrency } from '../format.js';

export default function PersonCard({ person }) {
  const balanceClass = person.balance > 0 ? 'positive' : 'zero';
  return (
    <Link to={`/people/${person.id}`} className="person-card">
      <div>
        <div className="name">{person.name}</div>
        {person.notes && <div className="notes">{person.notes}</div>}
      </div>
      <div className={`balance ${balanceClass}`}>{formatCurrency(person.balance)}</div>
    </Link>
  );
}
