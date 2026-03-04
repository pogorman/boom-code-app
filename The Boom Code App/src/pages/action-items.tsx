import { EntityListPage } from "@/components/entity-list-page";
import { ACTION_ITEM_CONFIG } from "@/types/entities";

export default function ActionItemsPage() {
  return <EntityListPage config={ACTION_ITEM_CONFIG} />;
}
