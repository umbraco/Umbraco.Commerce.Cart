using Microsoft.AspNetCore.Mvc;
using Umbraco.Commerce.Extensions;
using Asp.Versioning;
using Microsoft.AspNetCore.Http;
using Umbraco.Commerce.Cart.Web.Api.Attributes;
using Umbraco.Commerce.Cart.Web.Api.Models;
using Umbraco.Commerce.Common.Validation;
using Umbraco.Commerce.Core.Api;

namespace Umbraco.Commerce.Cart.Web.Api.Controllers;

[ApiVersion("1.0")]
[VersionedCartApiRoute("session")]
[ApiExplorerSettings(GroupName = "Session")]
public class UpdateCartItemUccApiController(IUmbracoCommerceApi umbracoCommerceApi) : UccApiControllerBase
{
    [HttpPut("cart/{id:guid}")]
    [MapToApiVersion("1.0")]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateCartItem(
        [FromRoute] StoreSessionDto session,
        [FromRoute] Guid id,
        [FromBody] UpdateCartItemRequestDto model,
        CancellationToken token = default)
    {
        var store = Guid.TryParse(session.Store, out var storeId)
            ? await umbracoCommerceApi.GetStoreAsync(storeId)
            : await umbracoCommerceApi.GetStoreAsync(session.Store);
        
        try
        {
            await umbracoCommerceApi.Uow.ExecuteAsync(async uow =>
            {
                var order = await umbracoCommerceApi.GetCurrentOrderAsync(store.Id)!
                    .AsWritableAsync(uow);

                var orderLineContext = order.WithOrderLine(id);
                
                if (model.Quantity.HasValue)
                {
                    await orderLineContext.SetQuantityAsync(model.Quantity.Value);
                }
                
                if (model.Properties is { Count: > 0 })
                {
                    await orderLineContext.SetPropertiesAsync(model.Properties);
                }
                
                await umbracoCommerceApi.SaveOrderAsync(order, token);
                
                uow.Complete();
            }, token);
        }
        catch (ValidationException ex)
        {
            return BadRequest(ex.Message);
        }
        
        return Ok(null);
    }
}
