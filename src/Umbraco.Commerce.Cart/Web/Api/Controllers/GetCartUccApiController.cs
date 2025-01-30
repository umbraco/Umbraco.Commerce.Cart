using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using Microsoft.AspNetCore.Http;
using Umbraco.Commerce.Cart.Web.Api.Attributes;
using Umbraco.Commerce.Cart.Web.Api.Models;
using Umbraco.Commerce.Cart.Web.Api.Models.Factories;
using Umbraco.Commerce.Core.Api;

namespace Umbraco.Commerce.Cart.Web.Api.Controllers;

[ApiVersion("1.0")]
[VersionedCartApiRoute("session")]
[ApiExplorerSettings(GroupName = "Session")]
public class GetCartUccApiController(IUmbracoCommerceApi umbracoCommerceApi, IServiceProvider serviceProvider) : UccApiControllerBase
{
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

        var order = await umbracoCommerceApi.GetCurrentOrderAsync(store.Id);
        if (order == null)
        {
            return Ok(null);
        }

        var ctx = new MappingContext(serviceProvider);
        var dto = await CartModelFactory.EntityToDtoAsync(ctx, order);
        
        return Ok(dto);
    }
}
