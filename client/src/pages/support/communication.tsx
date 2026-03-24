import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { CommunicationRecord, InsertCommunicationRecord } from "@shared/schema";
import { EvidenceUpload } from "@/components/evidence-upload";

export default function CommunicationPage() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<CommunicationRecord | null>(null);
  const { toast } = useToast();

  const { data: records = [], isLoading } = useQuery<CommunicationRecord[]>({
    queryKey: ["/api/communication-records"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertCommunicationRecord) =>
      apiRequest("POST", "/api/communication-records", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communication-records"] });
      setOpen(false);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<InsertCommunicationRecord> }) =>
      apiRequest("PATCH", `/api/communication-records/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communication-records"] });
      setEditOpen(false);
      setEditItem(null);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      date: new Date(formData.get("date") as string),
      party: formData.get("party") as string,
      subject: formData.get("subject") as string,
      method: formData.get("method") as string,
      result: formData.get("result") as string,
      followUp: formData.get("followUp") as string,
    });
  };

  const handleEdit = (item: CommunicationRecord) => {
    setEditItem(item);
    setEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editItem) return;
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: editItem.id,
      updates: {
        date: new Date(formData.get("date") as string),
        party: formData.get("party") as string,
        subject: formData.get("subject") as string,
        method: formData.get("method") as string,
        result: formData.get("result") as string,
        followUp: formData.get("followUp") as string,
      },
    });
  };

  const columns = [
    {
      key: "date",
      header: t('common.date'),
      render: (item: CommunicationRecord) => item.date ? new Date(item.date).toLocaleDateString() : "-",
    },
    { key: "party", header: t('communication.party') },
    { key: "subject", header: t('communication.subject') },
    { key: "method", header: t('communication.method') },
    { key: "result", header: t('communication.result') },
    { key: "followUp", header: t('communication.followUp') },
    {
      key: "actions",
      header: t('common.actions'),
      render: (item: CommunicationRecord) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleEdit(item)}
          data-testid={`button-edit-communication-${item.id}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader title={t('communication.title')} description={t('communication.description')} clause="7.4" />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">{t('communication.records')}</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-communication">
                <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('communication.addRecord')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('communication.addRecord')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">{t('common.date')}</Label>
                    <Input id="date" name="date" type="date" required data-testid="input-date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="method">{t('communication.method')}</Label>
                    <Select name="method" required>
                      <SelectTrigger data-testid="select-method">
                        <SelectValue placeholder={t('communication.selectMethod')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">{t('communication.methods.email')}</SelectItem>
                        <SelectItem value="meeting">{t('communication.methods.meeting')}</SelectItem>
                        <SelectItem value="phone">{t('communication.methods.phone')}</SelectItem>
                        <SelectItem value="letter">{t('communication.methods.letter')}</SelectItem>
                        <SelectItem value="report">{t('communication.methods.report')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="party">{t('communication.party')}</Label>
                  <Input id="party" name="party" required data-testid="input-party" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">{t('communication.subject')}</Label>
                  <Input id="subject" name="subject" required data-testid="input-subject" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="result">{t('communication.result')}</Label>
                  <Textarea id="result" name="result" data-testid="input-result" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="followUp">{t('communication.followUp')}</Label>
                  <Textarea id="followUp" name="followUp" data-testid="input-followup" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-communication">
                    {createMutation.isPending ? t('common.loading') : t('common.add')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} data={records} isLoading={isLoading} emptyMessage={t('common.noData')} />
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('communication.editRecord')}</DialogTitle>
          </DialogHeader>
          {editItem && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">{t('common.date')}</Label>
                  <Input id="edit-date" name="date" type="date" defaultValue={editItem.date ? new Date(editItem.date).toISOString().split('T')[0] : ""} required data-testid="input-edit-date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-method">{t('communication.method')}</Label>
                  <Select name="method" defaultValue={editItem.method || ""}>
                    <SelectTrigger data-testid="select-edit-method">
                      <SelectValue placeholder={t('communication.selectMethod')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">{t('communication.methods.email')}</SelectItem>
                      <SelectItem value="meeting">{t('communication.methods.meeting')}</SelectItem>
                      <SelectItem value="phone">{t('communication.methods.phone')}</SelectItem>
                      <SelectItem value="letter">{t('communication.methods.letter')}</SelectItem>
                      <SelectItem value="report">{t('communication.methods.report')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-party">{t('communication.party')}</Label>
                <Input id="edit-party" name="party" defaultValue={editItem.party || ""} required data-testid="input-edit-party" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-subject">{t('communication.subject')}</Label>
                <Input id="edit-subject" name="subject" defaultValue={editItem.subject || ""} required data-testid="input-edit-subject" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-result">{t('communication.result')}</Label>
                <Textarea id="edit-result" name="result" defaultValue={editItem.result || ""} data-testid="input-edit-result" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-followUp">{t('communication.followUp')}</Label>
                <Textarea id="edit-followUp" name="followUp" defaultValue={editItem.followUp || ""} data-testid="input-edit-followup" />
              </div>
              <div className="space-y-2">
                <Label>Evidence / الأدلة</Label>
                <EvidenceUpload module="communication-records" entityId={editItem.id} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-update-communication">
                  {updateMutation.isPending ? t('common.loading') : t('common.update')}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
