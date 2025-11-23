import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative overflow-hidden group"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0 group-hover:text-warning" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100 group-hover:text-primary" />
          <span className="sr-only">Alternar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="animate-fade-in backdrop-blur-xl bg-card/95 border-border/50"
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="cursor-pointer transition-all duration-300 hover:bg-primary/10"
        >
          <Sun className="mr-2 h-4 w-4 transition-transform duration-300 hover:scale-110" />
          <span className={theme === "light" ? "font-semibold text-primary" : ""}>Claro</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="cursor-pointer transition-all duration-300 hover:bg-primary/10"
        >
          <Moon className="mr-2 h-4 w-4 transition-transform duration-300 hover:scale-110" />
          <span className={theme === "dark" ? "font-semibold text-primary" : ""}>Escuro</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="cursor-pointer transition-all duration-300 hover:bg-primary/10"
        >
          <Monitor className="mr-2 h-4 w-4 transition-transform duration-300 hover:scale-110" />
          <span className={theme === "system" ? "font-semibold text-primary" : ""}>Sistema</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
