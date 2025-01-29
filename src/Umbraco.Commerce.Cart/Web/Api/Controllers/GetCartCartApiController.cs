using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using Microsoft.AspNetCore.Http;
using Umbraco.Commerce.Cart.Web.Api.Attributes;
using Umbraco.Commerce.Cart.Web.Api.Models;
using Umbraco.Commerce.Core.Api;

namespace Umbraco.Commerce.Cart.Web.Api.Controllers;

[ApiVersion("1.0")]
[VersionedCartApiRoute("session")]
[ApiExplorerSettings(GroupName = "Session")]
public class GetCartCartApiController(IUmbracoCommerceApi umbracoCommerceApi) : UmbracoCommerceCartApiControllerBase
{
    private static readonly Dictionary<string, string> EMPTY_PROPERTIES = new();
    
    [HttpGet("cart")]
    [MapToApiVersion("1.0")]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCart(
        [FromRoute] StoreSessionDto session,
        CancellationToken token = default)
    {
        var store = Guid.TryParse(session.Store, out var storeId)
            ? await umbracoCommerceApi.GetStoreAsync(storeId)
            : await umbracoCommerceApi.GetStoreAsync(session.Store);

        var order = umbracoCommerceApi.GetCurrentOrderAsync(store.Id);
        
        // TODO: Map order to CartDto
        
        return Ok(null);
    }
}
