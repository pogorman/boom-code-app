import { EntityListPage } from "@/components/entity-list-page";
import { ACCOUNT_CONFIG } from "@/types/entities";

export default function AccountsPage() {
  return <EntityListPage config={ACCOUNT_CONFIG} />;
}
