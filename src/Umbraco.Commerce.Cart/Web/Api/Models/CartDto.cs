namespace Umbraco.Commerce.Cart.Web.Api.Models;

public class CartDto
{
    public Guid Id { get; set; }
    public IEnumerable<BundlableCartItemDto> Items { get; set; }
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