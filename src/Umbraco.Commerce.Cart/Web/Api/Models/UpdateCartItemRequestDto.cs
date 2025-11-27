namespace Umbraco.Commerce.Cart.Web.Api.Models;

public class UpdateCartItemRequestDto
{
    public decimal? Quantity { get; set; }
    
    public IDictionary<string, string>? Properties { get; set; }
}