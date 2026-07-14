namespace Umbraco.Commerce.Cart.Web.Api.Models;

public class CartDto
{
    public Guid Id { get; set; }
    public IEnumerable<BundlableCartItemDto> Items { get; set; }

    /// <summary>
    /// The subtotal before any discounts are applied. This matches the sum of the (un-adjusted)
    /// cart item totals so the cart line items and the subtotal reconcile.
    /// </summary>
    public FormattedPriceDto SubtotalBeforeDiscounts { get; set; }

    /// <summary>
    /// The total discount applied to the subtotal (a negative amount), or <c>null</c> when no
    /// discount applies.
    /// </summary>
    public FormattedPriceDto? Discount { get; set; }

    /// <summary>
    /// The names of the discounts that have been applied to the cart.
    /// </summary>
    public IEnumerable<string> DiscountNames { get; set; } = [];

    /// <summary>
    /// The subtotal after discounts have been applied.
    /// </summary>
    public FormattedPriceDto Subtotal { get; set; }
}

public class BundlableCartItemDto : CartItemDto
{
    public string? BundleReference { get; set; }
    
    public FormattedPriceDto? BasePrice { get; set; }
    public IEnumerable<CartItemDto> Items { get; set; }
}

public class CartItemDto
{
    public Guid Id { get; set; }
    public string ProductReference { get; set; }
    public string ProductVariantReference { get; set; }
    public string Sku { get; set; }
    public string Name { get; set; }
    
    public string ImageUrl { get; set; }
    public FormattedPriceDto UnitPrice { get; set; }
    public decimal Quantity { get; set; }
    public FormattedPriceDto Total { get; set; }
    public Dictionary<string, string> Properties { get; set; }
    
    public Dictionary<string, string> Attributes { get; set; }
}

public class FormattedPriceDto
{
    public string WithTax { get; set; }
    public string Tax { get; set; }
    public string WithoutTax { get; set; }
}