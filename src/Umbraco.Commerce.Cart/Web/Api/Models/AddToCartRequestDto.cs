namespace Umbraco.Commerce.Cart.Web.Api.Models;

public class AddToCartRequestDto : AddToCartResponseBaseDto
{
    public string? BundleReference { get; set; }
    public IList<AddToCartResponseBaseDto>? BundleItems { get; set; }
}

public class AddToCartResponseBaseDto
{
    public string ProductReference { get; set; }
    public string? ProductVariantReference { get; set; }
    public decimal? Quantity { get; set; }
    public IDictionary<string, string>? Properties { get; set; }
}