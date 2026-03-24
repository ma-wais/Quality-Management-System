import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ReviewUpdateLog, InsertReviewUpdateLog } from "@shared/schema";

export default function ReviewUpdateLogPage() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const role = localStorage.getItem('userRole') || 'admin';
  const canCreate = role === 'admin' || role === 'quality_manager';

  const { data: items = [], isLoading } = useQuery<ReviewUpdateLog[]>({
    queryKey: ["/api/review-update-log"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertReviewUpdateLog) =>
      apiRequest("POST", "/api/review-update-log", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/review-update-log"] });
      setOpen(false);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dateVal = formData.get("date") as string;
    const data: InsertReviewUpdateLog = {
      reviewNumber: formData.get("reviewNumber") as string,
      descriptionOfAmendment: formData.get("descriptionOfAmendment") as string,
      reasonForAmendment: (formData.get("reasonForAmendment") as string) || undefined,
      concernedParty: (formData.get("concernedParty") as string) || undefined,
      approvedBy: (formData.get("approvedBy") as string) || undefined,
    };
    if (dateVal) {
      (data as Record<string, unknown>).date = new Date(dateVal).toISOString();
    }
    createMutation.mutate(data);
  };

  const columns = [
    { key: "reviewNumber", header: t('reviewUpdateLog.reviewNumber') },
    {
      key: "date",
      header: t('reviewUpdateLog.date'),
      render: (item: ReviewUpdateLog) => (
        <span data-testid={`text-date-${item.id}`}>
          {item.date ? new Date(item.date).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "descriptionOfAmendment",
      header: t('reviewUpdateLog.descriptionOfAmendment'),
      render: (item: ReviewUpdateLog) => (
        <span className="line-clamp-2 text-sm" data-testid={`text-description-${item.id}`}>
          {item.descriptionOfAmendment}
        </span>
      ),
    },
    {
      key: "reasonForAmendment",
      header: t('reviewUpdateLog.reasonForAmendment'),
      render: (item: ReviewUpdateLog) => (
        <span className="line-clamp-2 text-sm text-muted-foreground" data-testid={`text-reason-${item.id}`}>
          {item.reasonForAmendment || "—"}
        </span>
      ),
    },
    {
      key: "concernedParty",
      header: t('reviewUpdateLog.concernedParty'),
      render: (item: ReviewUpdateLog) => (
        <span data-testid={`text-concerned-party-${item.id}`}>
          {item.concernedParty || "—"}
        </span>
      ),
    },
    {
      key: "approvedBy",
      header: t('reviewUpdateLog.approvedBy'),
      render: (item: ReviewUpdateLog) => (
        <span data-testid={`text-approved-by-${item.id}`}>
          {item.approvedBy || "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title={t('reviewUpdateLog.title')}
        description={t('reviewUpdateLog.description')}
      >
        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-review-log">
                <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('reviewUpdateLog.addReviewLog')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{t('reviewUpdateLog.addReviewLog')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reviewNumber">{t('reviewUpdateLog.reviewNumber')}</Label>
                  <Input id="reviewNumber" name="reviewNumber" required data-testid="input-review-number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">{t('reviewUpdateLog.date')}</Label>
                  <Input id="date" name="date" type="date" data-testid="input-date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descriptionOfAmendment">{t('reviewUpdateLog.descriptionOfAmendment')}</Label>
                  <Textarea id="descriptionOfAmendment" name="descriptionOfAmendment" required data-testid="input-description" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reasonForAmendment">{t('reviewUpdateLog.reasonForAmendment')}</Label>
                  <Textarea id="reasonForAmendment" name="reasonForAmendment" data-testid="input-reason" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="concernedParty">{t('reviewUpdateLog.concernedParty')}</Label>
                  <Input id="concernedParty" name="concernedParty" data-testid="input-concerned-party" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="approvedBy">{t('reviewUpdateLog.approvedBy')}</Label>
                  <Input id="approvedBy" name="approvedBy" data-testid="input-approved-by" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel-create">
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-review-log">
                    {createMutation.isPending ? t('common.loading') : t('common.submit')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <DataTable columns={columns} data={items} isLoading={isLoading} emptyMessage={t('common.noData')} />
        </CardContent>
      </Card>
    </div>
  );
}
