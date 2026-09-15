namespace FutureWings.Application.DTOs.Admin;

public class AdminRevenueDto
{
    public string Currency { get; set; } = "BDT";
    public string CurrencySymbol { get; set; } = "৳";
    public decimal TotalGrossRevenueTk { get; set; }
    public decimal MonthlyRecurringRevenueTk { get; set; }
    public decimal AnnualRunRateTk { get; set; }
    public decimal AverageRevenuePerUserTk { get; set; }
    public decimal TotalGrossRevenueUsd { get; set; }
    public decimal MonthlyRecurringRevenueUsd { get; set; }
    public decimal AnnualRunRateUsd { get; set; }
    public decimal AverageRevenuePerUserUsd { get; set; }
    public int ActivePaidSubscribers { get; set; }
    public int TotalUsers { get; set; }
    public int FreeTierCount { get; set; }
    public int ProTierCount { get; set; }
    public int PremiumTierCount { get; set; }
    public IReadOnlyList<AdminTransactionDto> RecentTransactions { get; set; } = [];
    public IReadOnlyList<MonthlyRevenueDto> MonthlyBreakdown { get; set; } = [];
}

public class AdminTransactionDto
{
    public int Id { get; set; }
    public string StudentEmail { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal AmountTk { get; set; }
    public string Currency { get; set; } = "BDT";
    public string Status { get; set; } = string.Empty;
    public string Tier { get; set; } = string.Empty;
    public string Reference { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
}

public class MonthlyRevenueDto
{
    public string Month { get; set; } = string.Empty;
    public decimal GrossRevenueTk { get; set; }
    public decimal MrrTk { get; set; }
    public decimal GrossRevenueUsd { get; set; }
    public decimal MrrUsd { get; set; }
    public int SubscriberCount { get; set; }
}
