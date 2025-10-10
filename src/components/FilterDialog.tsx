import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Filter } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface FilterDialogProps {
  onFilterChange: (difficulty: string | null) => void;
  currentFilter: string | null;
}

const FilterDialog = ({ onFilterChange, currentFilter }: FilterDialogProps) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(currentFilter);
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const handleApply = () => {
    onFilterChange(selectedDifficulty);
    setOpen(false);
  };

  const handleClear = () => {
    setSelectedDifficulty(null);
    onFilterChange(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="hidden md:flex">
          <Filter className="h-4 w-4 mr-2" />
          {t("filters")}
          {currentFilter && <span className="ml-2 text-xs">(1)</span>}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("filter_tasks")}</DialogTitle>
          <DialogDescription>
            {t("choose_criteria_to_filter_tasks")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>{t("difficulty")}</Label>
            <RadioGroup value={selectedDifficulty || ""} onValueChange={setSelectedDifficulty}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="" id="all" />
                <Label htmlFor="all" className="font-normal cursor-pointer">
                  {t("all_difficulties")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Fácil" id="easy" />
                <Label htmlFor="easy" className="font-normal cursor-pointer">
                  {t("easy")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Médio" id="medium" />
                <Label htmlFor="medium" className="font-normal cursor-pointer">
                  {t("medium")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Difícil" id="hard" />
                <Label htmlFor="hard" className="font-normal cursor-pointer">
                  {t("hard")}
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleClear}>
            {t("clear_filters")}
          </Button>
          <Button onClick={handleApply}>
            {t("apply")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilterDialog;