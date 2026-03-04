import { EntityListPage } from "@/components/entity-list-page";
import { IMPACT_CONFIG } from "@/types/entities";

export default function ImpactsPage() {
  return <EntityListPage config={IMPACT_CONFIG} />;
}
