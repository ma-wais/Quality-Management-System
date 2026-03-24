import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { statusColors } from "@/lib/types";
import { EvidenceUpload } from "@/components/evidence-upload";
import type { AwarenessRecord, InsertAwarenessRecord } from "@shared/schema";

export default function AwarenessPage() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<AwarenessRecord | null>(null);
  const { toast } = useToast();

  const { data: records = [], isLoading } = useQuery<AwarenessRecord[]>({
    queryKey: ["/api/awareness-records"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertAwarenessRecord) =>
      apiRequest("POST", "/api/awareness-records", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/awareness-records"] });
      setOpen(false);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<InsertAwarenessRecord> }) =>
      apiRequest("PATCH", `/api/awareness-records/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/awareness-records"] });
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
      topic: formData.get("topic") as string,
      description: formData.get("description") as string,
      targetAudience: formData.get("targetAudience") as string,
      method: formData.get("method") as string,
      date: formData.get("date") ? new Date(formData.get("date") as string) : undefined,
      status: formData.get("status") as string,
      evidence: formData.get("evidence") as string,
    });
  };

  const handleEdit = (item: AwarenessRecord) => {
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
        topic: formData.get("topic") as string,
        description: formData.get("description") as string,
        targetAudience: formData.get("targetAudience") as string,
        method: formData.get("method") as string,
        date: formData.get("date") ? new Date(formData.get("date") as string) : undefined,
        status: formData.get("status") as string,
        evidence: formData.get("evidence") as string,
      },
    });
  };

  const columns = [
    { key: "topic", header: t('awareness.topic') },
    { key: "description", header: t('common.description') },
    { key: "targetAudience", header: t('awareness.targetAudience') },
    { key: "method", header: t('awareness.method') },
    {
      key: "date",
      header: t('common.date'),
      render: (item: AwarenessRecord) => item.date ? new Date(item.date).toLocaleDateString() : "-",
    },
    {
      key: "status",
      header: t('common.status'),
      render: (item: AwarenessRecord) => <Badge className={statusColors[item.status] || ""}>{t(`status.${item.status}`)}</Badge>,
    },
    {
      key: "actions",
      header: t('common.actions'),
      render: (item: AwarenessRecord) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleEdit(item)}
          data-testid={`button-edit-awareness-${item.id}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader title={t('awareness.title')} description={t('awareness.description')} clause="7.3" />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">{t('awareness.activities')}</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-awareness">
                <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('awareness.addActivity')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('awareness.addActivity')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">{t('awareness.topic')}</Label>
                  <Input id="topic" name="topic" required data-testid="input-topic" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{t('common.description')}</Label>
                  <Textarea id="description" name="description" required data-testid="input-description" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetAudience">{t('awareness.targetAudience')}</Label>
                    <Input id="targetAudience" name="targetAudience" data-testid="input-audience" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="method">{t('awareness.method')}</Label>
                    <Select name="method">
                      <SelectTrigger data-testid="select-method">
                        <SelectValue placeholder={t('awareness.selectMethod')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="training">{t('awareness.methods.training')}</SelectItem>
                        <SelectItem value="email">{t('awareness.methods.email')}</SelectItem>
                        <SelectItem value="meeting">{t('awareness.methods.meeting')}</SelectItem>
                        <SelectItem value="poster">{t('awareness.methods.poster')}</SelectItem>
                        <SelectItem value="induction">{t('awareness.methods.induction')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">{t('common.date')}</Label>
                    <Input id="date" name="date" type="date" data-testid="input-date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">{t('common.status')}</Label>
                    <Select name="status" defaultValue="planned">
                      <SelectTrigger data-testid="select-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">{t('status.planned')}</SelectItem>
                        <SelectItem value="completed">{t('status.completed')}</SelectItem>
                        <SelectItem value="ongoing">{t('status.ongoing')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="evidence">{t('awareness.evidence')}</Label>
                  <Textarea id="evidence" name="evidence" data-testid="input-evidence" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-awareness">
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
            <DialogTitle>{t('awareness.editActivity')}</DialogTitle>
          </DialogHeader>
          {editItem && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-topic">{t('awareness.topic')}</Label>
                <Input id="edit-topic" name="topic" defaultValue={editItem.topic || ""} required data-testid="input-edit-topic" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">{t('common.description')}</Label>
                <Textarea id="edit-description" name="description" defaultValue={editItem.description || ""} required data-testid="input-edit-description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-targetAudience">{t('awareness.targetAudience')}</Label>
                  <Input id="edit-targetAudience" name="targetAudience" defaultValue={editItem.targetAudience || ""} data-testid="input-edit-audience" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-method">{t('awareness.method')}</Label>
                  <Select name="method" defaultValue={editItem.method || ""}>
                    <SelectTrigger data-testid="select-edit-method">
                      <SelectValue placeholder={t('awareness.selectMethod')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="training">{t('awareness.methods.training')}</SelectItem>
                      <SelectItem value="email">{t('awareness.methods.email')}</SelectItem>
                      <SelectItem value="meeting">{t('awareness.methods.meeting')}</SelectItem>
                      <SelectItem value="poster">{t('awareness.methods.poster')}</SelectItem>
                      <SelectItem value="induction">{t('awareness.methods.induction')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">{t('common.date')}</Label>
                  <Input id="edit-date" name="date" type="date" defaultValue={editItem.date ? new Date(editItem.date).toISOString().split('T')[0] : ""} data-testid="input-edit-date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">{t('common.status')}</Label>
                  <Select name="status" defaultValue={editItem.status || "planned"}>
                    <SelectTrigger data-testid="select-edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">{t('status.planned')}</SelectItem>
                      <SelectItem value="completed">{t('status.completed')}</SelectItem>
                      <SelectItem value="ongoing">{t('status.ongoing')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-evidence">{t('awareness.evidence')}</Label>
                <Textarea id="edit-evidence" name="evidence" defaultValue={editItem.evidence || ""} data-testid="input-edit-evidence" />
              </div>
              <div className="space-y-2">
                <Label>Evidence / الأدلة</Label>
                <EvidenceUpload module="awareness-records" entityId={editItem.id} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-update-awareness">
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
