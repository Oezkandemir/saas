import { Calendar, ChevronDown } from "lucide-react";
import { Button } from "./button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";
import { Label } from "./label";
import { Input } from "./input";

interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onDateChange: (start: Date | undefined, end: Date | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onDateChange,
  className,
}: DateRangePickerProps) {
  const formatDate = (date?: Date) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : undefined;
    onDateChange(date, endDate);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : undefined;
    onDateChange(startDate, date);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={className}>
          <Calendar className="h-4 w-4 mr-2" />
          {startDate && endDate
            ? `${formatDate(startDate)} - ${formatDate(endDate)}`
            : "Select date range"}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={formatDate(startDate)}
              onChange={handleStartDateChange}
            />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input
              type="date"
              value={formatDate(endDate)}
              onChange={handleEndDateChange}
              min={formatDate(startDate)}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
