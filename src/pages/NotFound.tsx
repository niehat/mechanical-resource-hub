import { NotFoundPanel } from '../components/ui';
import { useTitle } from '../hooks/useTitle';

export default function NotFound() {
  useTitle('Page not found | Mechanical Academic Resource Hub');
  return <NotFoundPanel />;
}
