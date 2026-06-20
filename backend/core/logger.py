import logging
from rich.console import Console
from rich.logging import RichHandler
from rich.table import Table
from rich.panel import Panel

# Global rich console instance
console = Console()

def setup_logger():
    """Overrides the default Python logger with Rich for beautiful formatting."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(message)s",
        datefmt="[%X]",
        handlers=[RichHandler(rich_tracebacks=True)]
    )

def print_server_dashboard(active_users: list):
    """Generates a live, color-coded dashboard of server activity."""
    console.clear()
    console.print(Panel("[bold green]Distributed Chat Server - Live Dashboard[/bold green]", expand=False))
    
    table = Table(show_header=True, header_style="bold magenta")
    table.add_column("Username", style="cyan", width=20)
    table.add_column("Status", style="green")
    
    # We now iterate directly over the list of strings
    for user in active_users:
        table.add_row(user, "🟢 Online")
        
    if not active_users:
        table.add_row("No active users", "🔴 Offline")
        
    console.print(table)
    console.print(f"[bold yellow]Total Active Connections:[/bold yellow] {len(active_users)}")
    console.print("-" * 50)