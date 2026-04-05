import { GoogleCalendarConfigCard } from './GoogleCalendarConfigCard';
import { FathomConfigCard } from './FathomConfigCard';

export const IntegrationsTab = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Integrations</h2>
        <p className="text-sm text-muted-foreground">
          Manage third-party service connections
        </p>
      </div>
      <GoogleCalendarConfigCard />
      <FathomConfigCard />
    </div>
  );
};
