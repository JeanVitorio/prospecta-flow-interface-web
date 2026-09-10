import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/store/AppStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/services/bots";
import type { BotConfig, BotFormData } from "@/types/bots";

interface BotFormDialogProps {
  open: boolean;
  current?: BotConfig;
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (form: BotFormData) => void;
  onDelete?: () => void;
}

const lines = (value: string) =>
  [...new Set(value.split(/\r?\n|;/).map((item) => item.trim()).filter(Boolean))];

export function BotFormDialog({
  open,
  current,
  saving,
  onOpenChange,
  onSave,
  onDelete,
}: BotFormDialogProps) {
  const { user } = useAuth();
  const { users } = useApp();
  const isAdmin = user?.role === "leader";
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [niche, setNiche] = useState("");
  const [cities, setCities] = useState("");
  const [included, setIncluded] = useState("");
  const [excluded, setExcluded] = useState("");
  const [minReviews, setMinReviews] = useState(0);
  const [ticket, setTicket] = useState(0);
  const [maxScrolls, setMaxScrolls] = useState(10);
  const [headless, setHeadless] = useState(true);

  useEffect(() => {
    if (!open) return;
    setName(current?.name ?? "");
    setSlug(current?.slug ?? "");
    setOwnerId(current?.lead_owner_id ?? user?.id ?? "");
    setSearchTerm(current?.search_term ?? "");
    setNiche(current?.niche ?? "");
    setCities((current?.cities ?? []).join("\n"));
    setIncluded((current?.included_words ?? []).join("\n"));
    setExcluded((current?.excluded_words ?? []).join("\n"));
    setMinReviews(current?.min_reviews ?? 0);
    setTicket(Number(current?.estimated_ticket ?? 0));
    setMaxScrolls(current?.max_scrolls ?? 10);
    setHeadless(current?.headless ?? true);
  }, [current, open, user?.id]);

  const selectedOwner = users.find((item) => item.id === ownerId);

  function submit() {
    const cityList = lines(cities);
    if (!name.trim() || !searchTerm.trim() || !niche.trim() || !cityList.length) {
      return;
    }
    onSave({
      name: name.trim(),
      slug: slug.trim() || slugify(name),
      lead_owner_id: ownerId,
      owner_email: selectedOwner?.email || user?.email || "",
      search_term: searchTerm.trim(),
      niche: niche.trim(),
      cities: cityList,
      min_reviews: Math.max(0, minReviews),
      estimated_ticket: Math.max(0, ticket),
      headless,
      max_scrolls: Math.max(1, maxScrolls),
      excluded_words: lines(excluded),
      included_words: lines(included),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{current ? "Editar bot" : "Novo bot"}</DialogTitle>
        </DialogHeader>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div>
            <Label>Slug</Label>
            <Input
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="Gerado automaticamente"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Responsável</Label>
            {isAdmin ? (
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {users.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} · {item.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={user?.email ?? ""} disabled />
            )}
          </div>
          <div>
            <Label>Termo de busca</Label>
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Lojas de veículos"
            />
          </div>
          <div>
            <Label>Nicho</Label>
            <Input value={niche} onChange={(event) => setNiche(event.target.value)} />
          </div>
          <div>
            <Label>Ticket estimado</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={ticket}
              onChange={(event) => setTicket(Number(event.target.value))}
            />
          </div>
          <div>
            <Label>Mínimo de avaliações</Label>
            <Input
              type="number"
              min={0}
              value={minReviews}
              onChange={(event) => setMinReviews(Number(event.target.value))}
            />
          </div>
          <div>
            <Label>Máximo de rolagens</Label>
            <Input
              type="number"
              min={1}
              value={maxScrolls}
              onChange={(event) => setMaxScrolls(Number(event.target.value))}
            />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch checked={headless} onCheckedChange={setHeadless} />
            <Label>Executar navegador em modo headless</Label>
          </div>
          <div className="sm:col-span-2">
            <Label>Cidades — uma por linha</Label>
            <Textarea rows={5} value={cities} onChange={(e) => setCities(e.target.value)} />
          </div>
          <div>
            <Label>Palavras incluídas</Label>
            <Textarea rows={4} value={included} onChange={(e) => setIncluded(e.target.value)} />
          </div>
          <div>
            <Label>Palavras excluídas</Label>
            <Textarea rows={4} value={excluded} onChange={(e) => setExcluded(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="sm:justify-between gap-2">
          <div>
            {current && onDelete && (
              <Button
                variant="ghost"
                className="text-destructive"
                onClick={onDelete}
                disabled={saving}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Excluir
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
