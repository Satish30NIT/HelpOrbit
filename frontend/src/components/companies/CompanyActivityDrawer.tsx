"use client";

import { Drawer } from "@/components/ui/Drawer";
import { CompanyActivityLogList } from "@/components/companies/CompanyActivityLogList";

type Props = {
  companyId: string | null;
  companyTitle?: string;
  open: boolean;
  onClose: () => void;
};

export function CompanyActivityDrawer({ companyId, companyTitle, open, onClose }: Props) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      size="wide"
      title="Company activity"
      description={companyTitle ? `Audit trail for ${companyTitle}` : "Audit trail"}
    >
      {companyId && open ? (
        <CompanyActivityLogList
          companyId={companyId}
          companyTitle={companyTitle}
          showMetrics={false}
        />
      ) : null}
    </Drawer>
  );
}
