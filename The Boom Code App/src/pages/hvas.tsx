import { EntityListPage } from "@/components/entity-list-page";
import { HVA_CONFIG } from "@/types/entities";

export default function HvasPage() {
  return <EntityListPage config={HVA_CONFIG} />;
}
